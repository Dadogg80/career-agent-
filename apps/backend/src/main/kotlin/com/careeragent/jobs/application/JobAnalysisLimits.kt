package com.careeragent.jobs.application

/** Defensive payload ceiling, not a request to select only the first or strongest requirements. */
object JobAnalysisLimits {
    const val REQUIREMENTS = 128
    const val ASSESSMENT_ITEMS = REQUIREMENTS * 2
}
