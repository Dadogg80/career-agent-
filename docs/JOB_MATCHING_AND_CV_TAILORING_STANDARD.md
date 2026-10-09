# Job matching and CV tailoring standard

Status: accepted product direction, 2026-10-09. Implementation is partial; see the delivery matrix below. Based on the owner's supplied 71-section work-agent methodology, edited into an English product specification. This is not a raw conversation log or a runtime system prompt. It contains no candidate records. Section numbers preserve traceability to the supplied methodology.

## Scope and precedence

Apply this standard across professions, industries and seniority levels. Derive vocabulary from the actual advertisement and candidate evidence, not a software-developer template. Optimize relevance, evidence and visibility without sacrificing truth or provenance.

The following existing owner decisions qualify the supplied methodology:

- Complete supported CONFIRMED competency evidence remains automatic matching input (ADR 0030). Do not restore manual selection or a lexical cutoff to implement token efficiency. Future semantic retrieval must demonstrate recall and disclose what it leaves out before replacing this behavior.
- Absence from documents/CV is unknown, not proof of a real competence gap. A confirmed negative answer or established formal barrier can support a gap; absence alone cannot. Formal qualification verification and user attestation must remain distinguishable.
- The next delivery stops at reviewed, editable CV text proposals. Do not create a new tailored file, submit an application or mark it APPLICATION_READY in that delivery. The existing independent standard CV export remains available.
- Preserve the original/master file. Exact arbitrary DOCX/PDF layout reconstruction is deferred; the owner accepted standard-template export first. Text tailoring must not silently rewrite chronology, identity or facts.
- Private AI calls retain recipient/model-bound preview and approval, current budgets and explicit alternate-provider recovery. Logical analysis stages below do not require one external request per stage. Switching providers never weakens validation or carries old consent to a new recipient.
- A weighted percentage describes documented requirement coverage, not hiring probability, a promise of interview success or an ATS vendor score.
- A browser excerpt is not a verified complete advertisement. Assess received source coverage honestly; disclose truncation, unsupported claims and unprocessed requirements.

## 1. Goal

Understand the employer's actual needs and candidate's actual capabilities; identify supported overlap, poorly visible experience, uncertainty, transferability and barriers. Recommend clear, relevant presentation rather than making every candidate appear ideal.

## 2. Candidate knowledge is broader than the CV

The owned knowledge base can contain employment, projects, assignments, responsibilities, outcomes, skills, methods, tools, systems, technologies, domains, education, courses, certificates, authorizations, languages, leadership, customers, evidenced strengths, working style, preferences, career goals, references and user statements. A CV is one presentation of that knowledge. Missing CV wording is not missing competence.

## 3. Sources and provenance

Retain document identity/version, literal evidence, role/project/context and factual revision. Sources can include personal confirmation, employment certificates, qualifications, licenses, validated project accounts, older CVs, work samples, references, application/interview history and other documents. Source quality informs questions, not automatic authority over an explicit correction. AI inference is not confirmation.

## 4. Truth states

CONFIRMED facts may support matching and proposed final wording, with their confirmation basis retained. INFERRED facts may trigger neutral questions but cannot enter CV/application prose as facts. UNVERIFIED information remains reviewable and is not secure evidence. REJECTED information is excluded and must not be recreated from the same evidence. New evidence can trigger explicit review, not silent reinstatement. AI confidence never changes factual status.

## 5. Analyze the advertisement first

Extract supplied title, employer, industry, location, working pattern, employment form, seniority, role purpose, activities, responsibilities, expected outcomes, mandatory/preferred qualifications, education, certification, authorization, experience, expertise, methods, tools/systems/technology, regulation/standards, quality/safety/security/compliance, operations, customers/patients/clients, people/budget/project/stakeholder responsibility, collaboration, communication, language, travel, shifts, clearance, personal expectations, application questions, deadline, contact and domain terminology. Unknown fields stay unknown. Do not invent contact people or requirements.

## 6. Profession-independent dimensions

Use extensible concepts including RESPONSIBILITIES, PROFESSIONAL_EXPERTISE, TOOLS_AND_SYSTEMS, METHODS_AND_PROCESSES, INDUSTRY_AND_DOMAIN, EDUCATION, CERTIFICATIONS, AUTHORIZATIONS, EXPERIENCE_LEVEL, LEADERSHIP, PEOPLE_MANAGEMENT, PROJECT_MANAGEMENT, CUSTOMER_OR_CLIENT_RESPONSIBILITY, STAKEHOLDER_MANAGEMENT, COMMUNICATION, COLLABORATION, QUALITY, SAFETY, COMPLIANCE, OPERATIONS, COMMERCIAL, SALES, ANALYTICAL, ADMINISTRATIVE, LANGUAGE, LOCATION, WORKING_PATTERN, PERSONAL_ATTRIBUTES and CAREER_FIT. Domain-specific additions are allowed; they must not overwrite literal meaning.

## 7. Requirement representation

Target fields: stable requirement ID, originalWording, normalizedConcept, category, importance, sourceLocation/sourceEvidence and relatedConcepts. Target importance: MANDATORY, PREFERRED, NICE_TO_HAVE. Do not infer mandatory from emphasis alone. These are target concepts, not a claim that today's enums/schema already support every field; migrations must explicitly preserve older snapshots and unclear requirements.

## 8. Requirement-to-evidence chain

For each material criterion preserve: requirement → concept → relevant candidate knowledge → role/project/employment → evidence → truth status → match → transferability → current-CV visibility → action → proposed wording. A matching keyword without this chain is insufficient evidence.

## 9. Match states

Target STRONG_MATCH, PARTIAL_MATCH, NEEDS_CLARIFICATION and REAL_GAP. Strong requires direct confirmed relevant contribution; partial describes supported adjacent experience and limitations; unclear requests evidence or clarification. REAL_GAP requires positive grounds beyond absence and consideration of transferability. Current STRONG/PARTIAL/CLARIFY remain the supported API states; do not silently add unsupported enums to prompts.

## 10. Discover hidden competence

Use known experience to ask specific, neutral questions: payment integration may warrant asking about webhooks; delivery leadership about risk work; customer portfolios about CRM; clinical work about personally held medication responsibility. Help recall without supplying the desired answer or assuming authorization.

## 11. Resolve “probably relevant”

Find supporting evidence, ask a focused question or leave the criterion unverified. Probable relevance alone never justifies final CV wording.

## 12. Competence exceeds tool familiarity

Represent professional depth such as negotiation, forecasting, patient safety, budgeting, leadership, customer responsibility, quality work, conflict handling, strategy and operations separately from labels such as Salesforce, Excel, SAP, React, electronic patient records or AutoCAD.

## 13. Broad versus specific experience

Customer service does not prove complaints, upselling or account management; project leadership does not prove risk/budget/vendor control; leadership does not prove hiring or people management; clinical work does not prove medication responsibility; administration does not prove payroll; software development does not prove observability. Seek specific evidence or clarification for the actual requirement.

## 14. Visibility gaps

Ask whether the candidate has the specific capability, where it was demonstrated, what confirms it and whether comparable precision is visible in the selected CV. Supported competence with weak/missing CV wording is a VISIBILITY_GAP, not a competence gap. Use the employer's precise terminology only when it truthfully describes the evidence.

## 15. Demonstrated capability

Distinguish SELF_REPORTED_ATTRIBUTE from DEMONSTRATED_CAPABILITY. A claim of being independent/structured is not equivalent to a sourced example of independently delivering a project, managing customers or running operations.

## 16. Transferability

Explain similarity of responsibilities, complexity, constraints and methods, learning distance and limitations. Regulated private-sector experience can be partly transferable to public-sector work; it does not become direct public-sector experience.

## 17. Formal barriers

Handle licenses, clearance, driving permits, trade qualifications and legally required education explicitly. Do not compensate for an absolute legal requirement with adjacent experience. Distinguish missing evidence from a known absent/expired qualification, and an employer's wording from a legal determination.

## 18. Results

Separate ACTIVITY, RESPONSIBILITY, ACHIEVEMENT and OUTCOME. Do not invent measurable improvements, amounts, customers, team sizes or results.

## 19. Recruiter perspective

Provide a concise evidence-grounded assessment of first screening, visible relevant qualifications, positioning, credible seniority, formal barriers, wording gaps and unexplained transitions. Frame this as an assessment, not knowledge of an employer's actual decisions.

## 20. Hiring-manager perspective

Assess concrete examples, own contribution, responsibility, complexity, outcomes and practical capacity for the work. Keyword overlap can exceed the strength of the underlying evidence; show that distinction.

## 21. Overall recommendation

Summarize strengths, partial matches, uncertainties, known gaps, formal barriers, transferability and screening/evidence risks. Target recommendation labels: STRONGLY_RECOMMEND, RECOMMEND, CONSIDER, STRETCH, LOW_MATCH, always explained. Recommendations guide the candidate; they do not block the user's choice to explore tailoring.

## 22. Explained scoring

Weight mandatory requirements more; inferred information cannot earn full credit. Optional future dimensions include role, responsibility, expertise, experience, domain, leadership, formal qualification, location, language and career fit. Do not introduce fabricated precision. Keep current deterministic coverage separate from future dimensional assessments and disclose unprocessed requirements.

## 23. Preconditions for tailoring

Have a received/analyzed ad, structured requirements, owned candidate evidence, a current matching assessment and resolved or visibly flagged important clarifications. Ask the user whether to proceed; do not invent a universal percentage cutoff. Flag formal barriers and stale evidence.

## 24. Base CV

Use the user's selected master/base CV. Preserve identity, original facts and chronology. Target focus, emphasis, wording, selection, section priority and visibility. Do not overwrite the original or promise arbitrary-layout preservation.

## 25. Review all relevant sections

Consider headline, short professional line, every profile paragraph, core skills, employment, experience bullets, projects, education, courses/certificates, additional information and terminology. A section may be reviewed and intentionally kept unchanged; reviewing everything does not mean rewriting everything.

## 26. Headline

Explain who the candidate actually is relative to the role, using only supported titles, expertise and seniority. Do not rename a formal job title to match an advertisement.

## 27. Professional line

Choose a concise relevant combination of expertise, methods, tools, qualifications and domain. Avoid listing every capability.

## 28. Profile paragraphs

Review each paragraph: relevant professional identity; concrete evidence from roles/projects/responsibilities/results; and the most useful additional dimension for this role, such as leadership, customers, collaboration, mentoring, quality or transferability. Do not make the last paragraph permanent boilerplate.

## 29. Dynamic competence grouping

Group by actual profession and evidence. Technology may need frontend/backend/cloud; sales may need negotiation/customer development/CRM; healthcare may need clinical work/patient safety/documentation; project roles may need budget/risk/vendors/quality. Do not simply copy job categories into the candidate's profile.

## 30. Experience bullets

Normally propose three to five focused points for a material role where evidence permits: action + context + own responsibility + relevant method/tool + documented outcome. Do not manufacture points to meet a numerical target.

## 31. Selection versus history

Emphasize relevant experience without deleting the underlying career record. Reduced visibility in a tailored CV is not deletion from the knowledge base.

## 32. Experience duration

Only quantify defensible experience from adequate date precision. Do not double-count concurrent work. Prefer accurate nonnumeric language when duration cannot be established.

## 33. Chronology and parallel work

Retain employer, client, project, formal title and actual delivery role separately. Explain concurrent employment, consulting assignments, contracts, part-time work, boards and volunteering only when supported. Customer projects must not appear as separate employment by default. Overlap itself is not an error.

## 34. Terminology

Use employer vocabulary when it accurately expresses confirmed experience. Avoid keyword stuffing and unsupported synonyms that imply greater responsibility.

## 35. Keywords need evidence

Connect relevant terms to a role/project/example, not only a skills list. B2B selling and risk management should have a traceable example if presented as experience.

## 36. CV visibility states

Target VISIBLE, WEAKLY_VISIBLE, NOT_VISIBLE, NOT_APPLICABLE for each material requirement relative to a specific base-CV revision. “Not visible” must not change the knowledge-base truth state. Missing/unreadable CV text produces an unassessed state, not fabricated visibility findings.

## 37. First-scan review

Use a short recruiter scan as a design heuristic: professional identity, supported seniority, strongest relevant capabilities and recent evidence should be apparent quickly. It is not a measured recruiter outcome or guarantee.

## 38. Information density

Check paragraph/bullet length, repetition, skill counts, hierarchy and whitespace. Prioritize relevant information instead of shrinking font sizes or cramming everything into the CV/UI.

## 39. Parsing and reading order

Check PDF and DOCX independently where feasible: contact/identity, headings before content, employer/title/date association, separate columns, understandable lists, correct bullet attachment, retained important text and selectable keywords. OCR and extraction success do not establish complete semantic understanding or ATS compatibility.

## 40. Explicit changesets

Each proposal should include target section/paragraph locator, exact old text, proposed new text, reason, requirement references, used evidence/revisions and keywords. Support approve, edit and reject. Distinguish suggested changes from unchanged reviewed sections. A user rewrite must not inherit an unsupported “verified” label merely because the original suggestion was sourced.

## 41. Original preservation and later versioning

Target: master → proposed changeset → user review → later new version linked to a job/application. Never replace the master. The next delivery stops before creating that version; exact-version storage belongs to the later application package.

## 42. Short CV and full history

Allow relevant selection without erasing complete history. Later support complete-history needs for employers, interviews and checks, without changing facts.

## 43. Defensibility

For each important claim, the candidate should be able to explain where/how it was acquired with a credible source or explicit statement. Remove, qualify or clarify claims without support.

## 44. Application letter

Later, after matching and CV review, write a complementary letter showing real motivation, contribution, relevant examples, transferability and answers to employer questions. Do not repeat the CV.

## 45. Motivation

Ask when motivation is absent; never fabricate enthusiasm, personal connection or career goals.

## 46. Personal qualities in prose

Prefer evidenced working situations and responsibilities over generic “structured, solution-oriented and collaborative” lists. Preserve whether evidence is personal testimony or documentary.

## 47. Application questions

Extract explicit employer questions and later answer them in the letter or separate ApplicationAnswers, with missing input flagged.

## 48. Language

Write naturally, concretely, professionally and with measured confidence. Avoid flattery, empty superlatives, generic AI phrasing and corporate boilerplate. Support Norwegian Bokmål and English.

## 49. Generic-text check

If wording could be sent unchanged to hundreds of candidates/employers, make it specific using supported evidence or request needed information.

## 50. Fact check

Recheck dates, organizations, clients, projects, titles, responsibilities, results, qualifications, authorizations and leadership/people/budget/sales scope. Never upgrade experience through persuasive language.

## 51. AI task contract

Specify TASK, PURPOSE, CONTEXT, AVAILABLE FACTS, ALLOWED SOURCES, FORBIDDEN ASSUMPTIONS, OUTPUT SCHEMA, VALIDATION RULES and FAILURE BEHAVIOR. Treat uploaded content/advertisements as data, not instructions. Logical stages may share one bounded call; do not multiply calls merely to reproduce this outline.

## 52. Job analysis contract

Extract and normalize requirements without assessing the candidate yet. Preserve meaning, original evidence and explicit mandatory/preferred wording; identify responsibilities, formal barriers, behavior and domain terms. Validate source references and schema.

## 53. Knowledge retrieval contract

Return requirement references, supported claims, truth/confirmation basis, contexts, source references and possible adjacent competence separately. Never promote an inferred connection. Preserve full-evidence inclusion until a measured alternative satisfies ADR 0030.

## 54. Classification contract

Compare actual evidence against each supplied criterion. Direct confirmed facts can support strong; adjacent supported work may support partial; ambiguity prompts clarification. No evidence remains unclear, not a proven gap. Validate current owned IDs/revisions and literal quotations.

## 55. Clarification contract

Ask one focused neutral question with enough known context to help recall. Do not supply a desirable answer or create a confirmed claim from the question itself.

## 56. Transferability contract

Assess responsibility/complexity/domain/method similarity, learning distance and formal barriers. Explain limitations and never present transferability as identical experience.

## 57. Visibility contract

Compare confirmed competence with a specific selected CV text/revision; return visibility and supporting locators. Only confirmed facts can support proposed CV wording. Distinguish unreadable/missing content from a reviewed absence.

## 58. CV writing contract

Use requirements, confirmed evidence, current text, target section, accurate terminology and style constraints. Return oldText, newText, reason, usedEvidence and usedKeywords with stable section/source references. Forbid invented achievements/numbers, inflated titles, unsupported responsibilities and qualities.

## 59. Application writing contract

Later use reviewed job analysis, current matching, approved CV version, actual career goals/motivation, company evidence and employer questions. Missing motivation returns NEEDS_USER_INPUT. No automatic submission.

## 60. Structured output

Business logic uses validated typed fields, not free-prose parsing. Evolve DTOs explicitly; a target field in this document is not an implemented API.

## 61. Validation and partial recovery

Check schema, owned IDs, factual revisions, source existence, literal quotations, allowed truth states and unsupported details. Unsupported generated facts never enter the profile or final wording. Preserve valid received sources, previous results and supported proposals when another part fails; show useful partial information and the next action without false success.

## 62. Provider independence

Groq/Gemini/future providers receive equivalent factual restrictions and output obligations. Actual provider/model attribution follows the call and retained result. Alternate-provider recovery requires explicit recipient approval; quality does not decrease to bypass a quota.

## 63. Token efficiency

Reuse owned saved analyses, immutable source references and exact passage packing; avoid retransmitting original files/contact details/all CV versions. A future evidence-retrieval optimization must demonstrate no material recall loss and remain observable. Do not silently omit confirmed facts or perform background unapproved model calls.

## 64. Target journey

Analyze ad → structure requirements → access candidate knowledge → match → clarify → update owned knowledge → explicitly reassess relevant matching → recruiter/hiring-manager assessment → user chooses whether to pursue → assess base-CV visibility → propose changeset → approve/edit/reject. Later: new CV version → required application material → parsing/quality checks → final package. Each call has honest loading, recoverable partial results and actual recipient/model attribution.

## 65. User-facing results

Prioritize concise fit assessment, strong/partial evidence, clarifications, known barriers/gaps, transferability, recruiter/hiring-manager perspectives, explained recommendation, CV changes and terminology review. Later add relevant application material. Hide optional detail behind bounded readers instead of creating a long wall of panels.

## 66. Final package quality gate (later)

APPLICATION_READY requires materially analyzed requirements, resolved/flagged clarifications, confirmed facts only, accurate transferability/formal barriers, targeted headline/profile/skills/experience, natural terminology, traceable evidence, correct dates/titles/employer/client distinction, no invented results, understandable chronology, readable density, acceptable parsing, complementary application prose and an exact stored CV version. The next text-proposal delivery cannot satisfy or claim this gate.

## 67. Decision questions

What does the employer mean? Does the candidate have it? What confirms it, where was it used and how directly does it match? Is transferability limited by formal requirements? Is this specific experience visible in the CV, or should it be clarified? Can the candidate defend the wording? Only then consider a positively established real gap.

## 68. Deterministic domain rules versus AI

Implement ownership, authorization, truth/confirmation basis, revision checks, source validation, approval, claim promotion, stale results, score calculation and later version/application states in application/domain logic. AI can extract, normalize, compare semantics, summarize, draft and generate questions; it is not final authority for truth, qualification validity, consent, source precedence or submission.

## 69. Professional standard

Combine recruiter scanability with hiring-manager credibility and career guidance that helps people uncover actual experience. Explain screening risk without claiming knowledge of applicants, market competition or selection outcomes that the system does not possess.

## 70. Supported request scenario

The target user request is: analyze a linked job against all available owned candidate evidence; explain matches, uncertainties and CV visibility; ask necessary questions; use the selected master CV to propose truthful role-specific wording; show evidence and reasons; later prepare requested application material. It should work across professions, not require the candidate to manually select skills and not conflate keywords with competence.

## 71. Final principle

Understand the real candidate sufficiently to identify suitable opportunities and present relevant evidence clearly, truthfully and convincingly. Truth and provenance win over persuasive wording.

## Delivery matrix and acceptance

This matrix separates verified foundations from target behavior. Remote main `289dcd1` includes PR #26; this document does not implement new runtime behavior.

| Standard areas | Current foundation | Next acceptance / missing behavior |
| --- | --- | --- |
| 2–4, 50, 61, 68 | Owned documents/claims, explicit truth/review, revisions and documentary confirmation basis | Whole-journey tests must preserve corrections and rejection across rereading/reanalysis |
| 5–8, 52 | Source-backed ad overview and up to 12 analyzed requirements; bounded 15,000-character ad input | Measure requirement recall, especially formal/behavioral criteria; expose partial coverage; richer taxonomy is pending |
| 9–18, 21–22, 53–56 | Confirmed-evidence STRONG/PARTIAL/CLARIFY, literal validation, deterministic weighted coverage, inline user clarification | Explicit transferability, positively evidenced gap/formal-barrier handling and richer assessment are pending |
| 19–20, 65, 69 | Reason per requirement and score | Concise separately labelled recruiter/hiring-manager reasoning is pending, with evidence and uncertainty |
| 24–29, 36, 40, 57–58 | Master-document selection, original text, independent standard CV export | Base-CV selection + revision-bound visibility + editable old/new text proposals is the next product slice |
| 30–35, 38–39, 43, 50 | Source reading, typed career history, context links, side-by-side period review | Cross-profession evidence/chronology/reading-order checks; complete all-section text review is pending |
| 41–42, 44–49, 59, 66 | Independent reviewed export and manual application tracking | Tailored file/version creation, letters/answers and final package gate are explicitly deferred |
| 51, 60–64 | Structured AI calls, model/recipient approval, exact passage packing, retained quota progress | Task-specific tailoring contracts and resumable text review; no per-stage request explosion |
| 64–65, 70 | Individual profile/job/match screens | Joined onboarding → upload → review → job → save → match → tailoring journey, contextual help and optional tutorial |

### Prioritized implementation sequence

1. **Joined journey review and baseline tests.** Exercise real local identity/persistence, document reading/population, ad retrieval/analysis, saving and full-profile matching with fictional fixtures. Separately use local private originals for reading/expected-fact audits. Live model tests remain explicitly enabled synthetic checks or recipient-approved in-app analyses. Report mocks, real integrations and provider checks separately. Include session loss, source/AI failure, quotas, staleness, mobile and keyboard flow. Identify concrete UX defects before rewriting working features.
2. **Apply entry points and guided readiness.** Add “Apply for this job” on saved cards and match results; it opens preparation, not external submission. Show selected job, source/match freshness, profile readiness and base CV with clear next actions. Never force manual competency selection. Missing CV/documents link directly to upload; show appropriate content and actually supported formats. Optional skippable tutorial and contextual help accompany these screens.
3. **Visibility and editable tailoring changeset.** Use the selected base CV and confirmed evidence; analyze relevant sections, show keep/change/clarify outcomes, original/new text, reasons, evidence and requirement references. Approve/edit/reject individual proposals with compact pending counts. Retain original, disclose unresolved formal barriers and make stale proposals unusable as current recommendations. No new tailored CV file/version yet.
4. **Broader matching and quality review.** Measure the current 12-requirement limit and cross-profession coverage, add traceable transferability and recruiter/hiring-manager assessments, resolve source/context uncertainty without automatic authority. Improve exact requirement recall and inference/gap distinction before introducing new score dimensions or semantic evidence filtering. Durable keep-both period decisions remain an adjacent later improvement, not a blocker for the joined journey.
5. **Release-quality journey verification.** Repeat the complete journey after changes; compare independently expected facts/requirements/proposals, examine desktop/mobile screenshots, test approval changes and failure recovery, and report limitations. The pilot milestone is useful reviewed text proposals, not APPLICATION_READY.
6. **Later roadmap.** Tailored version/export, application questions/letters, package quality gate, tracking/discovery/interview support and online hosting each need their own tested delivery. No paid services or automatic application submission are authorized.

### Minimum cross-profession quality fixtures

Use at least technology, regulated healthcare, sales and project/operations examples. Verify a mandatory authorization is not replaced by transferable experience; tool familiarity is not responsibility; hidden experience creates a neutral question; confirmed but missing CV detail becomes a visibility gap; overlapping roles do not inflate duration; stale/edited evidence blocks current recommendations; provider failures preserve usable information without introducing unsupported facts. No fixture may contain the pilot's private information in Git.
