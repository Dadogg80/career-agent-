package com.careeragent.cv.domain

import com.careeragent.profile.domain.CareerEntry
import com.careeragent.profile.domain.CompetencyClaim
import java.time.OffsetDateTime
import java.util.UUID

enum class CvStatus { DRAFT, APPROVED }
enum class CvFormat { DOCX, PDF }
data class CvSelection(val id: UUID, val revision: Long)
data class CvIdentity(val name: String, val headline: String, val email: String, val phone: String, val location: String, val summary: String)
data class CvDraftRequest(val title: String, val locale: String, val identity: CvIdentity, val claims: List<CvSelection>, val entries: List<CvSelection>, val jobId: UUID?)
data class CvContent(val locale: String, val identity: CvIdentity, val claims: List<CompetencyClaim>, val entries: List<CareerEntry>, val jobId: UUID?, val jobTitle: String?)
data class CvArtifact(val id: UUID, val format: CvFormat, val byteSize: Int, val sha256: String)
data class CvVersion(val id: UUID, val title: String, val content: CvContent, val status: CvStatus, val revision: Long, val templateVersion: String, val createdAt: OffsetDateTime, val approvedAt: OffsetDateTime?, val artifacts: List<CvArtifact>, val stale: Boolean = false)
data class CvFile(val format: CvFormat, val bytes: ByteArray)
interface CvRenderer { fun generate(content: CvContent): List<CvFile> }
