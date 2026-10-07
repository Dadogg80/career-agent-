import { cvProxy } from "../../../../../../lib/cv-api";
export async function GET(r:Request){return cvProxy(r,"cleanup-status");}
export async function POST(r:Request){return cvProxy(r,"cleanup");}
