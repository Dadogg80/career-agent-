import { cvProxy } from "../../../../../../lib/cv-api";
type Context={params:Promise<{versionId:string}>};
export async function GET(r:Request,c:Context){return cvProxy(r,"detail",(await c.params).versionId);}
export async function DELETE(r:Request,c:Context){return cvProxy(r,"delete",(await c.params).versionId);}
