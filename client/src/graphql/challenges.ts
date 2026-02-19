import { gql } from "@apollo/client";

export type ChallengeStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface ChallengeGoal {
  type: string;
  value: number;
}

export interface Challenge {
  id: string;
  name: string;
  status: ChallengeStatus;
  startTime: string;
  endTime: string;
  goals: ChallengeGoal[];
}

export interface TypeValue {
  type: string;
  value: number;
}

export interface TimelineEvent {
  occurredAt: string;
  cumulativeByType: Record<string, number>;
}

export interface ChallengeParticipant {
  rank: number;
  userId: string;
  totalsByType: TypeValue[];
  isAchieved: boolean;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  nickname: string | null;
  gender: string | null;
}

// Query response types

export interface SeeChallengesByTemplateIdData {
  seeChallengesByTemplateId: {
    ok: boolean;
    error: string | null;
    challenges: Challenge[];
  };
}

export interface ChallengeSummary {
  challengeId: string;
  counts: {
    totalUserCount: number;
    achievedUserCount: number;
  };
  totalsByType: TypeValue[];
  timelineEvents: TimelineEvent[];
}

export interface SeeChallengeSummaryData {
  seeChallengeSummary: {
    ok: boolean;
    error: string | null;
    challengeSummary: ChallengeSummary | null;
  };
}

export interface SeeChallengeParticipantsData {
  seeChallengeParticipantsByChallengeId: {
    ok: boolean;
    error: string | null;
    challengeParticipants: ChallengeParticipant[];
  };
}

export interface SeeUsersByIdsData {
  seeUsersByIds: {
    ok: boolean;
    error: string | null;
    users: UserSummary[];
  };
}

export interface WorkoutMetrics {
  totalTime: number | null;
  distance: number | null;
  averageHeartRate: number | null;
  totalKcal: number | null;
  totalFatKcal: number | null;
  totalCarbKcal: number | null;
}

export interface Workout {
  id: string;
  startTime: string;
  endTime: string;
  duration: number | null;
  workoutType: string | null;
  workoutMetrics: WorkoutMetrics | null;
}

export interface SeeWorkoutsData {
  seeWorkouts: {
    ok: boolean;
    error: string | null;
    workouts: Workout[] | null;
  };
}

// Utilities

export function deriveChallengeStatus(c: Challenge): '진행중' | '예정' | '완료' {
  const now = new Date();
  const start = new Date(c.startTime);
  const end = new Date(c.endTime);
  if (now < start) return '예정';
  if (now <= end) return '진행중';
  return '완료';
}

// Queries

export const SEE_CHALLENGES_BY_TEMPLATE_ID = gql`
  query SeeChallengesByTemplateId($challengeTemplateId: String!) {
    seeChallengesByTemplateId(challengeTemplateId: $challengeTemplateId) {
      ok
      error
      challenges {
        id
        name
        status
        startTime
        endTime
        goals {
          type
          value
        }
      }
    }
  }
`;

export const SEE_CHALLENGE_SUMMARY = gql`
  query SeeChallengeSummary($challengeId: String!) {
    seeChallengeSummary(challengeId: $challengeId) {
      ok
      error
      challengeSummary {
        challengeId
        counts {
          totalUserCount
          achievedUserCount
        }
        totalsByType {
          type
          value
        }
        timelineEvents {
          occurredAt
          cumulativeByType
        }
      }
    }
  }
`;

export const SEE_CHALLENGE_PARTICIPANTS = gql`
  query SeeChallengeParticipantsByChallengeId($challengeId: String!) {
    seeChallengeParticipantsByChallengeId(challengeId: $challengeId) {
      ok
      error
      challengeParticipants {
        rank
        userId
        totalsByType {
          type
          value
        }
        isAchieved
        status
        createdAt
        completedAt
      }
    }
  }
`;

export const SEE_WORKOUTS = gql`
  query SeeWorkouts($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
    seeWorkouts(userId: $userId, startDate: $startDate, endDate: $endDate) {
      ok
      error
      workouts {
        id
        startTime
        endTime
        duration
        workoutType
        workoutMetrics {
          totalTime
          distance
          averageHeartRate
          totalKcal
          totalFatKcal
          totalCarbKcal
        }
      }
    }
  }
`;

export const SEE_USERS_BY_IDS = gql`
  query SeeUsersByIds($input: SeeUsersByIdsInput!) {
    seeUsersByIds(input: $input) {
      ok
      error
      users {
        id
        name
        nickname
        gender
      }
    }
  }
`;
