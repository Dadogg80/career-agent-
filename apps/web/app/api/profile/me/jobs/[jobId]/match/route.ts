import { personalMatchProxy } from "../../../../../../../lib/personal-match-api";
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) { return personalMatchProxy(request, (await context.params).jobId); }
export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) { return personalMatchProxy(request, (await context.params).jobId); }
