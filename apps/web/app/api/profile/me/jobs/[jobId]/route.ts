import { savedJobProxy } from "../../../../../../lib/saved-job-api";
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) { return savedJobProxy(request, "detail", (await context.params).jobId); }
export async function DELETE(request: Request, context: { params: Promise<{ jobId: string }> }) { return savedJobProxy(request, "delete", (await context.params).jobId); }
