package com.careeragent.cv.application

/** Apply accepted wording to exact source ranges, preserving all other text and whitespace. */
object CvReviewedText {
    fun paragraphs(text: String): List<String> = text.split(Regex("\\n\\s*\\n")).flatMap { block ->
        val parts = mutableListOf<String>()
        var offset = 0
        while (offset < block.length) {
            val limit = minOf(offset + 4000, block.length)
            val newline = if (limit < block.length) block.lastIndexOf('\n', limit - 1) else -1
            val split = if (newline >= offset + 2000) newline + 1 else limit
            val end = if (split < block.length && block[split - 1].isHighSurrogate() && block[split].isLowSurrogate()) split - 1 else split
            val part = block.substring(offset, end)
            if (part.isNotBlank()) parts.add(part)
            offset = end
        }
        parts
    }
    fun assemble(snapshot: TailoringSnapshot, reviews: List<WordingReview>): String {
        val paragraphs=CvSourceUnits.passages(snapshot.text,snapshot.result.sourceUnits)
        var cursor=0;val ranges=snapshot.result.sourceUnits?.map { it.start to it.end } ?: paragraphs.map { p -> val start=snapshot.text.indexOf(p,cursor);if(start<0)throw CvFailure("CV_SOURCE_CONFLICT",409);cursor=start+p.length;start to cursor }
        cursor=0
        val text=buildString {
            reviews.filter { it.decision==WordingDecision.ACCEPTED }.sortedBy { it.paragraphIndex }.forEach { review ->
                val proposal=snapshot.result.proposals.single { it.paragraphIndex==review.paragraphIndex }
                if (snapshot.result.sourceUnits?.getOrNull(review.paragraphIndex)?.editable==false) throw CvFailure("CV_WORDING_UNSUPPORTED",400)
                if(paragraphs.getOrNull(review.paragraphIndex)!=proposal.oldText)throw CvFailure("CV_SOURCE_CONFLICT",409)
                val range=ranges[review.paragraphIndex];append(snapshot.text.substring(cursor,range.first));append(review.text);cursor=range.second
            };append(snapshot.text.substring(cursor))
        }
        if(text.length>100000)throw CvFailure("CV_CONTENT_LIMIT",400)
        return text

    }
}
