import { claimProxy } from "../../../../../../lib/claim-api";
type Context = { params: Promise<{ claimId: string }> };
export async function PUT(request: Request, context: Context) { return claimProxy(request, "edit", (await context.params).claimId); }
export async function DELETE(request: Request, context: Context) { return claimProxy(request, "delete", (await context.params).claimId); }
