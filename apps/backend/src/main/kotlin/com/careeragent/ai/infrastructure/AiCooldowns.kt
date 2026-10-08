package com.careeragent.ai.infrastructure

import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

@Component
class AiCooldowns {
    private val cooldowns = ConcurrentHashMap<Pair<String, String>, GroqCooldown>()

    fun forModel(provider: String, model: String): GroqCooldown =
        cooldowns.computeIfAbsent(provider to model) { GroqCooldown() }
}
