package com.careeragent.cv.application

enum class CvSourceUnitKind { TEXT, SECTION_HEADING, IDENTITY, ENTRY_HEADER, SKILL_GROUP, BULLET }
data class CvSourceUnit(val paragraphIndex: Int, val start: Int, val end: Int,
    val kind: CvSourceUnitKind, val editable: Boolean, val contextIndex: Int? = null)

/** Application-owned UTF-16 source ranges. Stored ranges, never an upgraded splitter, identify saved edits. */
object CvSourceUnits {
    private val bullet = Regex("^\\s*(?:[-*•▪‣]|\\d+[.)])(?:\\s+|$)")
    private val year = "(?:19|20)\\d{2}"
    private val date = "(?:\\d{1,2}[./]$year|$year(?:[-/]\\d{1,2})?)"
    private val period = Regex("(?iu)^\\s*$date\\s*[-–—]\\s*(?:$date|nå|dags dato|present|current|ongoing)(?:\\s|$)")
    private val embeddedPeriod = Regex("(?iu)(?<![\\p{L}\\d])$date\\s*[-–—]\\s*(?:$date|nå|dags dato|present|current|ongoing)(?![\\p{L}\\d])")
    private val onlyPeriod = Regex("(?iu)^\\s*$date\\s*[-–—]\\s*(?:$date|nå|dags dato|present|current|ongoing)\\s*$")
    private val datedTitle = Regex("^\\s*$date\\s+[\\p{Lu}\\p{N}]")
    private val onlyDate = Regex("^\\s*$date\\s*$")
    private val contact = Regex("[\\w.+-]+@[\\w.-]+\\.[\\p{L}]{2,}|(?iu)\\b(?:telefon|phone|e-post|email)\\s*:")
    private data class Line(val start: Int, val end: Int, val text: String)

    fun create(text: String): List<CvSourceUnit> {
        val lines = Regex("[^\\r\\n]+").findAll(text).filter { it.value.isNotBlank() }
            .map { Line(it.range.first,it.range.last+1,it.value) }.toList()
        val firstHeading = lines.firstOrNull { CvSections.kind(it.text) != null }?.start
        val units = mutableListOf<CvSourceUnit>()
        var section = CvSectionKind.UNCLASSIFIED
        var context: Int? = null
        var start: Int? = null
        var end = 0
        var unitKind = CvSourceUnitKind.TEXT
        var unitContext: Int? = null
        fun flush() {
            val beginning = start ?: return
            val firstIndex = units.size
            val identity = (firstHeading != null && beginning < firstHeading) || contact.containsMatchIn(text.substring(beginning,end))
            val kind = if (identity && unitKind !in setOf(CvSourceUnitKind.SECTION_HEADING,CvSourceUnitKind.ENTRY_HEADER)) CvSourceUnitKind.IDENTITY else unitKind
            var offset = beginning
            while (offset < end) {
                val limit = minOf(offset+4000,end)
                val newline = if (limit < end) text.lastIndexOf('\n',limit-1) else -1
                var split = if (newline >= offset+2000) newline+1 else limit
                if (split < end && text[split-1].isHighSurrogate() && text[split].isLowSurrogate()) split--
                if (text.substring(offset,split).isNotBlank()) units.add(CvSourceUnit(units.size,offset,split,kind,
                    kind !in setOf(CvSourceUnitKind.IDENTITY,CvSourceUnitKind.SECTION_HEADING,CvSourceUnitKind.ENTRY_HEADER),unitContext))
                offset = split
            }
            if (unitKind == CvSourceUnitKind.ENTRY_HEADER) context = firstIndex
            start = null
        }
        fun begin(line: Line, kind: CvSourceUnitKind = CvSourceUnitKind.TEXT) {
            start = line.start; end = line.end; unitKind = kind; unitContext = context
        }
        var i = 0
        while (i < lines.size) {
            val line = lines[i]
            val heading = CvSections.kind(line.text)
            val history = section in setOf(CvSectionKind.EXPERIENCE,CvSectionKind.EDUCATION)
            val shortTitle = shortHeader(line.text)
            val nextDate = if (history && shortTitle) (1..2).firstOrNull { distance ->
                val next=lines.getOrNull(i+distance)
                next != null && (onlyPeriod.matches(next.text) || onlyDate.matches(next.text)) &&
                    (1 until distance).all {shortHeader(lines[i+it].text) && CvSections.kind(lines[i+it].text)==null}
            } else null
            when {
                heading != null -> {
                    flush(); section = heading; context = null
                    begin(line,CvSourceUnitKind.SECTION_HEADING); flush()
                }
                history && (period.containsMatchIn(line.text) || datedTitle.containsMatchIn(line.text) || onlyDate.matches(line.text) ||
                    shortTitle && embeddedPeriod.containsMatchIn(line.text) || nextDate != null) -> {
                    flush(); context = null; begin(line,CvSourceUnitKind.ENTRY_HEADER)
                    if (nextDate != null) {i+=nextDate;end=lines[i].end}
                    // Date-only rows can precede a short literal employer/title line in extracted tables.
                    if (nextDate == null && (onlyPeriod.matches(line.text) || onlyDate.matches(line.text))) {
                        val next = lines.getOrNull(i+1)
                        if (next != null && next.text.trim().length in 2..200 && CvSections.kind(next.text)==null &&
                            !bullet.containsMatchIn(next.text) && !next.text.trim().endsWith('.') && !period.containsMatchIn(next.text)) {
                            end = next.end; i++
                        }
                    }
                    flush()
                }
                history && shortTitle && Regex("\\s[-–—]\\s").containsMatchIn(line.text) &&
                    !Regex("(?iu)\\s[-–—]\\s+(?:og|and|eller|or)\\b").containsMatchIn(line.text) -> {
                    // An undated header may start a different entry. Never carry the preceding entry's scope into it.
                    flush(); context=null; begin(line,CvSourceUnitKind.ENTRY_HEADER); flush()
                }
                bullet.containsMatchIn(line.text) -> { flush(); begin(line,CvSourceUnitKind.BULLET) }
                section == CvSectionKind.SKILLS && skillLabel(line.text,lines.getOrNull(i+1)?.text) -> {
                    flush(); begin(line,CvSourceUnitKind.SKILL_GROUP)
                }
                else -> {
                    val blankBoundary = start != null && text.substring(end,line.start).count { it=='\n' } >= 2
                    val labelOnly = start != null && unitKind == CvSourceUnitKind.SKILL_GROUP && end == lines.getOrNull(i-1)?.end &&
                        !text.substring(start!!,end).contains('\n')
                    val bareBullet = start != null && unitKind == CvSourceUnitKind.BULLET && text.substring(start!!,end).trim() in setOf("-","*","•","▪","‣")
                    val unfinishedBullet = start != null && unitKind == CvSourceUnitKind.BULLET &&
                        text.substring(start!!,end).trimEnd().lastOrNull() !in listOf('.', '!', '?', ':')
                    if (blankBoundary && !labelOnly && !bareBullet && !unfinishedBullet) flush()
                    if (start == null) begin(line) else end = line.end
                }
            }
            i++
        }
        flush()
        if (!valid(text,units)) throw CvFailure("CV_CONTENT_LIMIT",400)
        return units
    }

    private fun shortHeader(text: String) = text.trim().length in 2..250 &&
        !text.trim().endsWith('.') && !text.trim().endsWith('!') && !text.trim().endsWith('?') &&
        !bullet.containsMatchIn(text) && text.trim().split(Regex("\\s+")).size <= 30

    private fun skillLabel(text: String, next: String?): Boolean {
        val label = text.trim()
        return label.length in 2..80 && label.split(Regex("\\s+")).size <= 8 &&
            label.none { it in ".!?@,;" } && next != null && CvSections.kind(next)==null &&
            (label.endsWith(':') || next.contains(',') || next.contains(';') || next.contains(" · "))
    }

    fun valid(text: String, units: List<CvSourceUnit>): Boolean {
        if (units.isEmpty() || units.size > 500) return false
        var cursor = 0
        for ((index,unit) in units.withIndex()) {
            if (unit.paragraphIndex != index || unit.start < cursor || unit.end <= unit.start || unit.end > text.length ||
                unit.end-unit.start > 4000 || text.substring(cursor,unit.start).isNotBlank() || text.substring(unit.start,unit.end).isBlank()) return false
            if (listOf(unit.start,unit.end).any { it in 1 until text.length && text[it-1].isHighSurrogate() && text[it].isLowSurrogate() }) return false
            if (unit.kind in setOf(CvSourceUnitKind.IDENTITY,CvSourceUnitKind.SECTION_HEADING,CvSourceUnitKind.ENTRY_HEADER) && unit.editable) return false
            if (unit.contextIndex != null && (unit.contextIndex !in 0 until index || units[unit.contextIndex].kind != CvSourceUnitKind.ENTRY_HEADER)) return false
            cursor = unit.end
        }
        return text.substring(cursor).isBlank()
    }

    fun passages(text: String, units: List<CvSourceUnit>?): List<String> {
        if (units == null) return CvReviewedText.paragraphs(text)
        if (!valid(text,units)) throw CvFailure("CV_SOURCE_CONFLICT",409)
        return units.map { text.substring(it.start,it.end) }
    }
}
