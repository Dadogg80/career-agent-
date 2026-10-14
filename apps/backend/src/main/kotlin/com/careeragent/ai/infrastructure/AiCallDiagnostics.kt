package com.careeragent.ai.infrastructure

import com.careeragent.ai.application.AiFailure
import com.careeragent.ai.application.AiOutcomeRecorder
import com.careeragent.ai.application.AiTask
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.net.InetAddress
import java.time.Instant
import java.util.UUID

data class AiDiagnosticCall(
    val id: String,
    val groupId: String,
    val groupLabel: String,
    val sequence: Int,
    val task: String,
    val provider: String,
    val model: String,
    val endpoint: String,
    val startedAt: Instant,
    val durationMs: Long?,
    val status: String,
    val instructions: String,
    val input: String,
    val schema: String,
    val response: String?,
    val errorCode: String?,
    val truncatedFields: List<String>,
    val downstreamOutcome: String? = null,
)

data class AiDiagnosticSnapshot(
    val supported: Boolean,
    val capturing: Boolean,
    val retainedMinutes: Int,
    val maxCalls: Int,
    val calls: List<AiDiagnosticCall>,
)

@Component
class AiCallDiagnostics(
    @Value("\${AI_CALL_DIAGNOSTICS_ENABLED:true}") private val supported: Boolean,
) : AiOutcomeRecorder {
    private data class Entry(
        val call: AiDiagnosticCall,
        val characters: Int,
    )

    private val lock = Any()
    private val entries = ArrayDeque<Entry>()
    @Volatile private var capturing = false
    private var captureExpiresAt: Instant? = null

    fun isSupported() = supported

    fun setCapturing(enabled: Boolean) {
        synchronized(lock) {
            if (!supported) return
            capturing = enabled
            captureExpiresAt = if (enabled) Instant.now().plusSeconds(CAPTURE_MINUTES * 60L) else null
        }
    }

    fun clear() = synchronized(lock) { entries.clear() }

    /** Records document parsing separately; a valid provider exchange remains SUCCESS. */
    override fun documentValidationOutcome(task: AiTask, outcome: String) {
        if (task !in setOf(AiTask.DOCUMENT_EXTRACTION, AiTask.PROFILE_SUMMARY) ||
            outcome !in setOf("VALIDATED", "INVALID_RESULT", "RECOVERED_INVALID_RESULT")) return
        val request = (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request
            ?.takeIf { it.isLoopback() } ?: return
        val workflowId = DOCUMENT_WORKFLOW.matchEntire(request.requestURI)?.groupValues?.get(1) ?: return
        synchronized(lock) {
            expireCapture()
            if (!supported || !capturing) return
            val index = entries.indexOfLast {
                it.call.groupId == "document-workflow:$workflowId" &&
                    it.call.task == task.name && it.call.status == "SUCCESS"
            }
            if (index < 0) return
            val entry = entries.removeAt(index)
            add(entry.copy(call = entry.call.copy(downstreamOutcome = outcome)))
        }
    }

    fun snapshot(): AiDiagnosticSnapshot = synchronized(lock) {
        expireCapture()
        purgeExpired()
        AiDiagnosticSnapshot(supported, capturing, RETENTION_MINUTES, MAX_CALLS, entries.map { it.call }.sortedBy { it.startedAt })
    }

    fun <T> trace(
        task: AiTask,
        provider: String,
        model: String,
        endpoint: String,
        instructions: String,
        input: String,
        schema: String,
        action: (AiDiagnosticTrace) -> T,
    ): T {
        val request = (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request
            ?.takeIf { it.isLoopback() }
        val entry = synchronized(lock) {
            expireCapture()
            if (supported && capturing && request != null) start(request, task, provider, model, endpoint, instructions, input, schema) else null
        }
        val trace = AiDiagnosticTrace()
        try {
            val result = action(trace)
            if (entry != null) finish(entry.id, response = trace.response ?: result.toString(), errorCode = trace.errorCode)
            return result
        } catch (failure: Exception) {
            if (entry != null) finish(entry.id, response = trace.response, errorCode = trace.errorCode ?: safeCode(failure))
            throw failure
        }
    }

    private fun start(
        request: HttpServletRequest,
        task: AiTask,
        provider: String,
        model: String,
        endpoint: String,
        instructions: String,
        input: String,
        schema: String,
    ): AiDiagnosticCall = synchronized(lock) {
        purgeExpired()
        val path = request.requestURI
        val workflowId = DOCUMENT_WORKFLOW.matchEntire(path)?.groupValues?.get(1)
        val matchJobId = JOB_MATCH.matchEntire(path)?.groupValues?.get(1)
        val tailoringJobId = JOB_TAILORING.matchEntire(path)?.groupValues?.get(1)
        val groupId = workflowId?.let { "document-workflow:$it" }
            ?: matchJobId?.let { "job-match:$it" }
            ?: tailoringJobId?.let { "job-tailoring:$it" }
            ?: UUID.randomUUID().toString()
        val groupLabel = workflowId?.let { "Document workflow · ${it.take(8)}" }
            ?: matchJobId?.let { "Personal match · ${it.take(8)}" }
            ?: tailoringJobId?.let { "CV tailoring · ${it.take(8)}" }
            ?: "$task · ${path.substringAfterLast('/')}"
        val sequence = (entries.asSequence().filter { it.call.groupId == groupId }.maxOfOrNull { it.call.sequence } ?: 0) + 1
        val (savedInstructions, instructionsCut) = bounded(instructions)
        val (savedInput, inputCut) = bounded(input)
        val (savedSchema, schemaCut) = bounded(schema)
        val fieldsCut = listOfNotNull(
            "instructions".takeIf { instructionsCut },
            "input".takeIf { inputCut },
            "schema".takeIf { schemaCut },
        )
        val call = AiDiagnosticCall(
            id = UUID.randomUUID().toString(),
            groupId = groupId,
            groupLabel = groupLabel,
            sequence = sequence,
            task = task.name,
            provider = provider,
            model = model,
            endpoint = endpoint,
            startedAt = Instant.now(),
            durationMs = null,
            status = "RUNNING",
            instructions = savedInstructions,
            input = savedInput,
            schema = savedSchema,
            response = null,
            errorCode = null,
            truncatedFields = fieldsCut,
        )
        add(Entry(call, savedInstructions.length + savedInput.length + savedSchema.length))
        call
    }

    private fun finish(id: String, response: String? = null, errorCode: String? = null) = synchronized(lock) {
        val index = entries.indexOfFirst { it.call.id == id }
        if (index < 0) return@synchronized
        val previous = entries.removeAt(index)
        val (savedResponse, responseCut) = response?.let(::bounded) ?: (null to false)
        val call = previous.call.copy(
            durationMs = java.time.Duration.between(previous.call.startedAt, Instant.now()).toMillis().coerceAtLeast(0),
            status = if (errorCode == null) "SUCCESS" else "ERROR",
            response = savedResponse,
            errorCode = errorCode,
            truncatedFields = previous.call.truncatedFields + listOfNotNull("response".takeIf { responseCut }),
        )
        add(Entry(call, previous.characters + (savedResponse?.length ?: 0)))
    }

    private fun add(entry: Entry) {
        entries.addLast(entry)
        while (entries.size > MAX_CALLS || entries.sumOf { it.characters } > MAX_TOTAL_CHARACTERS) {
            entries.removeFirst()
        }
    }

    private fun purgeExpired() {
        val cutoff = Instant.now().minusSeconds(RETENTION_MINUTES * 60L)
        entries.removeAll { it.call.startedAt.isBefore(cutoff) }
    }

    private fun expireCapture() {
        if (captureExpiresAt?.isBefore(Instant.now()) == true) {
            capturing = false
            captureExpiresAt = null
        }
    }

    private fun bounded(value: String): Pair<String, Boolean> =
        if (value.length <= MAX_FIELD_CHARACTERS) value to false
        else value.take(MAX_FIELD_CHARACTERS) to true

    private fun safeCode(failure: Exception): String = when (failure) {
        is AiFailure -> failure.code
        else -> when (failure.javaClass.simpleName) {
            "ImportFailure" -> "SOURCE_UNAVAILABLE"
            else -> "AI_UNAVAILABLE"
        }
    }

    private fun HttpServletRequest.isLoopback(): Boolean = try {
        InetAddress.getByName(remoteAddr).isLoopbackAddress
    } catch (_: Exception) {
        false
    }

    class AiDiagnosticTrace internal constructor() {
        internal var response: String? = null
            private set
        internal var errorCode: String? = null
            private set

        fun response(text: String) {
            response = text
        }

        fun failure(code: String) {
            errorCode = code.take(80)
        }
    }

    companion object {
        private const val RETENTION_MINUTES = 10
        private const val CAPTURE_MINUTES = 30
        private const val MAX_CALLS = 200
        private const val MAX_FIELD_CHARACTERS = 60_000
        private const val MAX_TOTAL_CHARACTERS = 12_000_000
        private val DOCUMENT_WORKFLOW = Regex("^/api/profile/me/documents/workflow/([0-9a-fA-F-]{36})/next$")
        private val JOB_MATCH = Regex("^/api/profile/me/jobs/([0-9a-fA-F-]{36})/match$")
        private val JOB_TAILORING = Regex("^/api/profile/me/jobs/([0-9a-fA-F-]{36})/tailoring$")
    }
}

data class AiDiagnosticCaptureRequest(val capturing: Boolean)

@RestController
@RequestMapping("/api/dev/ai-calls")
class AiCallDiagnosticsController(private val diagnostics: AiCallDiagnostics) {
    @GetMapping
    fun get(request: HttpServletRequest): ResponseEntity<Any> =
        if (!request.isLoopback()) response(HttpStatus.FORBIDDEN, mapOf("code" to "ACCESS_DENIED"))
        else response(HttpStatus.OK, diagnostics.snapshot())

    @PostMapping
    fun configure(
        @RequestBody body: AiDiagnosticCaptureRequest,
        request: HttpServletRequest,
    ): ResponseEntity<Any> {
        if (!request.isLoopback()) return response(HttpStatus.FORBIDDEN, mapOf("code" to "ACCESS_DENIED"))
        if (!diagnostics.isSupported()) return response(HttpStatus.CONFLICT, mapOf("code" to "AI_DIAGNOSTICS_DISABLED"))
        diagnostics.setCapturing(body.capturing)
        return response(HttpStatus.OK, diagnostics.snapshot())
    }

    @DeleteMapping
    fun clear(request: HttpServletRequest): ResponseEntity<Any> =
        if (!request.isLoopback()) response(HttpStatus.FORBIDDEN, mapOf("code" to "ACCESS_DENIED"))
        else {
            diagnostics.clear()
            response(HttpStatus.OK, diagnostics.snapshot())
        }

    private fun response(status: HttpStatus, body: Any) = ResponseEntity.status(status)
        .cacheControl(CacheControl.noStore())
        .body(body)

    private fun HttpServletRequest.isLoopback(): Boolean = try {
        InetAddress.getByName(remoteAddr).isLoopbackAddress
    } catch (_: Exception) {
        false
    }
}
