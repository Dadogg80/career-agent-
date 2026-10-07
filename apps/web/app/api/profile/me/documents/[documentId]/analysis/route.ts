import { documentAnalysisProxy } from "../../../../../../../lib/document-analysis-api";
export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) { return documentAnalysisProxy(request, (await params).documentId); }
export async function POST(request: Request, { params }: { params: Promise<{ documentId: string }> }) { return documentAnalysisProxy(request, (await params).documentId); }
