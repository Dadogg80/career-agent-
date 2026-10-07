import { documentProxy } from "../../../../../../../lib/document-api";
export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) { return documentProxy(request, "original", (await context.params).documentId); }
