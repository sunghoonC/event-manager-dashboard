import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Search, Calendar, Clock, User, Phone, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  SEE_CHALLENGE_APPLICANTS,
  UPDATE_CHALLENGE_APPLICANT,
  type ChallengeApplicant,
  type SeeChallengeApplicantsData,
  type UpdateChallengeApplicantData,
} from "@/graphql/applicants";

type ApplicantStatus = "신규 신청" | "진단 예정" | "진단 완료";

const STATUS_MAP: Record<string, ApplicantStatus> = {
  NEW: "신규 신청",
  TEST_SCHEDULED: "진단 예정",
  TEST_COMPLETED: "진단 완료",
};

function deriveStatus(applicant: ChallengeApplicant): ApplicantStatus {
  return STATUS_MAP[applicant.status] ?? "신규 신청";
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function ApplicantManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ChallengeApplicant | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("");
  const [scheduleMinute, setScheduleMinute] = useState("");
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listDialogType, setListDialogType] = useState<"new" | "today">("new");

  const partnerBranchId = import.meta.env.VITE_PARTNER_BRANCH_ID || undefined;
  const challengeTemplateId = import.meta.env.VITE_CHALLENGE_TEMPLATE_ID || undefined;

  const { data, loading, error } = useQuery<SeeChallengeApplicantsData>(
    SEE_CHALLENGE_APPLICANTS,
    { variables: { partnerBranchId, challengeTemplateId } }
  );

  const [updateApplicant, { loading: updating }] = useMutation<UpdateChallengeApplicantData>(
    UPDATE_CHALLENGE_APPLICANT,
    {
      refetchQueries: [
        { query: SEE_CHALLENGE_APPLICANTS, variables: { partnerBranchId, challengeTemplateId } },
      ],
    }
  );

  const applicants: ChallengeApplicant[] =
    data?.seeChallengeApplicants?.challengeApplicants ?? [];

  const newApplicantsList = applicants.filter(
    (a) => deriveStatus(a) === "신규 신청"
  );
  const todayDiagnosisList = applicants
    .filter((a) => a.testScheduledAt && isToday(a.testScheduledAt))
    .sort(
      (a, b) =>
        new Date(a.testScheduledAt!).getTime() -
        new Date(b.testScheduledAt!).getTime()
    );

  // Filter by status
  const filteredByStatus = applicants.filter((a) => {
    if (selectedStatus === "전체") return true;
    return deriveStatus(a) === selectedStatus;
  });

  // Search + sort
  const filteredApplicants = filteredByStatus
    .filter(
      (a) =>
        a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.userPhone.includes(searchQuery)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? "오전" : "오후";
    const displayHours = hours % 12 || 12;
    return `${period} ${displayHours}시 ${minutes}분`;
  };

  const formatDate = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const handleSchedule = (applicant: ChallengeApplicant) => {
    setSelectedApplicant(applicant);

    if (applicant.testScheduledAt) {
      const scheduled = new Date(applicant.testScheduledAt);
      const dateStr = scheduled.toISOString().split("T")[0];
      const hours = scheduled.getHours().toString().padStart(2, "0");
      const minutes = scheduled.getMinutes().toString().padStart(2, "0");

      setScheduleDate(dateStr);
      setScheduleHour(hours);
      setScheduleMinute(minutes);
    } else {
      setScheduleDate("");
      setScheduleHour("");
      setScheduleMinute("");
    }

    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async () => {
    if (!selectedApplicant || !scheduleDate || !scheduleHour || !scheduleMinute)
      return;

    const testScheduledAt = new Date(
      `${scheduleDate}T${scheduleHour}:${scheduleMinute}:00`
    ).toISOString();

    try {
      const { data: result } = await updateApplicant({
        variables: {
          input: {
            challengeApplicantId: selectedApplicant.id,
            testScheduledAt,
          },
        },
      });

      if (result?.updateChallengeApplicant?.ok) {
        toast.success(
          `${selectedApplicant.userName}님의 진단 일정이 설정되었습니다.`
        );
        setScheduleDialogOpen(false);
        setScheduleDate("");
        setScheduleHour("");
        setScheduleMinute("");
      } else {
        toast.error(
          result?.updateChallengeApplicant?.error || "일정 설정에 실패했습니다."
        );
      }
    } catch (e) {
      toast.error("서버 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (applicant: ChallengeApplicant) => {
    const status = deriveStatus(applicant);

    if (status === "진단 완료") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ 진단 완료
        </span>
      );
    }
    if (status === "진단 예정" && applicant.testScheduledAt) {
      if (isToday(applicant.testScheduledAt)) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            오늘 진단 예정
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          진단 예정
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        신규 신청
      </span>
    );
  };

  const openListDialog = (type: "new" | "today") => {
    setListDialogType(type);
    setListDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">
            데이터를 불러오지 못했습니다: {error.message}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout participantsBadge={newApplicantsList.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">신청자 관리</h1>
          <p className="text-muted-foreground mt-2">
            신규 신청자의 진단 일정을 관리합니다
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow organic-transition"
            onClick={() => openListDialog("new")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                신규 신청
              </CardTitle>
              {newApplicantsList.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                  처리 필요
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {newApplicantsList.length}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow organic-transition"
            onClick={() => openListDialog("today")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                오늘 진단 예정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {todayDiagnosisList.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="이름 또는 전화번호로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["전체", "신규 신청", "진단 예정", "진단 완료"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status)}
                className="organic-transition"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Applicants List */}
        <Card style={{ paddingTop: "0px", paddingBottom: "140px" }}>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="px-6 py-3 border-b bg-muted/30">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">이름</div>
                <div className="col-span-2">전화번호</div>
                <div className="col-span-2">신청일</div>
                <div className="col-span-2">진단 예정일</div>
                <div className="col-span-2">상태</div>
                <div className="col-span-2">작업</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {filteredApplicants.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  신청자가 없습니다
                </div>
              ) : (
                filteredApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2 font-medium">
                        {applicant.userName}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {applicant.userPhone}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {formatDate(applicant.createdAt)}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {applicant.testScheduledAt
                          ? `${formatDate(applicant.testScheduledAt)} ${formatTime(applicant.testScheduledAt)}`
                          : "-"}
                      </div>
                      <div className="col-span-2">
                        {getStatusBadge(applicant)}
                      </div>
                      <div className="col-span-2">
                        {deriveStatus(applicant) === "진단 완료" ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                            <Check className="w-4 h-4" />
                            완료
                          </span>
                        ) : deriveStatus(applicant) === "진단 예정" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSchedule(applicant)}
                            className="text-muted-foreground organic-transition"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            일정 변경
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSchedule(applicant)}
                            className="organic-transition"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            일정 설정
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* List Dialog */}
        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogContent className="!max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {listDialogType === "new"
                  ? "신규 신청자 목록"
                  : "오늘 진단 예정자 목록"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="divide-y border rounded-lg">
                {(listDialogType === "new"
                  ? newApplicantsList
                  : todayDiagnosisList
                ).map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {applicant.userName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{applicant.userPhone}</span>
                        </div>
                        {listDialogType === "today" &&
                          applicant.testScheduledAt && (
                            <div
                              className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline"
                              onClick={() => {
                                setListDialogOpen(false);
                                handleSchedule(applicant);
                              }}
                            >
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatTime(applicant.testScheduledAt)}
                              </span>
                            </div>
                          )}
                      </div>
                      {listDialogType === "new" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setListDialogOpen(false);
                            handleSchedule(applicant);
                          }}
                        >
                          일정 설정
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(listDialogType === "new"
                  ? newApplicantsList
                  : todayDiagnosisList
                ).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    {listDialogType === "new"
                      ? "신규 신청자가 없습니다"
                      : "오늘 진단 예정자가 없습니다"}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>진단 일정 설정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>신청자</Label>
                <div className="mt-1 font-medium">
                  {selectedApplicant?.userName}
                </div>
              </div>
              <div>
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hour">시</Label>
                  <Select value={scheduleHour} onValueChange={setScheduleHour}>
                    <SelectTrigger id="hour" className="mt-1">
                      <SelectValue placeholder="시 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) =>
                        i.toString().padStart(2, "0")
                      ).map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minute">분</Label>
                  <Select
                    value={scheduleMinute}
                    onValueChange={setScheduleMinute}
                  >
                    <SelectTrigger id="minute" className="mt-1">
                      <SelectValue placeholder="분 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}분
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                >
                  취소
                </Button>
                <Button onClick={handleScheduleSubmit} disabled={updating}>
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  설정 완료
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
