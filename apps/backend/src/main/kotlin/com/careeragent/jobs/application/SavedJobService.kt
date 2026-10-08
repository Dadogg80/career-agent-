package com.careeragent.jobs.application

import com.careeragent.jobs.domain.*
import com.careeragent.profile.application.VerifiedIdentity
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.net.URI
import java.text.Normalizer
import java.util.UUID

class SavedJobFailure(val code: String, val status: Int) : RuntimeException(code)
interface SavedJobRepository {
    fun list(identity: VerifiedIdentity): List<SavedJob>
    fun get(identity: VerifiedIdentity, id: UUID): SavedJob
    fun save(identity: VerifiedIdentity, content: SavedJobContent): SavedJob
    fun delete(identity: VerifiedIdentity, id: UUID)
}
@Service
@Profile("persistence")
class SavedJobService(private val repository: SavedJobRepository) {
    fun list(identity: VerifiedIdentity) = repository.list(identity)
    fun get(identity: VerifiedIdentity, id: UUID) = repository.get(identity, id)
    fun delete(identity: VerifiedIdentity, id: UUID) = repository.delete(identity, id)
    fun save(identity: VerifiedIdentity, content: SavedJobContent): SavedJob {
        fun bounded(value: String, max: Int) = value.isNotBlank() && value.length <= max && value.none { it.isISOControl() && it !in "\n\r\t" }
        fun normal(value: String) = Normalizer.normalize(value, Normalizer.Form.NFC).replace(Regex("(?U)\\s+"), " ").trim()
        fun quote(value: String, max: Int) = bounded(value, max) && normal(content.text).contains(normal(value))
        try {
            require(bounded(content.title, 200) && content.text.trim().length >= 40 && bounded(content.text, 15000))
            require(content.locale in setOf("nb", "en") && content.sourceType in setOf("PASTED_TEXT", "NAV_API", "GROQ_BROWSER_EXCERPT"))
            require(content.omittedItems >= 0 && content.requirements.size <= 12 && content.facts.size <= 10)
            require(content.requirements.all { bounded(it.label, 200) && quote(it.quote, 600) })
            require(content.facts.all { bounded(it.label, 100) && bounded(it.value, 500) && quote(it.quote, 1000) })
            if (content.sourceUrl != null) {
                require(content.sourceUrl.length <= 2048)
                val url = URI(content.sourceUrl)
                require(url.scheme == "https" && !url.host.isNullOrBlank() && url.rawUserInfo == null && url.port == -1)
            }
            require((content.sourceType == "PASTED_TEXT") || (content.sourceUrl != null && content.retrievedAt != null))
        } catch (_: Exception) { throw SavedJobFailure("SAVED_JOB_INVALID", 400) }
        return repository.save(identity, content.copy(title = content.title.trim()))
    }
}
