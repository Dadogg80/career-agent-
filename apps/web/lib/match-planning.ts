import type { CompetencyClaim } from "./claims";
import type { PersonalMatch } from "./personal-match";
import type { SavedJobContent } from "./saved-jobs";

const terms=(value:string)=>new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}+#.]+/gu)?.filter(t=>t.length>2)??[]);

/** Local evidence planning spends no model calls and never changes claim status. */
export function automaticMatchEvidence(claims:CompetencyClaim[],job:SavedJobContent,text:string):string[] {
 const requirementTerms=job.requirements.map(r=>terms(`${r.label} ${r.quote}`));
 const scored=claims.filter(c=>c.status==="CONFIRMED").map((c,index)=>{
  const words=terms(`${c.skill} ${c.statement} ${c.context}`);
  const score=requirementTerms.reduce((sum,required,i)=>sum+[...required].filter(t=>words.has(t)).length*(job.requirements[i].kind==="REQUIRED"?2:1),0);
  return {c,score,index};
 }).sort((a,b)=>b.score-a.score || a.index-b.index);
 let remaining=12000-text.length;const chosen:string[]=[];const passages=new Set<string>();
 for(const {c} of scored) {
  const passage=`${c.statement.trim().toLocaleLowerCase()}\u0000${c.context.trim().toLocaleLowerCase()}`;
  if(passages.has(passage))continue;
  const size=c.skill.length+c.statement.length+c.context.length;
  if(chosen.length<30 && size<=remaining){chosen.push(c.id);remaining-=size;passages.add(passage);}
 }
 return chosen;
}

export function matchSourcePreview(job:SavedJobContent):string {
 if(job.text.length<=6000)return job.text;
 // Whole source lines preserve the API's evidence checks, including requirements near the end.
 const lines=job.text.split(/\r?\n/);
 const required=job.requirements.flatMap(r=>r.quote.split(/\r?\n/).filter(Boolean));
 const priority=lines.map((line,index)=>({line,index,important:required.some(q=>line.includes(q)||q.includes(line.trim())&&!!line.trim())}));
 let size=0;const indexes=new Set<number>();
 for(const item of [...priority.filter(x=>x.important),...priority.filter(x=>!x.important)]) {
  if(size+item.line.length+1<=6000){indexes.add(item.index);size+=item.line.length+1;}
 }
 return lines.filter((_,i)=>indexes.has(i)).join("\n");
}

/** Explainable coverage of the stored requirements, never a probability of employment. */
export function matchCoverage(result:PersonalMatch,job:SavedJobContent) {
 let possible=0,earned=0,uncertain=0,assessed=0;
 for(let i=0;i<job.requirements.length;i++) {
  const weight=job.requirements[i].kind==="REQUIRED"?2:1;possible+=weight;
  const assessment=result.assessments.find(a=>a.requirementIndex===i);
  if(assessment?.classification==="STRONG" && assessment.evidence.length){earned+=weight;assessed++;}
  else if(assessment?.classification==="PARTIAL" && assessment.evidence.length){earned+=weight*.5;uncertain+=weight*.5;assessed++;}
  else uncertain+=weight;
 }
 return possible?{percent:Math.round(100*earned/possible),upper:Math.round(100*(earned+uncertain)/possible),assessed,total:job.requirements.length}:null;
}
