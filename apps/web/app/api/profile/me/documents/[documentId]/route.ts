import { documentProxy } from "../../../../../../lib/document-api";
type Context = { params: Promise<{ documentId: string }> };
export async function GET(request: Request, context: Context) { return documentProxy(request, "detail", (await context.params).documentId); }
export async function DELETE(request: Request, context: Context) { return documentProxy(request, "delete", (await context.params).documentId); }
