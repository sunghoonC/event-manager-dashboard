import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Download, Search, Loader2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useNewApplicantCount } from "@/hooks/useNewApplicantCount";
import {
  SEE_CHALLENGES_BY_TEMPLATE_ID,
  SEE_CHALLENGE_PARTICIPANTS,
  SEE_USERS_BY_IDS,
  type SeeChallengesByTemplateIdData,
  type SeeChallengeParticipantsData,
  type SeeUsersByIdsData,
  type Challenge,
} from "@/graphql/challenges";

export default function WeeklyParticipants() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/achievements/:challengeId");
  const challengeId = params?.challengeId ?? "";
  const challengeTemplateId = import.meta.env.VITE_CHALLENGE_TEMPLATE_ID || undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const newApplicants = useNewApplicantCount();

  // Fetch challenge info for title
  const { data: challengesData } = useQuery<SeeChallengesByTemplateIdData>(
    SEE_CHALLENGES_BY_TEMPLATE_ID,
    { variables: { challengeTemplateId }, skip: !challengeTemplateId }
  );

  const challenge: Challenge | undefined = useMemo(
    () => challengesData?.seeChallengesByTemplateId?.challenges?.find((c) => c.id === challengeId),
    [challengesData, challengeId]
  );

  const goalValue = challenge?.goals?.find((g) => g.type === "FAT")?.value ?? 100;
  const shortName = challenge?.name?.replace(/\s*뉴마핏 챌린지$/, "") ?? "";

  // Fetch participants
  const { data: participantsData, loading: participantsLoading } =
    useQuery<SeeChallengeParticipantsData>(SEE_CHALLENGE_PARTICIPANTS, {
      variables: { challengeId },
      skip: !challengeId,
    });

  const participants =
    participantsData?.seeChallengeParticipantsByChallengeId?.challengeParticipants ?? [];
  const userIds = useMemo(() => participants.map((p) => p.userId), [participants]);

  // Fetch user names
  const { data: usersData } = useQuery<SeeUsersByIdsData>(SEE_USERS_BY_IDS, {
    variables: { input: { userIds } },
    skip: userIds.length === 0,
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersData?.seeUsersByIds?.users?.forEach((u) => {
      map.set(u.id, u.name || u.nickname || "알 수 없음");
    });
    return map;
  }, [usersData]);

  // Build table data sorted by achievement descending
  const tableData = useMemo(() => {
    const mapped = participants.map((p) => {
      const fatLoss = p.totalsByType?.find((t) => t.type === "FAT")?.value ?? 0;
      const achievement = goalValue > 0 ? Math.min((fatLoss / goalValue) * 100, 100) : 0;
      return {
        userId: p.userId,
        name: userMap.get(p.userId) || "-",
        fatLoss,
        achievement,
        isAchieved: p.isAchieved,
      };
    });
    mapped.sort((a, b) => b.achievement - a.achievement);
    return mapped.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [participants, userMap, goalValue]);

  // Filter
  const filteredParticipants = tableData.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  // Excel download
  const handleExcelDownload = () => {
    const headers = ["순위", "이름", "지방 연소량(g)", "달성률(%)", "달성상태"];
    const csvContent = [
      headers.join(","),
      ...filteredParticipants.map((p) =>
        [p.rank, p.name, p.fatLoss.toFixed(1), p.achievement.toFixed(1), p.isAchieved ? "달성" : "미달성"].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${shortName}_참가자명단.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (participantsLoading) {
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
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/achievements")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{shortName} 참가자 명단</h1>
              <p className="text-muted-foreground mt-2">
                총 {filteredParticipants.length}명의 참가자
              </p>
            </div>
          </div>
          <Button onClick={handleExcelDownload} className="gap-2">
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름으로 검색"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Participants Table */}
        <Card style={{ paddingTop: "0px", paddingBottom: "0px" }}>
          <CardContent className="p-0">
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="grid grid-cols-[60px_1fr_120px_100px_100px] gap-4 items-center">
                <p className="text-sm font-medium text-muted-foreground">순위</p>
                <p className="text-sm font-medium text-muted-foreground">이름</p>
                <p className="text-sm font-medium text-muted-foreground text-right">지방 연소량(g)</p>
                <p className="text-sm font-medium text-muted-foreground text-right">달성률(%)</p>
                <p className="text-sm font-medium text-muted-foreground text-center">달성상태</p>
              </div>
            </div>

            <div className="divide-y">
              {currentParticipants.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  참가자가 없습니다
                </div>
              ) : (
                currentParticipants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="px-6 py-4 hover:bg-muted/50 organic-transition"
                  >
                    <div className="grid grid-cols-[60px_1fr_120px_100px_100px] gap-4 items-center">
                      <p className="font-semibold">{participant.rank}</p>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-right font-semibold">{participant.fatLoss.toFixed(1)}</p>
                      <p className="text-right">{participant.achievement.toFixed(1)}</p>
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            participant.isAchieved
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {participant.isAchieved ? "달성" : "미달성"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">페이지당 항목:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
