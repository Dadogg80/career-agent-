import { claimProxy } from "../../../../../../../lib/claim-api";
export async function GET(request: Request, context: { params: Promise<{ claimId: string }> }) { return claimProxy(request, "history", (await context.params).claimId); }
