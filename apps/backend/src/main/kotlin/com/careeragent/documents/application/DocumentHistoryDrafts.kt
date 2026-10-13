package com.careeragent.documents.application

import com.careeragent.documents.domain.CareerHistoryDraft
import com.careeragent.documents.domain.CompetencySource
import java.text.Normalizer
import java.util.Locale

/** Aggregate source-checked drafts, never use generated prose as career identity. */
internal object DocumentHistoryDrafts {
    private fun normal(value: String) = Normalizer.normalize(value, Normalizer.Form.NFC)
        .trim().replace(Regex("(?U)\\s+"), " ").lowercase(Locale.ROOT)

    fun merge(drafts: List<CareerHistoryDraft>): List<CareerHistoryDraft> = drafts.groupBy { draft ->
        val content = draft.content
        listOf(content.kind.name, normal(content.title), normal(content.organization), normal(content.client),
            normal(content.deliveryRole), normal(draft.periodText), content.startMonth.orEmpty(),
            content.endMonth.orEmpty(), content.ongoing.toString(),
            // Unknown period or relationship cannot establish equality across distinct source accounts.
            if (draft.periodText.isBlank() || content.organization.isBlank() && content.client.isBlank()) draft.documentId.toString() else "",
            if (draft.periodText.isBlank()) normal(draft.quote) else "")
    }.values.map { group ->
        val first = group.first()
        val primary = CompetencySource(first.documentId, first.quote)
        // Keep the first wording, key and review link stable; additional accounts remain inspectable as sources.
        first.copy(additionalSources = (first.additionalSources + group.drop(1).flatMap {
            listOf(CompetencySource(it.documentId, it.quote)) + it.additionalSources
        }).distinct().filterNot { it == primary }.take(100))
    }
}
