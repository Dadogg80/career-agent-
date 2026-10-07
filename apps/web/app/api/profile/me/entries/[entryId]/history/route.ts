import { entryProxy } from "../../../../../../../lib/career-entry-api";
export async function GET(request:Request,context:{params:Promise<{entryId:string}>}){return entryProxy(request,"history",(await context.params).entryId);}
