package com.careeragent.jobs.application

import org.springframework.stereotype.Service
import java.net.URI

class ImportFailure(val code: String, val httpStatus: Int) : RuntimeException(code)
data class ImportedJob(val sourceUrl: String, val title: String, val text: String, val retrievedAt: String, val sourceType: String = "NAV_API")

interface VacancySource {
    fun load(id: String): ImportedJob
}

interface AdvertisementBrowser {
    fun load(url: String): ImportedJob
}

@Service
class JobImporter(private val source: VacancySource, private val browser: AdvertisementBrowser) {
    fun import(url: String): ImportedJob {
        val host = validatedUri(url).host?.lowercase()
        return if (host in setOf("www.finn.no", "finn.no")) browser.load(finnUrl(url))
            else source.load(advertisementId(url))
    }

    companion object {
        private fun validatedUri(value: String): URI {
            if (value.length > 2048) throw ImportFailure("INVALID_URL", 400)
            val uri = try { URI(value.trim()) } catch (_: Exception) { throw ImportFailure("INVALID_URL", 400) }
            if (uri.scheme != "https" || uri.userInfo != null || uri.port !in setOf(-1, 443)) {
                throw ImportFailure("INVALID_URL", 400)
            }
            return uri
        }
        fun finnUrl(value: String): String {
            val uri = validatedUri(value)
            if (uri.host?.lowercase() !in setOf("www.finn.no", "finn.no")) throw ImportFailure("SOURCE_UNSUPPORTED", 400)
            val id = Regex("^/job/ad/([1-9][0-9]{5,11})/?$").matchEntire(uri.rawPath ?: "")?.groupValues?.get(1)
                ?: throw ImportFailure("INVALID_URL", 400)
            return "https://www.finn.no/job/ad/$id"
        }
        fun advertisementId(value: String): String {
            val uri = validatedUri(value)
            if (uri.host?.lowercase() != "arbeidsplassen.nav.no") throw ImportFailure("SOURCE_UNSUPPORTED", 400)
            val path = Regex("^/stillinger/stilling/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/?$")
            return path.matchEntire(uri.rawPath ?: "")?.groupValues?.get(1)?.lowercase()
                ?: throw ImportFailure("INVALID_URL", 400)
        }
        fun canonicalUrl(id: String) = "https://arbeidsplassen.nav.no/stillinger/stilling/$id"
    }
}
