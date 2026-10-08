import { cvProxy } from "../../../../../lib/cv-api";
export async function GET(r:Request){return cvProxy(r,"list");}
export async function POST(r:Request){return cvProxy(r,"create");}
