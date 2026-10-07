package com.careeragent.system.api

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class SystemStatus(val application: String, val status: String)

@RestController
class SystemStatusController {
    @GetMapping("/api/system/status")
    fun status() = SystemStatus(application = "career-agent", status = "UP")
}
