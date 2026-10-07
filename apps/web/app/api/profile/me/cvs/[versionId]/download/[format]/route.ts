import { cvProxy } from "../../../../../../../../lib/cv-api";
type Context={params:Promise<{versionId:string;format:string}>};
export async function GET(r:Request,c:Context){const p=await c.params;return cvProxy(r,"download",p.versionId,p.format);}
