import { entryProxy } from "../../../../../../../lib/career-entry-api";
export async function POST(request:Request,context:{params:Promise<{entryId:string}>}){return entryProxy(request,"review",(await context.params).entryId);}
