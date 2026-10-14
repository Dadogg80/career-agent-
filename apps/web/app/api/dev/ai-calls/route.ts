import { aiCallDiagnosticsProxy } from "../../../../lib/ai-call-diagnostics-api";

export async function GET(request: Request) {
  return aiCallDiagnosticsProxy(request);
}

export async function POST(request: Request) {
  return aiCallDiagnosticsProxy(request);
}

export async function DELETE(request: Request) {
  return aiCallDiagnosticsProxy(request);
}
