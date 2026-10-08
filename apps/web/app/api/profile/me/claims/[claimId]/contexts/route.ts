import { contextProxy } from "../../../../../../../lib/claim-context-api";
export async function GET(request: Request, context: { params: Promise<{ claimId: string }> }) {
  return contextProxy(request, (await context.params).claimId);
}
export async function POST(request: Request, context: { params: Promise<{ claimId: string }> }) {
  return contextProxy(request, (await context.params).claimId, true);
}
