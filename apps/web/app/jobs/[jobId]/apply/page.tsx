import { Foundation } from "../../../../components/foundation";
import { claimId } from "../../../../lib/claims";
import { notFound } from "next/navigation";
export default async function PreparationPage({params}:{params:Promise<{jobId:string}>}) {
 const {jobId}=await params;
 if(!claimId.test(jobId))notFound();
 return <Foundation view="apply" jobId={jobId}/>;
}
