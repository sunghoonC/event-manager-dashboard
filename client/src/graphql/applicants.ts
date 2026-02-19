import { gql } from "@apollo/client";

export type ChallengeApplicantStatus = "NEW" | "TEST_SCHEDULED" | "TEST_COMPLETED";

export interface ChallengeApplicant {
  id: string;
  userName: string;
  userPhone: string;
  testScheduledAt: string | null;
  status: ChallengeApplicantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SeeChallengeApplicantsData {
  seeChallengeApplicants: {
    ok: boolean;
    error: string | null;
    challengeApplicants: ChallengeApplicant[];
  };
}

export interface UpdateChallengeApplicantData {
  updateChallengeApplicant: {
    ok: boolean;
    error: string | null;
  };
}

export const SEE_CHALLENGE_APPLICANTS = gql`
  query SeeChallengeApplicants(
    $partnerBranchId: String
    $challengeTemplateId: String
    $skip: Int
    $take: Int
  ) {
    seeChallengeApplicants(
      partnerBranchId: $partnerBranchId
      challengeTemplateId: $challengeTemplateId
      skip: $skip
      take: $take
    ) {
      ok
      error
      challengeApplicants {
        id
        userName
        userPhone
        testScheduledAt
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_CHALLENGE_APPLICANT = gql`
  mutation UpdateChallengeApplicant($input: UpdateChallengeApplicantInput!) {
    updateChallengeApplicant(input: $input) {
      ok
      error
    }
  }
`;
