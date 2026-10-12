package com.careeragent.documents

import com.careeragent.ai.application.AiModel
import com.careeragent.documents.application.DocumentDraftExtractor
import com.careeragent.documents.domain.AnalysisBatch
import com.careeragent.profile.domain.EntryKind
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.util.UUID

class ProjectHistoryExtractionTest {
 @Test fun `own projects remain separate history without inventing an employer or month`() {
  val source="01 Atlas Planner\n2023-2025 • Own prototype\nMy role: Product developer\n02 Boreal Tools\nPeriod unknown • Own project\nMy role: API developer"
  val mapper=jacksonObjectMapper()
  val model=object:AiModel{override fun generateJson(system:String,user:String,schema:Map<String,Any>):String {
   assertThat(system).contains("one PROJECT history entry for EACH","Leave organization empty")
   return mapper.writeValueAsString(mapOf("competencies" to emptyList<Any>(),"profile" to emptyList<Any>(),"history" to listOf(
    mapOf("kind" to "PROJECT","title" to "Atlas Planner","organization" to "","client" to "","deliveryRole" to "Product developer","periodText" to "2023-2025","description" to "Own prototype","evidenceIds" to listOf(0,1,2)),
    mapOf("kind" to "PROJECT","title" to "Boreal Tools","organization" to "","client" to "","deliveryRole" to "API developer","periodText" to "","description" to "Own project","evidenceIds" to listOf(3,4,5)))))
  }}
  val result=DocumentDraftExtractor(model,mapper).extract(AnalysisBatch(UUID.randomUUID(),source,source.length),source,"nb")
  assertThat(result.entries.map{it.content.title}).containsExactly("Atlas Planner","Boreal Tools")
  assertThat(result.entries.all{it.content.kind==EntryKind.PROJECT && it.content.organization.isEmpty() && it.content.startMonth==null && it.content.endMonth==null}).isTrue()
  assertThat(result.entries[0].periodText).isEqualTo("2023-2025")
  assertThat(result.omitted).isZero()
 }
 @Test fun `employment still requires supported organization and project cannot fabricate one`() {
  val mapper=jacksonObjectMapper();val source="Atlas Planner\nOwn prototype";val passages=source.lines().map{DocumentDraftExtractor.Passage(it)}
  val extractor=DocumentDraftExtractor(object:AiModel{override fun generateJson(system:String,user:String,schema:Map<String,Any>)=""},mapper)
  for((kind,organization) in listOf("EMPLOYMENT" to "","PROJECT" to "Invented Company")){
   val output=mapper.writeValueAsString(mapOf("competencies" to emptyList<Any>(),"profile" to emptyList<Any>(),"history" to listOf(mapOf("kind" to kind,"title" to "Atlas Planner","organization" to organization,"client" to "","deliveryRole" to "","periodText" to "","description" to "Own prototype","evidenceIds" to listOf(0,1)))))
   assertThat(extractor.parse(output,passages,UUID.randomUUID(),source,"nb").entries).isEmpty()
  }
 }
}
