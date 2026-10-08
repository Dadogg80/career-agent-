import { documentWorkflowProxy } from "../../../../../../../lib/document-workflow-api";
export async function GET(request:Request,{params}:{params:Promise<{runId:string}>}){return documentWorkflowProxy(request,"load",(await params).runId);}
