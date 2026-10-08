package com.careeragent.documents

import com.careeragent.documents.domain.DocumentAnalysis
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID

/** Compare private recorded results with a separately reviewed checklist; never invokes a provider. */
@EnabledIfEnvironmentVariable(named="LOCAL_DOCUMENT_BENCHMARK_MANIFEST",matches=".+")
class PrivateDocumentSemanticAuditTest {
    @Test fun `recorded analysis meets the private expected fact inventory`() {
        val mapper=jacksonObjectMapper().findAndRegisterModules()
        val manifest=mapper.readTree(Files.readString(Path.of(System.getenv("LOCAL_DOCUMENT_BENCHMARK_MANIFEST"))))
        require(manifest.path("documents").isArray && manifest["documents"].size() in 1..20)
        val sources=manifest["documents"].map { item ->
            val path=Path.of(item["path"].asText())
            UUID.fromString(item["id"].asText()) to DocumentTextExtractor().extract(Files.readAllBytes(path),path.fileName.toString().substringAfterLast('.').lowercase())
        }
        require(sources.map { it.first }.distinct().size==sources.size)
        require(manifest.path("expected").isArray)
        val expected=manifest["expected"].map { item -> DocumentExtractionBenchmark.ExpectedFact(
            item["id"].asText(),DocumentExtractionBenchmark.Kind.valueOf(item["kind"].asText()),UUID.fromString(item["documentId"].asText()),item["quote"].asText(),
            item["fields"].properties().associate { it.key to it.value.asText() },item["contextQuote"]?.asText(),item["proseTerms"]?.map { it.asText() }.orEmpty()) }
        val analysis=mapper.readValue<DocumentAnalysis>(Files.readString(Path.of(manifest["analysisPath"].asText())))
        val report=DocumentExtractionBenchmark.assess(sources.toMap(),expected,analysis)
        // Reports contain counts only. Private phrases, paths, names and recorded payloads stay local.
        println("Private recorded document benchmark: ${report.counts()}; no provider calls")
        DocumentExtractionBenchmark.Kind.entries.forEach { kind ->
            val items=report.outcomes.filter { it.kind==kind }
            println("Expected $kind: total=${items.size}, captured=${items.count { it.finding==DocumentExtractionBenchmark.Finding.CAPTURED }}")
        }
        assertThat(report.captured).describedAs("Recorded expected fact recall").isEqualTo(expected.size)
        assertThat(report.unsupportedEvidence).describedAs("Recorded unsupported evidence").isZero()
    }
}
