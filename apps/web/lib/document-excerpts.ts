import type { DocumentDetail } from "./documents";
const separator = "\n[…]\n";

/** Spread bounded excerpts across a document rather than silently ignoring later experience. */
export function spreadExcerpt(text: string, budget: number): string {
  if (text.length <= budget) return text;
  if (budget < 120) return text.slice(0, budget);
  const share = Math.floor((budget - separator.length * 2) / 3);
  const starts = [0, Math.floor((text.length - share) / 2), text.length - share];
  return starts.map(start => text.slice(start, start + share)).join(separator);
}

/** Redistribute unused shares from short documents before selecting distributed passages. */
export function collectionExcerpts(documents: DocumentDetail[], budget = 12000): Record<string, string> {
  const readable = documents.filter(item => item.text.trim());
  const sizes = new Map<string, number>(); let remaining = budget;
  let pending = [...readable];
  while (pending.length) {
    const share = Math.floor(remaining / pending.length);
    const short = pending.filter(item => item.text.length <= share);
    if (!short.length) { for (const item of pending) sizes.set(item.document.id, share); break; }
    for (const item of short) { sizes.set(item.document.id, item.text.length); remaining -= item.text.length; }
    pending = pending.filter(item => !sizes.has(item.document.id));
  }
  return Object.fromEntries(readable.map(item => [item.document.id, spreadExcerpt(item.text, sizes.get(item.document.id) ?? 0)]));
}

/** Contiguous windows with a literal opening-context excerpt; no automatic AI calls. */
export function documentWindows(text: string, budget = 12000): {label:string;text:string}[] {
  if(text.length<=budget)return [{label:`1–${text.length}`,text}];
  const context=text.slice(0,1000);const size=budget-context.length-separator.length;
  const windows:{label:string;text:string}[]=[];
  for(let start=0;start<text.length;start+=size){windows.push({label:`${start+1}–${Math.min(text.length,start+size)}`,text:start===0?text.slice(start,start+size):context+separator+text.slice(start,start+size)});}
  return windows;
}
