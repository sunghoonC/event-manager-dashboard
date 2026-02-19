import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useNewApplicantCount } from "@/hooks/useNewApplicantCount";
import {
  SEE_CHALLENGES_BY_TEMPLATE_ID,
  SEE_CHALLENGE_SUMMARY,
  deriveChallengeStatus,
  type SeeChallengesByTemplateIdData,
  type SeeChallengeSummaryData,
  type Challenge,
} from "@/graphql/challenges";

function ChallengeRow({ challenge }: { challenge: Challenge }) {
  const [, setLocation] = useLocation();
  const status = deriveChallengeStatus(challenge);

  const { data } = useQuery<SeeChallengeSummaryData>(SEE_CHALLENGE_SUMMARY, {
    variables: { challengeId: challenge.id },
  });

  const summary = data?.seeChallengeSummary?.challengeSummary;
  const total = summary?.counts?.totalUserCount ?? 0;
  const achieved = summary?.counts?.achievedUserCount ?? 0;
  const achievementRate = total > 0 ? ((achieved / total) * 100).toFixed(1) : "-";

  const start = new Date(challenge.startTime);
  const end = new Date(challenge.endTime);
  const period = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  const shortName = challenge.name.replace(/\s*뉴마핏 챌린지$/, "");

  const statusBadge = {
    "진행중": "bg-blue-100 text-blue-800",
    "예정": "bg-gray-100 text-gray-600",
    "완료": "bg-green-100 text-green-800",
  }[status];

  return (
    <div
      className="px-6 py-4 hover:bg-muted/50 cursor-pointer organic-transition flex items-center justify-between"
      onClick={() => setLocation(`/achievements/${challenge.id}`)}
    >
      <div className="w-[200px]">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{shortName}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{period}</p>
      </div>

      <div className="w-[150px] text-center">
        <p className="text-3xl font-black">
          {achievementRate === "-" ? "-" : `${achievementRate}%`}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total}명 중 달성자 ${achieved}명` : "참가자 없음"}
        </p>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function Achievements() {
  const challengeTemplateId = import.meta.env.VITE_CHALLENGE_TEMPLATE_ID || undefined;
  const newApplicants = useNewApplicantCount();

  const { data, loading } = useQuery<SeeChallengesByTemplateIdData>(
    SEE_CHALLENGES_BY_TEMPLATE_ID,
    { variables: { challengeTemplateId }, skip: !challengeTemplateId }
  );

  const challenges = useMemo(() => {
    const list = data?.seeChallengesByTemplateId?.challenges ?? [];
    return [...list].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout participantsBadge={newApplicants}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout participantsBadge={newApplicants}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">달성 현황</h1>
          <p className="text-muted-foreground mt-2">주차별 챌린지 달성 현황을 확인하세요</p>
        </div>

        <Card style={{ paddingTop: "0px", paddingBottom: "0px" }}>
          <CardContent className="p-0">
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="w-[200px]">
                  <p className="text-sm font-medium text-muted-foreground">주차</p>
                </div>
                <div className="w-[150px] text-center">
                  <p className="text-sm font-medium text-muted-foreground">달성률</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-muted-foreground">참가자</p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              {challenges.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  챌린지가 없습니다
                </div>
              ) : (
                challenges.map((challenge) => (
                  <ChallengeRow key={challenge.id} challenge={challenge} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
