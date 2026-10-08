import { documentWorkflowProxy } from "../../../../../../lib/document-workflow-api";
export async function GET(request:Request){return documentWorkflowProxy(request,"latest");}
export async function POST(request:Request){return documentWorkflowProxy(request,"start");}
