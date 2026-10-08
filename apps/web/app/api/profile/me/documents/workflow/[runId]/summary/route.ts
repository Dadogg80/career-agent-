import { documentWorkflowProxy } from "../../../../../../../../lib/document-workflow-api";
export async function PUT(request:Request,{params}:{params:Promise<{runId:string}>}){return documentWorkflowProxy(request,"summary",(await params).runId);}
