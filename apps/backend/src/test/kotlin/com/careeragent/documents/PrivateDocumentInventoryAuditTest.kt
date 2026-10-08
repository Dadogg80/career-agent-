package com.careeragent.documents

import com.careeragent.documents.application.DocumentCompetencyInventory
import com.careeragent.documents.application.DocumentEvidenceInventory
import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.documents.infrastructure.DocumentTextExtractor
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID

/** Private expected-evidence manifests and originals remain outside the checkout. No AI calls. */
@EnabledIfEnvironmentVariable(named="LOCAL_DOCUMENT_AUDIT_MANIFEST", matches=".+")
class PrivateDocumentInventoryAuditTest {
    @Test fun `local originals preserve independently selected terms and exact inventory locations`() {
        val manifest=jacksonObjectMapper().readTree(Files.readString(Path.of(System.getenv("LOCAL_DOCUMENT_AUDIT_MANIFEST"))))
        assertThat(manifest.isArray).isTrue()
        var terms=0;var passages=0;var recovered=0
        manifest.forEachIndexed { index,item ->
            val path=Path.of(item["path"].asText())
            val text=DocumentTextExtractor().extract(Files.readAllBytes(path),path.fileName.toString().substringAfterLast('.').lowercase())
            val normalized=text.replace(Regex("(?U)\\s+")," ").lowercase()
            item["expectedTerms"].forEach { term ->
                assertThat(normalized.contains(term.asText().lowercase())).describedAs("Document %s preserves independently selected term %s",index+1,term.asText()).isTrue()
                terms++
            }
            val id=UUID.randomUUID()
            val inventory=DocumentEvidenceInventory.inventory(id,text)
            assertThat(inventory.size).describedAs("Document %s relevant passages",index+1).isGreaterThanOrEqualTo(item["minimumPassages"].asInt())
            assertThat(inventory).allMatch { text.substring(it.start,it.start+it.quote.length)==it.quote }
            val lists=DocumentCompetencyInventory.recover(AnalysisBatch(id,text,text.length),text,"en",emptyList())
            item["expectedListedSkills"].forEach { skill ->
                assertThat(lists.map { it.skill.lowercase() }).describedAs("Document %s explicit list recovery",index+1).contains(skill.asText().lowercase())
            }
            passages+=inventory.size;recovered+=lists.size
        }
        println("Local private audit: documents=${manifest.size()} expectedTerms=$terms exactPassages=$passages literalListLabels=$recovered; no provider calls")
    }
}
