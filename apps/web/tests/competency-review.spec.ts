import { expect, test } from "@playwright/test";
import { competencyReviewGroups } from "../lib/competency-review";

test("review grouping keeps distinct contributions and indices while consolidating source labels only within their context",()=>{
  const source={skill:"React",category:"TECHNOLOGY",statement:"Built a dashboard",context:"Example AS",quote:"React",documentId:"first"};
  const drafts=[source,{...source,skill:"react",statement:"Maintained a portal",documentId:"second",additionalSources:[{documentId:"first",quote:"React"}]},{...source,context:"Other Company"}];
  const groups=competencyReviewGroups(drafts.map((draft,index)=>({draft,index})));
  expect(groups).toHaveLength(2);expect(groups[0].skills).toHaveLength(1);
  expect(groups[0].skills[0].proposals.map(p=>p.index)).toEqual([0,1]);
  expect(groups[0].skills[0].sourceIds).toEqual(["first","second"]);
  expect(groups[1].skills[0].proposals[0].index).toBe(2);
  expect(drafts[1].skill).toBe("react");expect(drafts[1].statement).toBe("Maintained a portal");
});
test("unknown organizations stay separated by document and punctuation-sensitive technologies are never treated as aliases",()=>{
  const draft={skill:"C",statement:"Listed in source",context:"Kontekst ikke oppgitt",quote:"C",documentId:"first"};
  const proposals=[draft,{...draft,documentId:"second"},{...draft,skill:"C++"},{...draft,skill:"C#"},{...draft,skill:".NET"}].map((draft,index)=>({draft,index}));
  const groups=competencyReviewGroups(proposals);
  expect(groups).toHaveLength(2);expect(groups[0].skills.map(s=>s.label)).toEqual(["C","C++","C#",".NET"]);
  expect(groups[1].skills[0].proposals[0].index).toBe(1);
});
