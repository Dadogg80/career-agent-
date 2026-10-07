package com.careeragent.jobs.infrastructure

import com.careeragent.jobs.application.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.jsoup.Jsoup
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.*
import java.time.Instant
import javax.net.ssl.HttpsURLConnection

@Component
class NavFeedClient {
    // Only fixed official endpoints are requested; user URLs and API-returned links are never fetched.
    fun get(path: String, token: String? = null): String {
        if (path != "/api/publicToken" && !Regex("/api/v1/feedentry/[a-f0-9-]{36}").matches(path)) {
            throw ImportFailure("INVALID_URL", 400)
        }
        val host = "pam-stilling-feed.nav.no"
        try {
            val addresses = InetAddress.getAllByName(host)
            if (addresses.isEmpty() || addresses.any { !isPublicAddress(it) }) {
                throw ImportFailure("SOURCE_UNAVAILABLE", 503)
            }
            val proxyUri = System.getenv("HTTPS_PROXY")?.let { URI(it) }
            val proxy = proxyUri?.let { Proxy(Proxy.Type.HTTP, InetSocketAddress(it.host, if (it.port == -1) 80 else it.port)) } ?: Proxy.NO_PROXY
            val connection = URI("https://$host$path").toURL().openConnection(proxy) as HttpsURLConnection
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 4000
            connection.readTimeout = 5000
            connection.setRequestProperty("User-Agent", "career-agent/0.1")
            connection.setRequestProperty("Accept", if (token == null) "text/plain" else "application/json")
            token?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
            try { return readResponse(connection, token != null) }
            finally { connection.disconnect() }
        } catch (error: ImportFailure) { throw error }
        catch (_: Exception) { throw ImportFailure("SOURCE_UNAVAILABLE", 503) }
    }
    internal fun readResponse(connection: HttpsURLConnection, json: Boolean): String {
        val started = System.nanoTime()
        when (connection.responseCode) {
            404, 410 -> throw ImportFailure("SOURCE_NOT_AVAILABLE", 404)
            401, 403, 429 -> throw ImportFailure("SOURCE_UNAVAILABLE", 503)
            in 300..399 -> throw ImportFailure("SOURCE_UNAVAILABLE", 503)
            200 -> Unit
            else -> throw ImportFailure("SOURCE_UNAVAILABLE", 503)
        }
        val type = connection.contentType.orEmpty().lowercase()
        if (json && !type.startsWith("application/json")) throw ImportFailure("SOURCE_INVALID", 502)
        if (connection.contentLengthLong > 1000000) throw ImportFailure("SOURCE_TOO_LARGE", 413)
        return connection.inputStream.use { input ->
            val out = java.io.ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            while (true) {
                val n = input.read(buffer)
                if (n < 0) break
                if (out.size() + n > 1000000) throw ImportFailure("SOURCE_TOO_LARGE", 413)
                if (System.nanoTime() - started > 15_000_000_000L) throw ImportFailure("SOURCE_UNAVAILABLE", 503)
                out.write(buffer, 0, n)
            }
            out.toString(Charsets.UTF_8)
        }
    }

    companion object {
        internal fun isPublicAddress(address: InetAddress): Boolean {
            if (address.isAnyLocalAddress || address.isLoopbackAddress || address.isLinkLocalAddress || address.isSiteLocalAddress || address.isMulticastAddress) return false
            val bytes = address.address.map { it.toInt() and 255 }
            if (bytes.size == 16) return bytes[0] and 0xfe != 0xfc
            return bytes[0] != 0 && bytes[0] < 224 &&
                !(bytes[0] == 100 && bytes[1] in 64..127) &&
                !(bytes[0] == 192 && bytes[1] == 0) &&
                !(bytes[0] == 198 && bytes[1] in 18..19)
        }
    }

}

@Component
class NavVacancySource(
    private val client: NavFeedClient,
    private val mapper: ObjectMapper,
    @Value("\${NAV_API_TOKEN:}") private val configuredToken: String,
) : VacancySource {
    override fun load(id: String): ImportedJob {
        val token = configuredToken.takeIf { it.isNotBlank() }
            ?: Regex("eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+")
                .find(client.get("/api/publicToken"))?.value
            ?: throw ImportFailure("SOURCE_UNAVAILABLE", 503)
        return parse(id, client.get("/api/v1/feedentry/$id", token))
    }

    fun parse(id: String, raw: String): ImportedJob {
        try {
            val root = mapper.readTree(raw)
            if (root.path("uuid").asText() != id) throw ImportFailure("SOURCE_INVALID", 502)
            if (root.path("status").asText() != "ACTIVE") throw ImportFailure("SOURCE_NOT_AVAILABLE", 404)
            val job = root.path("ad_content")
            val title = job.path("title").asText("").trim()
            val description = Jsoup.parse(job.path("description").asText(""))
            description.select("script, style, nav, form, iframe").remove()
            // Preserve list/paragraph boundaries while returning plain text only.
            description.select("p, li, h1, h2, h3, h4, h5, h6, br").forEach { it.before("\n") }
            val body = description.wholeText().lines().map { it.trim().replace(Regex("[ \t]+"), " ") }
                .filter { it.isNotEmpty() }.joinToString("\n")
            if (title.isBlank() || title.length > 300 || body.length < 40) throw ImportFailure("SOURCE_INVALID", 502)
            // Include only useful published metadata, not arbitrary feed internals.
            val metadata = mutableListOf<String>()
            fun add(label: String, node: com.fasterxml.jackson.databind.JsonNode) {
                if (node.isTextual && node.asText().isNotBlank()) {
                    metadata += "$label: ${Jsoup.parse(node.asText()).text()}"
                }
            }
            add("Employer", job.path("employer").path("name"))
            add("About employer", job.path("employer").path("description"))
            add("Application deadline", job.path("applicationDue"))
            add("Employment type", job.path("engagementtype"))
            add("Extent", job.path("extent"))
            add("Start", job.path("starttime"))
            job.path("workLocations").takeIf { it.isArray }?.forEach { location ->
                for (field in listOf("address", "postalCode", "city", "municipal", "county", "country")) {
                    add("Location $field", location.path(field))
                }
            }
            job.path("contactList").takeIf { it.isArray }?.forEach { contact ->
                for (field in listOf("name", "title", "email", "phone")) add("Contact $field", contact.path(field))
            }
            val text = listOf(title, body, metadata.joinToString("\n")).filter { it.isNotEmpty() }.joinToString("\n\n")
            if (text.length > 15000) throw ImportFailure("SOURCE_TOO_LARGE", 413)
            return ImportedJob(JobImporter.canonicalUrl(id), title, text, Instant.now().toString())
        } catch (error: ImportFailure) { throw error }
        catch (_: Exception) { throw ImportFailure("SOURCE_INVALID", 502) }
    }
}
