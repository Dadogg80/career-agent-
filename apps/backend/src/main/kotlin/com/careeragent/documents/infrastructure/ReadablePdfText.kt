package com.careeragent.documents.infrastructure

import com.careeragent.documents.application.DocumentFailure
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.font.PDType3Font
import org.apache.pdfbox.text.PDFTextStripper
import org.apache.pdfbox.text.TextPosition
import java.io.Writer

/** Recover text from glyphs, never by guessing words. Repeated wide gutters establish column boundaries. */
internal object ReadablePdfText {
    private data class Gutter(val left: Float, val right: Float, val y: Float)
    fun extract(document: PDDocument): String {
        val result = StringBuilder()
        val writer = object : Writer() {
            override fun write(chars: CharArray, offset: Int, length: Int) {
                if (result.length + length > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                result.append(chars, offset, length)
            }
            override fun flush() {}
            override fun close() {}
        }
        repeat(document.numberOfPages) { pageIndex ->
            val positions = mutableListOf<TextPosition>()
            var characters = 0
            val collector = object : PDFTextStripper() {
                override fun processTextPosition(position: TextPosition) {
                    characters += position.unicode.length
                    if (characters > 60000) throw DocumentFailure("DOCUMENT_TOO_LARGE", 413)
                    positions.add(position)
                }
            }
            collector.startPage = pageIndex + 1; collector.endPage = pageIndex + 1
            collector.writeText(document, Writer.nullWriter())
            val width = document.getPage(pageIndex).cropBox.width
            val gutter = if (positions.all { it.dir == 0f }) gutter(positions, width) else null
            val regions: List<(TextPosition) -> Boolean> = if (gutter == null) listOf({ true }) else {
                val (split, top) = gutter
                listOf({ it.yDirAdj < top }, { it.yDirAdj >= top && it.xDirAdj < split }, { it.yDirAdj >= top && it.xDirAdj >= split })
            }
            regions.forEach { region ->
                val stripper = object : PDFTextStripper() {
                    override fun processTextPosition(position: TextPosition) {
                        if (region(position)) super.processTextPosition(position)
                    }
                }
                val glyphs = positions.filter(region)
                // Set spacing before PDFBox segments words; writeString is too late.
                val gaps = glyphs.zipWithNext().filter { (a,b) -> kotlin.math.abs(a.yDirAdj-b.yDirAdj)<1f && !a.unicode.any(Char::isWhitespace) && !b.unicode.any(Char::isWhitespace) }
                    .map { (a,b) -> b.xDirAdj-a.xDirAdj-a.widthDirAdj }.filter { it>0 }.sorted()
                val tracking = gaps.getOrNull(gaps.size/2) ?: 0f
                val size = glyphs.map { it.fontSizeInPt }.sorted().let { it.getOrNull(it.size/2) ?: 12f }
                if (glyphs.any { it.font is PDType3Font } || tracking>size*.075f) { stripper.averageCharTolerance=1.2f; stripper.spacingTolerance=1.5f }
                stripper.sortByPosition = true; stripper.startPage = pageIndex + 1; stripper.endPage = pageIndex + 1
                stripper.writeText(document, writer)
            }
        }
        return result.toString().replace('\u2028', '\n').replace('\u2029', '\n')
    }
    private fun gutter(positions: List<TextPosition>, width: Float): Pair<Float, Float>? {
        val lines = mutableListOf<MutableList<TextPosition>>()
        positions.sortedBy { it.yDirAdj }.forEach { p ->
            val line = lines.lastOrNull()
            if (line != null && kotlin.math.abs(line.first().yDirAdj - p.yDirAdj) <= maxOf(1f, p.fontSizeInPt * .12f)) line.add(p)
            else lines.add(mutableListOf(p))
        }
        val gaps = lines.flatMap { line -> line.sortedBy { it.xDirAdj }.zipWithNext().mapNotNull { (a, b) ->
            val left = a.xDirAdj + a.widthDirAdj
            if (b.xDirAdj - left >= maxOf(width * .025f, maxOf(a.fontSizeInPt, b.fontSizeInPt) * 1.3f)) Gutter(left, b.xDirAdj, a.yDirAdj) else null
        } }
        val split = gaps.map { (it.left + it.right) / 2 }.filter { it in width * .15f..width * .85f }
            .maxByOrNull { cut -> gaps.count { cut > it.left && cut < it.right } } ?: return null
        val supported = gaps.filter { split > it.left && split < it.right }
        if (supported.map { it.y }.distinct().size < 4) return null
        val firstShared = supported.minOf { it.y }
        // The main column can start above the sidebar. Include its early paragraphs in the same region.
        val earlyRight = lines.filter { line -> line.first().yDirAdj < firstShared && line.all { it.xDirAdj >= split } }
            .minOfOrNull { it.first().yDirAdj }
        val top = minOf(firstShared,earlyRight ?: firstShared) - 1f
        if (positions.count { it.yDirAdj >= top && it.xDirAdj < split } < 80 || positions.count { it.yDirAdj >= top && it.xDirAdj >= split } < 80) return null
        return split to top
    }
}
