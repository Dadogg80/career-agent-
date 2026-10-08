import { documentWorkflowProxy } from "../../../../../../../../lib/document-workflow-api";
export async function POST(request:Request,{params}:{params:Promise<{runId:string}>}){return documentWorkflowProxy(request,"next",(await params).runId);}
