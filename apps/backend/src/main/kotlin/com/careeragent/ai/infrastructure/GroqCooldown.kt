package com.careeragent.ai.infrastructure

import org.springframework.stereotype.Component
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.ceil

@Component
class GroqCooldown {
    private val until = AtomicLong(0)

    fun remainingSeconds(): Int = ceil((until.get() - System.currentTimeMillis()).coerceAtLeast(0) / 1000.0).toInt()

    fun record(retryAfter: String?): Int {
        val seconds = ceil(retryAfter?.toDoubleOrNull()?.takeIf { it.isFinite() } ?: 60.0).toInt().coerceIn(1, 300)
        val deadline = System.currentTimeMillis() + seconds * 1000L
        until.updateAndGet { previous -> maxOf(previous, deadline) }
        return remainingSeconds()
    }
}
