# Local pilot user experience

Status: implemented entry/navigation redesign on the unpublished `feat/competency-workspace` branch. Reviewed CV export and manual application tracking are also implemented destinations; automatic discovery, academy and external submission are deferred.

## Entry and orientation

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Explain Career Agent, its working features and evidence principle | Public |
| `/login` | Check local identity readiness and open existing OIDC sign-in | Public; authenticated users continue to overview |
| `/dashboard` | Actual saved counts and a sensible next action | Signed-in local profile service |
| `/jobs/analyze` | Retrieve/analyze a public advertisement or pasted text | Available without sign-in |
| `/jobs/saved` | Own retained advertisements and approved personal comparison | Signed-in local profile service |
| `/career/profile` | Basic settings, competencies, reviewed career entries and source documents | Signed-in local profile service |

The landing page replaces the previous root analysis screen. Analysis moves to a stable dedicated route. Sign-in is no longer a discovery task inside profile settings: public actions lead to `/login`, successful backend OIDC/PKCE authentication returns to `/dashboard`, and failures return to `/login?login=failed`. No arbitrary return URL or new authentication provider is introduced. Keycloak still owns password entry. Sign-out lives in the shared workspace header and clears all private TanStack caches before document navigation to sign-in.

Configured anonymous private entry redirects to sign-in before mounting private components or fetching profile data. Missing local services produce an honest access/setup explanation instead of a pretend sign-in form. Frontend guards organize the experience; backend ownership, sessions and CSRF remain the authorization boundary. Public advertisement analysis does not require collecting a candidate profile.

## Visual and interaction system

- Norwegian Bokmål first; English selection persists between public and workspace routes. Switching UI language does not change saved facts or document language.
- Warm neutral surfaces, restrained green accents, compact evidence cards, consistent headings and generous spacing. Decorative landing examples are explicitly illustrations, not real jobs or user statistics.
- One persistent desktop navigation with named destinations and short purpose hints. Mobile uses the existing shadcn Sheet, its registered trigger, keyboard focus restoration, escape-to-close and an accessible close label.
- Fixed header account/language actions, visible current destination and skip-to-content links. Responsive layouts avoid horizontal page scrolling at the tested 390px viewport.
- Existing shadcn Buttons, Cards, Alerts, Badges, Dialogs and Sheets remain the foundation. TanStack handles session/data queries and mutations; no routing, styling or auth dependency is added.
- Only working features appear as navigation links. Overview, analysis, saved jobs, profile, CVs and applications are available. Discovery and academy remain deferred.

## Useful overview, without invented activity

The dashboard reads owned profiles, claims and saved jobs. It shows confirmed statement count, unreviewed proposal count and saved advertisement count. Loading displays an ellipsis and failure displays an em dash with recovery guidance, never a made-up zero. Reading it makes no AI call.

A new user is guided to save the basic profile. Unreviewed competency proposals take priority; a profile without confirmed experience is guided to documents. Otherwise the next step is an advertisement. If competencies cannot be loaded, the suggestion stays neutral. This is a deterministic workflow hint, not a career recommendation, ranking or prediction. Recent job links lead to the actual saved library; they do not imply an interview, submission or daily discovery service exists.

## Follow-on pilot design

Reviewed employment/project/education/certification entries distinguish employer, client, formal title and actual delivery role, with unknown dates kept unknown. Manual content starts UNVERIFIED; confirmation is separate; editing resets confirmation. The CV increment uses these reviewed snapshots and confirmed competency statements in an approved standard template while keeping uploaded originals unchanged. Application tracking binds a case to its exact approved CV version and submitted text. These flows retain the same source visibility and approval principles.

## Verification limits

See `DEVELOPMENT_LOG.md` for executed checks and the actual local identity smoke. Browser AI responses remain test fixtures; visual screenshots and synthetic identity checks do not establish arbitrary browser/device compatibility, production readiness or comprehensive accessibility certification. No external deployment or push is implied.

## Source-first recovery and reviewed materials

Advertisement results expand received employer, role, applicant and offer sections before practical details and compact requirement cards. An accessible full-text reader exposes what was actually received. If AI structuring fails, explicit source headings and labeled contact/location/deadline fields are organized locally with a visible recovery notice; unavailable text is never invented. Previous valid results are retained only for the unchanged source.

Document controls show readable coverage, source filenames and exact quotes. Long documents have independently approved parts. Guided competency review shows one contribution and its context at a time; skip leaves it unverified. Multi-source evidence opens only on request. Identical competency/contribution/context can reuse a reviewed record; different employer/project contexts stay separate.

CV creation separates selection, preview and approval. Only current confirmed competencies and typed career entries are selectable. A revised draft reuses relevant unchanged selections while preserving the approved file. PDF/DOCX download failures retain the draft or approved version. Applications distinguish manually recording a submission from sending one externally, show follow-up dates and preserve the exact submitted CV/date/text. Sheets and confirmation dialogs use the shared shadcn foundation, and private asynchronous operations use TanStack Query.
