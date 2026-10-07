package com.careeragent.jobs.application

import org.springframework.stereotype.Service
import java.net.URI

class ImportFailure(val code: String, val httpStatus: Int) : RuntimeException(code)
data class ImportedJob(val sourceUrl: String, val title: String, val text: String, val retrievedAt: String)

interface VacancySource {
    fun load(id: String): ImportedJob
}

@Service
class JobImporter(private val source: VacancySource) {
    fun import(url: String): ImportedJob = source.load(advertisementId(url))

    companion object {
        fun advertisementId(value: String): String {
            if (value.length > 2048) throw ImportFailure("INVALID_URL", 400)
            val uri = try { URI(value.trim()) } catch (_: Exception) { throw ImportFailure("INVALID_URL", 400) }
            if (uri.scheme != "https" || uri.userInfo != null || uri.port !in setOf(-1, 443)) {
                throw ImportFailure("INVALID_URL", 400)
            }
            if (uri.host?.lowercase() != "arbeidsplassen.nav.no") throw ImportFailure("SOURCE_UNSUPPORTED", 400)
            val path = Regex("^/stillinger/stilling/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/?$")
            return path.matchEntire(uri.rawPath ?: "")?.groupValues?.get(1)?.lowercase()
                ?: throw ImportFailure("INVALID_URL", 400)
        }
        fun canonicalUrl(id: String) = "https://arbeidsplassen.nav.no/stillinger/stilling/$id"
    }
}
