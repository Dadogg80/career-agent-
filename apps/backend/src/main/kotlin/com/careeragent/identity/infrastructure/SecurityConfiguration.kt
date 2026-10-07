package com.careeragent.identity.infrastructure

import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers
import org.springframework.security.web.SecurityFilterChain
import java.net.URI

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class SecurityConfiguration {
    @Bean
    fun security(
        http: HttpSecurity,
        registrations: ObjectProvider<ClientRegistrationRepository>,
        @Value("\${FRONTEND_ORIGIN:http://127.0.0.1:3000}") frontendOrigin: String,
    ): SecurityFilterChain {
        val frontend = URI(frontendOrigin)
        require(frontend.scheme in setOf("http", "https") && frontend.host in setOf("127.0.0.1", "localhost") && frontend.rawUserInfo == null && frontend.rawQuery == null && frontend.rawFragment == null && frontend.path in setOf("", "/")) {
            "FRONTEND_ORIGIN must be a loopback origin for this local pilot"
        }
        http.authorizeHttpRequests { rules ->
            rules.requestMatchers("/actuator/health", "/api/system/status", "/api/auth/session", "/api/jobs/import", "/api/jobs/requirements", "/oauth2/authorization/career", "/login/oauth2/code/career").permitAll()
                .requestMatchers("/api/profile/me/applications", "/api/profile/me/applications/*", "/api/profile/me/cvs", "/api/profile/me/cvs/*", "/api/profile/me/cvs/*/approve", "/api/profile/me/cvs/*/download/*", "/api/profile/me", "/api/profile/me/entries", "/api/profile/me/entries/*", "/api/profile/me/entries/*/review", "/api/profile/me/entries/*/history", "/api/profile/me/jobs", "/api/profile/me/jobs/*", "/api/profile/me/jobs/*/match", "/api/auth/logout", "/api/profile/me/claims", "/api/profile/me/claims/*", "/api/profile/me/claims/*/review", "/api/profile/me/claims/*/history", "/api/profile/me/claims/*/evidence", "/api/profile/me/documents", "/api/profile/me/documents/*", "/api/profile/me/documents/*/original", "/api/profile/me/documents/*/master", "/api/profile/me/documents/*/claims", "/api/profile/me/documents/*/analysis", "/api/profile/me/documents/*/reread").authenticated()
                .anyRequest().denyAll()
        }
        // These two endpoints process public ads and never access private user data.
        http.csrf { it.ignoringRequestMatchers("/api/jobs/import", "/api/jobs/requirements") }
        http.exceptionHandling {
            it.authenticationEntryPoint { _, response, _ -> error(response, 401, "AUTH_REQUIRED") }
            it.accessDeniedHandler { _, response, _ -> error(response, 403, "ACCESS_DENIED") }
        }
        val repository = registrations.ifAvailable
        if (repository != null) {
            val resolver = DefaultOAuth2AuthorizationRequestResolver(repository, "/oauth2/authorization")
            resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce())
            http.oauth2Login { login ->
                login.authorizationEndpoint { it.authorizationRequestResolver(resolver) }
                login.successHandler { _, response, _ -> response.sendRedirect(frontendOrigin.trimEnd('/') + "/dashboard") }
                login.failureHandler { _, response, _ -> response.sendRedirect(frontendOrigin.trimEnd('/') + "/login?login=failed") }
            }
        }
        http.logout { logout ->
            logout.logoutUrl("/api/auth/logout").invalidateHttpSession(true).clearAuthentication(true).deleteCookies("CAREER_SESSION")
                .logoutSuccessHandler { _, response, _ -> response.status = 204 }
        }
        http.requestCache { it.disable() }
        return http.build()
    }

    private fun error(response: HttpServletResponse, status: Int, code: String) {
        response.status = status
        response.contentType = "application/json"
        response.setHeader("Cache-Control", "no-store")
        response.writer.write("{\"code\":\"$code\"}")
    }
}
