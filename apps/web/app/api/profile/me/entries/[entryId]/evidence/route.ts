import { entryProxy } from "../../../../../../../lib/career-entry-api";
export async function GET(request:Request,{params}:{params:Promise<{entryId:string}>}){return entryProxy(request,"evidence",(await params).entryId);}
