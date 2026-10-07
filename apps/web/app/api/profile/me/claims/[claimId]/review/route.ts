import { claimProxy } from "../../../../../../../lib/claim-api";
export async function POST(request: Request, context: { params: Promise<{ claimId: string }> }) { return claimProxy(request, "review", (await context.params).claimId); }
