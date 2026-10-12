import { claimId } from "./claims";
export type CvSectionKind="PROFILE"|"SKILLS"|"EXPERIENCE"|"EDUCATION"|"ADDITIONAL"|"UNCLASSIFIED";
export type CvSection={id:string;kind:CvSectionKind;heading:string|null;paragraphIndexes:number[]};
export type CvSectionPlan={sectionId:string;action:"KEEP_UNCHANGED"|"PROPOSE_CHANGES"|"NEEDS_REVIEW";priority:"HIGH"|"MEDIUM"|"LOW";reason:string;claimIds:string[];requirementIndexes:number[];assessed:boolean;reviewedParagraphIndexes?:number[]|null};
export function isCvSectionData(value:{sections?:CvSection[]|null;sectionPlans?:CvSectionPlan[]|null}):boolean {
 const {sections,sectionPlans}=value;
 if(sections==null)return sectionPlans==null;
 if(!Array.isArray(sections)||!sections.length||sections.length>500||new Set(sections.map(s=>s?.id)).size!==sections.length||!sections.every(s=>s&&typeof s.id==="string"&&/^cv-[a-f0-9]{16}-\d{1,3}$/.test(s.id)&&["PROFILE","SKILLS","EXPERIENCE","EDUCATION","ADDITIONAL","UNCLASSIFIED"].includes(s.kind)&&(s.heading===null||typeof s.heading==="string"&&s.heading.length<=100&&!!s.heading.trim())&&Array.isArray(s.paragraphIndexes)&&!!s.paragraphIndexes.length&&s.paragraphIndexes.every(i=>Number.isInteger(i)&&i>=0&&i<500)))return false;
 const indexes=sections.flatMap(s=>s.paragraphIndexes);
 if(indexes.length>500||indexes.some((index,position)=>index!==position))return false;
 return Array.isArray(sectionPlans)&&sectionPlans.length===sections.length&&new Set(sectionPlans.map(p=>p?.sectionId)).size===sectionPlans.length&&sectionPlans.every(p=>p&&sections.some(s=>s.id===p.sectionId)&&["KEEP_UNCHANGED","PROPOSE_CHANGES","NEEDS_REVIEW"].includes(p.action)&&["HIGH","MEDIUM","LOW"].includes(p.priority)&&typeof p.reason==="string"&&!!p.reason.trim()&&p.reason.length<=600&&(p.reviewedParagraphIndexes==null || Array.isArray(p.reviewedParagraphIndexes)&&p.reviewedParagraphIndexes.every((i:number)=>Number.isInteger(i))&&JSON.stringify(p.reviewedParagraphIndexes)===JSON.stringify(sections.find(s=>s.id===p.sectionId)?.paragraphIndexes))&&typeof p.assessed==="boolean"&&(p.assessed||p.action==="NEEDS_REVIEW")&&Array.isArray(p.claimIds)&&p.claimIds.length<=10&&p.claimIds.every(id=>typeof id==="string"&&claimId.test(id))&&Array.isArray(p.requirementIndexes)&&p.requirementIndexes.length<=128&&p.requirementIndexes.every(i=>Number.isInteger(i)&&i>=0&&i<128));
}
export function cvSectionLabel(section:CvSection,nb:boolean):string {
 return section.heading??(nb?"Tekst uten tydelig seksjon":"Text without a clear section");
}
