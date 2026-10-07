import { savedJobProxy } from "../../../../../lib/saved-job-api";
export async function GET(request: Request) { return savedJobProxy(request, "list"); }
export async function POST(request: Request) { return savedJobProxy(request, "save"); }
