import { documentAnalysisProxy } from "../../../../../../lib/document-analysis-api";
export async function GET(request: Request) { return documentAnalysisProxy(request); }
export async function POST(request: Request) { return documentAnalysisProxy(request); }
