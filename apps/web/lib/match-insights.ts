import type { MatchAssessment, PersonalMatch } from "./personal-match";
import type { SavedJobContent } from "./saved-jobs";

/** Describe the saved assessment; never infer qualifications from missing metadata. */
export function matchInsights(result: PersonalMatch, job: SavedJobContent) {
 const evaluated=result.assessments.filter(a=>a.evaluated!==false && !!job.requirements[a.requirementIndex]);
 const formal=evaluated.filter(a=>a.requirementNature==="FORMAL" && job.requirements[a.requirementIndex].kind==="REQUIRED" && a.classification!=="STRONG");
 return {
  strengths:evaluated.filter(a=>a.classification==="STRONG" && a.evidence.length>0),
  transferable:evaluated.filter(a=>a.evidenceRelation==="TRANSFERABLE" && a.evidence.length>0 && !formal.includes(a)),
  formal,
 };
}
export function relationLabel(assessment: MatchAssessment, nb: boolean): string | null {
 if(assessment.evaluated===false || !assessment.evidenceRelation)return null;
 return ({DIRECT:nb?"Direkte erfaring":"Direct experience",TRANSFERABLE:nb?"Overførbar erfaring":"Transferable experience",UNKNOWN:nb?"Sammenheng ikke dokumentert":"Connection not established"})[assessment.evidenceRelation];
}
