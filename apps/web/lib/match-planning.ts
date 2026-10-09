import type { CompetencyClaim } from "./claims";
import type { PersonalMatch } from "./personal-match";
import type { SavedJobContent } from "./saved-jobs";

/** Include every confirmed contribution; repeated passages are packed once by the server. */
export function automaticMatchEvidence(claims:CompetencyClaim[],_job:SavedJobContent,_text:string):string[] {
 return claims.filter(c=>c.status==="CONFIRMED").map(c=>c.id);
}

export function matchSourcePreview(job:SavedJobContent):string { return job.text; }

/** Explainable coverage of the stored requirements, never a probability of employment. */
export function matchCoverage(result:PersonalMatch,job:SavedJobContent) {
 let possible=0,earned=0,uncertain=0,assessed=0,evaluated=0;
 for(let i=0;i<job.requirements.length;i++) {
  const weight=job.requirements[i].kind==="REQUIRED"?2:1;possible+=weight;
  const assessment=result.assessments.find(a=>a.requirementIndex===i);
  if(assessment && assessment.evaluated !== false) evaluated++;
  if(assessment?.evaluated!==false && assessment?.classification==="STRONG" && assessment.evidence.length){earned+=weight;assessed++;}
  else if(assessment?.evaluated!==false && assessment?.classification==="PARTIAL" && assessment.evidence.length){earned+=weight*.5;uncertain+=weight*.5;assessed++;}
  else uncertain+=weight;
 }
 return possible?{percent:Math.round(100*earned/possible),upper:Math.round(100*(earned+uncertain)/possible),assessed,evaluated,pending:job.requirements.length-evaluated,total:job.requirements.length}:null;
}
