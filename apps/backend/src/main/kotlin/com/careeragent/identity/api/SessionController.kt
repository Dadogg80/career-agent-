package com.careeragent.identity.api

import com.careeragent.profile.application.ProfileService
import org.springframework.beans.factory.ObjectProvider
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.security.web.csrf.CsrfToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

data class SessionView(val authenticated: Boolean, val loginAvailable: Boolean, val profilesAvailable: Boolean, val csrfToken: String)

@RestController
class SessionController(private val registrations: ObjectProvider<ClientRegistrationRepository>, private val profiles: ObjectProvider<ProfileService>) {
    @GetMapping("/api/auth/session")
    fun session(@AuthenticationPrincipal principal: OidcUser?, csrf: CsrfToken): ResponseEntity<SessionView> =
        ResponseEntity.ok().header("Cache-Control", "no-store").body(
            SessionView(principal != null, registrations.ifAvailable != null, profiles.ifAvailable != null, csrf.token),
        )
}
