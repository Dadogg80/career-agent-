import { entryProxy } from "../../../../../lib/career-entry-api";
export async function GET(request:Request){return entryProxy(request,"list");}
export async function POST(request:Request){return entryProxy(request,"create");}
