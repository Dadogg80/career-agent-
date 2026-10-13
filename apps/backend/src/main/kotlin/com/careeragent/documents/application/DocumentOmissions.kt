package com.careeragent.documents.application

import com.careeragent.documents.domain.DocumentOmission

/** Fixed categories and saturated counts only: never retain rejected model text or exception messages. */
internal object DocumentOmissions {
    fun merge(vararg groups: List<DocumentOmission>): List<DocumentOmission> = groups.flatMap { it }
        .filter { it.count > 0 }.groupBy { it.section to it.reason }.values.map { items ->
            items.first().copy(count = items.sumOf { it.count.toLong() }.coerceAtMost(200).toInt())
        }
}
