import { documentProxy } from "../../../../../../../lib/document-api";
export async function POST(request: Request, context: { params: Promise<{ documentId: string }> }) { return documentProxy(request, "master", (await context.params).documentId); }
