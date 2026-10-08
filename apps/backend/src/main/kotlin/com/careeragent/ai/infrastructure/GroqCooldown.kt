package com.careeragent.ai.infrastructure

import org.springframework.stereotype.Component
import java.util.concurrent.atomic.AtomicLong
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.ceil

@Component
class GroqCooldown {
    private val until = AtomicLong(0)

    fun remainingSeconds(): Int = ceil((until.get() - System.currentTimeMillis()).coerceAtLeast(0) / 1000.0).toInt()

    fun record(retryAfter: String?, providerMessage: String? = null): Int {
        val numeric = retryAfter?.toDoubleOrNull()?.takeIf { it.isFinite() && it > 0 }
        val date = if (numeric == null && retryAfter != null) try {
            (ZonedDateTime.parse(retryAfter, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant().toEpochMilli() - System.currentTimeMillis()) / 1000.0
        } catch (_: Exception) { null } else null
        // Groq can report long token/day waits in its error message when Retry-After is absent.
        // Extract only the duration, never retain or expose the message (which may include account details).
        val match = Regex("Please try again in (?:(\\d+(?:\\.\\d+)?)h)?(?:(\\d+(?:\\.\\d+)?)m)?(?:(\\d+(?:\\.\\d+)?)s)?[. ]")
            .find(providerMessage.orEmpty().take(4096))
        val messageSeconds = match?.let { (it.groupValues[1].toDoubleOrNull() ?: 0.0) * 3600 +
            (it.groupValues[2].toDoubleOrNull() ?: 0.0) * 60 + (it.groupValues[3].toDoubleOrNull() ?: 0.0) }
        val hint = listOfNotNull(numeric, date, messageSeconds).filter { it.isFinite() && it > 0 }.maxOrNull() ?: 60.0
        val seconds = ceil(hint.coerceIn(1.0, 86400.0)).toInt()
        val deadline = System.currentTimeMillis() + seconds * 1000L
        until.updateAndGet { previous -> maxOf(previous, deadline) }
        return remainingSeconds()
    }
}
