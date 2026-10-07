import { documentProxy } from "../../../../../../../lib/document-api";
export async function POST(request: Request, context: { params: Promise<{ documentId: string }> }) { return documentProxy(request, "reread", (await context.params).documentId); }
