package com.careeragent.documents

import com.careeragent.documents.domain.DocumentAnalysis
import java.text.Normalizer
import java.util.Locale
import java.util.UUID

/** Reviewed expectations measure fact recall, separately from quotation usage. Never calls AI. */
object DocumentExtractionBenchmark {
    enum class Kind { COMPETENCY, HISTORY, PROFILE }
    enum class Finding { CAPTURED, MISSING, WRONG_CONTEXT, WRONG_FIELDS }
    data class ExpectedFact(val id: String, val kind: Kind, val documentId: UUID, val quote: String,
        val fields: Map<String,String>, val contextQuote: String? = null, val proseTerms: List<String> = emptyList())
    data class Outcome(val id: String, val kind: Kind, val finding: Finding, val mismatches: Set<String> = emptySet())
    data class Report(val outcomes: List<Outcome>, val unsupportedEvidence: Int) {
        val captured get()=outcomes.count { it.finding==Finding.CAPTURED }
        fun counts()=mapOf("expected" to outcomes.size,"captured" to captured,"missing" to outcomes.count { it.finding==Finding.MISSING },
            "wrongContext" to outcomes.count { it.finding==Finding.WRONG_CONTEXT },"wrongFields" to outcomes.count { it.finding==Finding.WRONG_FIELDS },"unsupportedEvidence" to unsupportedEvidence)
    }
    private data class Source(val documentId: UUID, val quote: String)
    private data class Actual(val kind: Kind, val fields: Map<String,String>, val sources: List<Source>, val contextQuote: String?, val prose: String)
    private val allowed=mapOf(
        Kind.COMPETENCY to setOf("skill","context","category"),
        Kind.HISTORY to setOf("kind","title","organization","client","deliveryRole","periodText","startMonth","endMonth","ongoing"),
        Kind.PROFILE to setOf("kind"))
    private fun normal(value: String)=Normalizer.normalize(value,Normalizer.Form.NFC).trim().replace(Regex("(?U)\\s+")," ").lowercase(Locale.ROOT)
    private fun literal(label: String, quote: String)=label.isNotBlank() && Regex("(?<![\\p{L}\\p{N}_+#])"+Regex.escape(label)+"(?![\\p{L}\\p{N}_+#])",RegexOption.IGNORE_CASE).containsMatchIn(quote)

    fun assess(sources: Map<UUID,String>, expected: List<ExpectedFact>, analysis: DocumentAnalysis): Report {
        require(expected.size in 1..1000 && expected.map { it.id }.distinct().size==expected.size) { "Invalid expected fact inventory" }
        expected.forEach { fact ->
            require(fact.id.matches(Regex("[a-zA-Z0-9_-]{1,80}")) && fact.quote.isNotBlank() &&
                sources[fact.documentId]?.contains(fact.quote)==true && fact.fields.isNotEmpty() && fact.fields.keys.all { it in allowed.getValue(fact.kind) } &&
                (fact.contextQuote==null || sources.getValue(fact.documentId).contains(fact.contextQuote)) && fact.proseTerms.all { it.isNotBlank() }) { "Invalid expected source fact" }
            require(when(fact.kind) {
                Kind.COMPETENCY -> fact.fields["skill"]?.let { literal(it,fact.quote) }==true
                Kind.HISTORY -> fact.fields.keys.containsAll(listOf("kind","title","organization")) && literal(fact.fields.getValue("title"),fact.quote) && literal(fact.fields.getValue("organization"),fact.quote)
                Kind.PROFILE -> fact.fields.containsKey("kind") && fact.proseTerms.isNotEmpty()
            }) { "Expected fact needs independently selected source labels" }
        }
        val actual=analysis.suggestions.map { item -> Actual(Kind.COMPETENCY,mapOf("skill" to item.skill,"context" to item.context,"category" to item.category),
            listOfNotNull(item.documentId?.let { Source(it,item.quote) })+item.additionalSources.map { Source(it.documentId,it.quote) },item.contextQuote,item.statement) } +
            analysis.careerEntries.map { item -> val c=item.content
                Actual(Kind.HISTORY,mapOf("kind" to c.kind.name,"title" to c.title,"organization" to c.organization,"client" to c.client,"deliveryRole" to c.deliveryRole,
                    "periodText" to item.periodText,"startMonth" to c.startMonth.orEmpty(),"endMonth" to c.endMonth.orEmpty(),"ongoing" to c.ongoing.toString()),
                    listOf(Source(item.documentId,item.quote))+item.additionalSources.map { Source(it.documentId,it.quote) },null,c.description) } +
            analysis.profile.map { item -> Actual(Kind.PROFILE,mapOf("kind" to item.kind),
                listOf(Source(item.documentId,item.quote))+item.additionalSources.map { Source(it.documentId,it.quote) },null,item.text) }
        fun valid(source: Source)=source.quote.isNotBlank() && sources[source.documentId]?.contains(source.quote)==true
        fun supported(item: Actual)=item.sources.isNotEmpty() && item.sources.all(::valid) && when(item.kind) {
            Kind.COMPETENCY -> item.sources.any { literal(item.fields.getValue("skill"),it.quote) } &&
                (item.contextQuote==null || item.sources.any { sources[it.documentId]?.contains(item.contextQuote)==true && literal(item.fields.getValue("context"),item.contextQuote) })
            Kind.HISTORY -> item.sources.any { literal(item.fields.getValue("title"),it.quote) && literal(item.fields.getValue("organization"),it.quote) }
            Kind.PROFILE -> true
        }
        val supported=actual.filter(::supported)
        val outcomes=expected.map { fact ->
            // Evidence in another document, or an uncited heading, cannot satisfy this fact.
            val anchored=supported.filter { item -> item.kind==fact.kind && item.sources.any { it.documentId==fact.documentId && it.quote.contains(fact.quote) } &&
                when(fact.kind) {
                    Kind.COMPETENCY -> normal(item.fields.getValue("skill"))==normal(fact.fields.getValue("skill"))
                    Kind.HISTORY -> normal(item.fields.getValue("title"))==normal(fact.fields.getValue("title"))
                    Kind.PROFILE -> normal(item.fields.getValue("kind"))==normal(fact.fields.getValue("kind"))
                } }
            val differences=anchored.map { item ->
                fact.fields.filter { (key,value) -> normal(item.fields[key].orEmpty())!=normal(value) }.keys +
                    if(fact.contextQuote!=null && item.contextQuote!=fact.contextQuote && item.sources.none { it.documentId==fact.documentId && it.quote.contains(fact.contextQuote) })setOf("contextQuote") else emptySet()
            }.mapIndexed { index, fields -> fields + if(fact.proseTerms.any { !literal(normal(it),normal(anchored[index].prose)) })setOf("proseTerms") else emptySet() }
            val mismatch=differences.minByOrNull { it.size }.orEmpty()
            Outcome(fact.id,fact.kind,when {
                anchored.isEmpty() -> Finding.MISSING
                differences.any { it.isEmpty() } -> Finding.CAPTURED
                mismatch.any { it in setOf("context","contextQuote","organization","client") } -> Finding.WRONG_CONTEXT
                else -> Finding.WRONG_FIELDS
            },mismatch)
        }
        return Report(outcomes,actual.size-supported.size)
    }
}
