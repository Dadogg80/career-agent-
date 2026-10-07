import { applicationProxy } from "../../../../../../lib/application-api";
type Context={params:Promise<{caseId:string}>};
export async function PUT(r:Request,c:Context){return applicationProxy(r,"update",(await c.params).caseId);}
export async function DELETE(r:Request,c:Context){return applicationProxy(r,"delete",(await c.params).caseId);}
