import { useQuery } from "@apollo/client/react";
import {
  SEE_CHALLENGE_APPLICANTS,
  type SeeChallengeApplicantsData,
} from "@/graphql/applicants";

export function useNewApplicantCount(): number {
  const partnerBranchId = import.meta.env.VITE_PARTNER_BRANCH_ID || undefined;
  const challengeTemplateId = import.meta.env.VITE_CHALLENGE_TEMPLATE_ID || undefined;

  const { data } = useQuery<SeeChallengeApplicantsData>(
    SEE_CHALLENGE_APPLICANTS,
    { variables: { partnerBranchId, challengeTemplateId } }
  );

  const applicants = data?.seeChallengeApplicants?.challengeApplicants ?? [];
  return applicants.filter((a) => a.status === "NEW").length;
}
