package com.careeragent.profile.application

import com.careeragent.profile.domain.*
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.time.YearMonth
import java.util.UUID

class EntryFailure(val code: String, val status: Int) : RuntimeException(code)
interface CareerEntryRepository {
 fun evidence(identity:VerifiedIdentity,id:UUID):List<CareerEntryEvidence> = emptyList()
 fun list(identity: VerifiedIdentity): List<CareerEntry>
 fun create(identity: VerifiedIdentity, content: CareerEntryContent): CareerEntry
 fun edit(identity: VerifiedIdentity, id: UUID, content: CareerEntryContent, revision: Long): CareerEntry
 fun review(identity: VerifiedIdentity, id: UUID, revision: Long, decision: ReviewDecision): CareerEntry
 fun history(identity: VerifiedIdentity, id: UUID): List<CareerEntry>
 fun delete(identity: VerifiedIdentity, id: UUID, revision: Long)
}
@Service
@Profile("persistence")
class CareerEntryService(private val entries: CareerEntryRepository) {
 fun evidence(identity:VerifiedIdentity,id:UUID)=entries.evidence(identity,id)
 fun list(identity: VerifiedIdentity) = entries.list(identity)
 fun create(identity: VerifiedIdentity, content: CareerEntryContent) = entries.create(identity, validate(content))
 fun edit(identity: VerifiedIdentity, id: UUID, content: CareerEntryContent, revision: Long): CareerEntry { revision(revision); return entries.edit(identity, id, validate(content), revision) }
 fun review(identity: VerifiedIdentity, id: UUID, revision: Long, decision: ReviewDecision): CareerEntry { revision(revision); return entries.review(identity, id, revision, decision) }
 fun history(identity: VerifiedIdentity, id: UUID) = entries.history(identity, id)
 fun delete(identity: VerifiedIdentity, id: UUID, revision: Long) { revision(revision); entries.delete(identity, id, revision) }
 private fun revision(value: Long) { if (value < 1) throw EntryFailure("ENTRY_INVALID",400) }
 private fun validate(c: CareerEntryContent): CareerEntryContent {
  fun text(value: String, max: Int, empty: Boolean = false) = value.length <= max && (empty || value.isNotBlank()) && value.none { it.isISOControl() && it !in "\n\r\t" }
  try {
   require(text(c.title,200) && text(c.organization,200) && text(c.client,200,true) && text(c.deliveryRole,200,true) && text(c.description,2000,true) && text(c.sourceNote,500))
   fun month(v: String?): YearMonth? { if (v == null) return null; require(v.matches(Regex("[0-9]{4}-[0-9]{2}"))); return YearMonth.parse(v).also { require(it.year in 1900..2200) } }
   val start = month(c.startMonth); val end = month(c.endMonth)
   require(!c.ongoing || end == null); require(start == null || end == null || end >= start)
  } catch (_: Exception) { throw EntryFailure("ENTRY_INVALID",400) }
  return c.copy(title=c.title.trim(),organization=c.organization.trim(),client=c.client.trim(),deliveryRole=c.deliveryRole.trim(),description=c.description.trim(),sourceNote=c.sourceNote.trim())
 }
}
