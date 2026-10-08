package com.careeragent.documents

import com.careeragent.documents.application.DocumentAnalysisPlanner
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class DocumentContextPlannerTest {
    @Test fun `an inline dated organization header supports its own following contribution only`() {
        val first="08.2021 – 01.2024 Example AS – Senior Developer"
        val second="2019 – 2021 Other Company – Consultant"
        val source="$first\nBuilt APIs with Kotlin.\n$second\nBuilt applications with React.\nSkills\nTypeScript, Docker."
        assertThat(DocumentAnalysisPlanner.contextProof(source,"Built APIs with Kotlin.","Example AS",null)).isEqualTo(first)
        assertThat(DocumentAnalysisPlanner.contextProof(source,"Built applications with React.","Other Company",null)).isEqualTo(second)
        assertThat(DocumentAnalysisPlanner.contextProof(source,"Built applications with React.","Example AS",null)).isNull()
        assertThat(DocumentAnalysisPlanner.contextProof(source,"TypeScript, Docker.","Other Company",null)).isNull()
    }
    @Test fun `automatic portions carry the dated header without claiming repeated context as new coverage`() {
        val header="2021 – present Example AS – Senior Developer"
        val source=header+"\n"+"Delivered APIs with Kotlin and PostgreSQL.\n".repeat(150)
        val batches=DocumentAnalysisPlanner.batches(mapOf(UUID.randomUUID() to source))
        assertThat(batches.size).isGreaterThan(1)
        assertThat(batches.drop(1)).allMatch { it.text.startsWith(header+"\n") }
        assertThat(batches.sumOf { it.characters }).isEqualTo(source.length)
        assertThat(DocumentAnalysisPlanner.contextProof(source,"Delivered APIs with Kotlin and PostgreSQL.","Other Company",header)).isNull()
    }
}
