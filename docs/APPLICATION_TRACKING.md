# Local application tracking

Status: implemented on the unpublished local pilot branch. No external submission, message, email or browser automation occurs.

Create a case from a saved advertisement; the same owner/snapshot reopens its existing case. Track considering, preparing, ready to apply, applied, interview 1/2, case assignment, offer, rejected and withdrawn. Store contact details, private notes, an optional follow-up date and application text/answers. Filter/search cases or show follow-ups due. Dates are manually recorded; reminders do not imply an employer commitment or an automatically sent message.

## Exact submission material

Choose an owned APPROVED CV version for this advertisement, or a general CV. Recording an applied/interview/case/offer state requires a CV and actual submission date. The UI presents a separate confirmation showing the job, CV ID, date and text. Once a submission date is stored, its CV, date and submitted text are locked. Notes, contact, follow-up and status remain editable. This is a user record of a submission, not proof that an external portal received it.

A history entry records initial state and each state change with timestamp and material references. Optimistic revisions prevent concurrent overwrite. Foreign keys/owner checks protect saved-job and CV references; attached material cannot be silently removed. Deleting a case explicitly deletes its contact, notes and history, while keeping the job and CV.

## Pilot limits

Up to 100 cases and 100 status-history entries per case; 5,000 characters each for notes and submitted text. No AI drafting, attachments other than an approved CV, external acknowledgements, calendar integration, recruiter messaging or automatic follow-up yet. Incorrect archived submission records currently need case deletion/recreation; an audited correction workflow is future work. Organization/adviser access is not implemented.
