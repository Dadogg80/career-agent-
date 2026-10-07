import { cvProxy } from "../../../../../../../lib/cv-api";
type Context={params:Promise<{versionId:string}>};
export async function POST(r:Request,c:Context){return cvProxy(r,"approve",(await c.params).versionId);}
