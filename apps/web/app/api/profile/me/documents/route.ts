import { documentProxy } from "../../../../../lib/document-api";
export function GET(request: Request) { return documentProxy(request, "list"); }
export function POST(request: Request) { return documentProxy(request, "upload"); }
