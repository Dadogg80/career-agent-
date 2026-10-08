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
    @Test fun `nested technical headings preserve their literal employer but global and peer sections reset it`() {
        val source="## Example AS\nSenior Developer\n### Frontend:\nReact, Next.js\n## Other AS\nConsultant\n### Frontend\nReact, TypeScript\n## Core competencies:\n### Frontend\nReact, Vue\n## Third AS\nSenior Developer\n## Frontend\nReact, Svelte"
        assertThat(DocumentAnalysisPlanner.contextProof(source,"React, Next.js","Example AS",null)).isEqualTo("## Example AS")
        assertThat(DocumentAnalysisPlanner.contextProof(source,"React, TypeScript","Other AS",null)).isEqualTo("## Other AS")
        assertThat(DocumentAnalysisPlanner.contextProof(source,"React, TypeScript","Example AS",null)).isNull()
        assertThat(DocumentAnalysisPlanner.contextProof(source,"React, Vue","Other AS",null)).isNull()
        assertThat(DocumentAnalysisPlanner.contextProof(source,"React, Svelte","Third AS",null)).isNull()
    }
    @Test fun `plain labeled technical subsections retain the dated context in later batches`() {
        val header="08.2021 – 01.2024 Example AS – Senior Developer"
        val source=header+"\nFrontend:\n"+"Implemented applications with React and TypeScript.\n".repeat(150)
        val batches=DocumentAnalysisPlanner.batches(mapOf(UUID.randomUUID() to source))
        assertThat(batches.drop(1)).allMatch { it.text.startsWith(header+"\n") }
        assertThat(batches.sumOf { it.characters }).isEqualTo(source.length)
    }
}
