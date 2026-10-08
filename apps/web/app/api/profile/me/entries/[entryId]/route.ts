import { entryProxy } from "../../../../../../lib/career-entry-api";
export async function PUT(request:Request,context:{params:Promise<{entryId:string}>}){return entryProxy(request,"edit",(await context.params).entryId);}
export async function DELETE(request:Request,context:{params:Promise<{entryId:string}>}){return entryProxy(request,"delete",(await context.params).entryId);}
