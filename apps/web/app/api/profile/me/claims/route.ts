import { claimProxy } from "../../../../../lib/claim-api";
export async function GET(request: Request) { return claimProxy(request, "list"); }
export async function POST(request: Request) { return claimProxy(request, "create"); }
