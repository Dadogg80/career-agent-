import { applicationProxy } from "../../../../../lib/application-api";
export async function GET(r:Request){return applicationProxy(r,"list");}
export async function POST(r:Request){return applicationProxy(r,"create");}
