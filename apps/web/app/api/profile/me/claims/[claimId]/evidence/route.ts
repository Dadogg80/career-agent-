import { claimProxy } from "../../../../../../../lib/claim-api";
export async function GET(r:Request,c:{params:Promise<{claimId:string}>}){return claimProxy(r,"evidence",(await c.params).claimId);}
