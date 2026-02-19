import { useState, useMemo, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Target, Flame, Loader2 } from 'lucide-react';
import { useNewApplicantCount } from '@/hooks/useNewApplicantCount';
import {
  SEE_CHALLENGES_BY_TEMPLATE_ID,
  SEE_CHALLENGE_SUMMARY,
  SEE_CHALLENGE_PARTICIPANTS,
  SEE_USERS_BY_IDS,
  SEE_WORKOUTS,
  deriveChallengeStatus,
  type SeeChallengesByTemplateIdData,
  type SeeChallengeSummaryData,
  type SeeChallengeParticipantsData,
  type SeeUsersByIdsData,
  type SeeWorkoutsData,
  type Challenge,
} from '@/graphql/challenges';

function formatChallengeLabel(c: Challenge): string {
  const start = new Date(c.startTime);
  const end = new Date(c.endTime);
  const dateRange = `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  const shortName = c.name.replace(/\s*뉴마핏 챌린지$/, '');
  const status = deriveChallengeStatus(c);
  return `${shortName} (${dateRange}) [${status}]`;
}

export default function Home() {
  const challengeTemplateId = import.meta.env.VITE_CHALLENGE_TEMPLATE_ID || undefined;

  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<{ userId: string; name: string } | null>(null);

  const newApplicants = useNewApplicantCount();

  // 1. Fetch challenges list
  const { data: challengesData, loading: challengesLoading } = useQuery<SeeChallengesByTemplateIdData>(
    SEE_CHALLENGES_BY_TEMPLATE_ID,
    { variables: { challengeTemplateId }, skip: !challengeTemplateId }
  );

  const challenges = useMemo(() => {
    const list = challengesData?.seeChallengesByTemplateId?.challenges ?? [];
    const statusOrder = { '진행중': 0, '예정': 1, '완료': 2 };
    return [...list].sort((a, b) => {
      const sa = statusOrder[deriveChallengeStatus(a)];
      const sb = statusOrder[deriveChallengeStatus(b)];
      if (sa !== sb) return sa - sb;
      // 같은 상태 내에서는 endTime이 가장 먼 것(최미래)을 먼저
      return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
    });
  }, [challengesData]);

  // Auto-select: 진행중 중 가장 최미래(endTime 기준), 없으면 예정, 없으면 첫 번째
  useEffect(() => {
    if (challenges.length > 0 && !selectedChallengeId) {
      const inProgress = challenges.filter(c => deriveChallengeStatus(c) === '진행중');
      if (inProgress.length > 0) {
        // endTime이 가장 먼 것
        const latest = inProgress.reduce((a, b) =>
          new Date(a.endTime).getTime() >= new Date(b.endTime).getTime() ? a : b
        );
        setSelectedChallengeId(latest.id);
      } else {
        const upcoming = challenges.find(c => deriveChallengeStatus(c) === '예정');
        setSelectedChallengeId(upcoming?.id || challenges[0].id);
      }
    }
  }, [challenges, selectedChallengeId]);

  // 2. Fetch summary for selected challenge
  const { data: summaryData, loading: summaryLoading } = useQuery<SeeChallengeSummaryData>(
    SEE_CHALLENGE_SUMMARY,
    { variables: { challengeId: selectedChallengeId }, skip: !selectedChallengeId, fetchPolicy: 'cache-and-network' }
  );

  const summary = summaryData?.seeChallengeSummary?.challengeSummary;
  const totalUserCount = summary?.counts?.totalUserCount ?? 0;
  const achievedUserCount = summary?.counts?.achievedUserCount ?? 0;
  const totalFat = summary?.totalsByType?.find(t => t.type === 'FAT')?.value ?? 0;
  const achievementRate = totalUserCount > 0
    ? ((achievedUserCount / totalUserCount) * 100).toFixed(1)
    : '0.0';

  // Selected challenge info
  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);
  const goalValue = selectedChallenge?.goals?.find(g => g.type === 'FAT')?.value ?? 100;

  // 3. Fetch participants
  const { data: participantsRawData, loading: participantsLoading } = useQuery<SeeChallengeParticipantsData>(
    SEE_CHALLENGE_PARTICIPANTS,
    { variables: { challengeId: selectedChallengeId }, skip: !selectedChallengeId, fetchPolicy: 'cache-and-network' }
  );

  const participants = participantsRawData?.seeChallengeParticipantsByChallengeId?.challengeParticipants ?? [];
  const userIds = useMemo(() => participants.map(p => p.userId), [participants]);

  // 4. Chart data — hourly slots from challenge start to now
  const chartData = useMemo(() => {
    if (!selectedChallenge) return [];

    const start = new Date(selectedChallenge.startTime);
    start.setMinutes(0, 0, 0);
    const now = new Date();
    const events = summary?.timelineEvents ?? [];

    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );

    // Participant join/complete timestamps (sorted)
    const joinTimes = participants
      .map(p => new Date(p.createdAt).getTime())
      .sort((a, b) => a - b);
    const completeTimes = participants
      .filter(p => p.completedAt)
      .map(p => new Date(p.completedAt!).getTime())
      .sort((a, b) => a - b);

    const result: { date: string; participants: number; achievers: number; fatBurned: number }[] = [];
    let eventIdx = 0;
    let joinIdx = 0;
    let completeIdx = 0;
    let cumFat = 0;
    let cumParticipants = 0;
    let cumAchievers = 0;

    for (let t = new Date(start); t <= now; t.setHours(t.getHours() + 1)) {
      const tTime = t.getTime();

      while (joinIdx < joinTimes.length && joinTimes[joinIdx] <= tTime) {
        cumParticipants++;
        joinIdx++;
      }
      while (completeIdx < completeTimes.length && completeTimes[completeIdx] <= tTime) {
        cumAchievers++;
        completeIdx++;
      }
      while (eventIdx < sortedEvents.length && new Date(sortedEvents[eventIdx].occurredAt).getTime() <= tTime) {
        cumFat = (sortedEvents[eventIdx].cumulativeByType as Record<string, number>)?.fat ?? cumFat;
        eventIdx++;
      }

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const label = `${t.getMonth() + 1}/${t.getDate()}(${dayNames[t.getDay()]}) ${t.getHours().toString().padStart(2, '0')}:00`;
      result.push({
        date: label,
        participants: cumParticipants,
        achievers: cumAchievers,
        fatBurned: cumFat,
      });
    }

    // Add final data point for current time (captures events after last full hour)
    const nowTime = now.getTime();
    while (joinIdx < joinTimes.length && joinTimes[joinIdx] <= nowTime) {
      cumParticipants++;
      joinIdx++;
    }
    while (completeIdx < completeTimes.length && completeTimes[completeIdx] <= nowTime) {
      cumAchievers++;
      completeIdx++;
    }
    while (eventIdx < sortedEvents.length && new Date(sortedEvents[eventIdx].occurredAt).getTime() <= nowTime) {
      cumFat = (sortedEvents[eventIdx].cumulativeByType as Record<string, number>)?.fat ?? cumFat;
      eventIdx++;
    }
    const lastPoint = result[result.length - 1];
    if (lastPoint && (cumParticipants !== lastPoint.participants || cumAchievers !== lastPoint.achievers || cumFat !== lastPoint.fatBurned)) {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const nowLabel = `${now.getMonth() + 1}/${now.getDate()}(${dayNames[now.getDay()]}) ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      result.push({
        date: nowLabel,
        participants: cumParticipants,
        achievers: cumAchievers,
        fatBurned: cumFat,
      });
    }

    return result;
  }, [selectedChallenge, summary?.timelineEvents, participants]);

  // 5. Fetch user names
  const { data: usersData } = useQuery<SeeUsersByIdsData>(
    SEE_USERS_BY_IDS,
    { variables: { input: { userIds } }, skip: userIds.length === 0 }
  );

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersData?.seeUsersByIds?.users?.forEach(u => {
      map.set(u.id, u.name || u.nickname || '알 수 없음');
    });
    return map;
  }, [usersData]);

  // Participant table data — sorted by achievement (descending)
  const tableData = useMemo(() => {
    const mapped = participants.map(p => {
      const fatLoss = p.totalsByType?.find(t => t.type === 'FAT')?.value ?? 0;
      const achievement = goalValue > 0 ? Math.min((fatLoss / goalValue) * 100, 100) : 0;
      return {
        userId: p.userId,
        name: userMap.get(p.userId) || '-',
        fatLoss,
        achievement,
        isAchieved: p.isAchieved,
      };
    });
    mapped.sort((a, b) => b.achievement - a.achievement);
    return mapped.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [participants, userMap, goalValue]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = tableData.slice(startIndex, endIndex);

  const handleChallengeChange = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setCurrentPage(1);
  };

  // 6. Workout records (lazy)
  const [fetchWorkouts, { data: workoutsData, loading: workoutsLoading }] = useLazyQuery<SeeWorkoutsData>(SEE_WORKOUTS);

  const handleParticipantClick = (userId: string, name: string) => {
    if (!selectedChallenge) return;
    setSelectedParticipant({ userId, name });
    setWorkoutDialogOpen(true);
    fetchWorkouts({
      variables: {
        userId,
        startDate: selectedChallenge.startTime,
        endDate: selectedChallenge.endTime,
      },
    });
  };

  const workouts = workoutsData?.seeWorkouts?.workouts ?? [];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  const formatWorkoutDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (challengesLoading) {
    return (
      <DashboardLayout participantsBadge={newApplicants}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout participantsBadge={newApplicants}>
      <div>
        {/* Challenge Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">BURNING 100g 챌린지</h1>
        </div>

        {/* Week Selector */}
        <div className="mb-8">
          <Select value={selectedChallengeId} onValueChange={handleChallengeChange}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="챌린지 선택" />
            </SelectTrigger>
            <SelectContent>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {formatChallengeLabel(challenge)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">총 참가자</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalUserCount}명</div>
          </div>

          <div className="bg-card rounded-lg p-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">달성률</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{achievementRate}%</div>
          </div>

          <div className="bg-card rounded-lg p-6 card-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">총 지방 연소량</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{totalFat.toFixed(1)}g</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card rounded-lg p-6 card-shadow mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">챌린지 현황</h2>
          {summaryLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '명', position: 'insideLeft', style: { fontSize: '12px' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'g', position: 'insideRight', style: { fontSize: '12px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      participants: '총 참가자',
                      achievers: '달성자',
                      fatBurned: '지방 연소량',
                    };
                    const suffix = name === 'fatBurned' ? 'g' : '명';
                    return [`${name === 'fatBurned' ? value.toFixed(1) : value}${suffix}`, labels[name] || name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value: string) => {
                    if (value === 'participants') return '총 참가자';
                    if (value === 'achievers') return '달성자';
                    if (value === 'fatBurned') return '지방 연소량';
                    return value;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="participants"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="achievers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fatBurned"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              아직 데이터가 없습니다
            </div>
          )}
        </div>

        {/* Participant Table */}
        <div className="bg-card rounded-lg p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">참가자 랭킹</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">표시 개수:</span>
              <Select value={pageSize.toString()} onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10개</SelectItem>
                  <SelectItem value="25">25개</SelectItem>
                  <SelectItem value="50">50개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {participantsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tableData.length > 0 ? (
            <>
              <div className="border border-border rounded-lg overflow-hidden mb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold text-center w-20">순위</TableHead>
                      <TableHead className="font-semibold">이름</TableHead>
                      <TableHead className="font-semibold text-right">감량 지방량 (g)</TableHead>
                      <TableHead className="font-semibold text-right">달성률 (%)</TableHead>
                      <TableHead className="font-semibold text-center">달성 상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((participant) => (
                      <TableRow
                        key={participant.userId}
                        className="hover:bg-secondary/30 cursor-pointer"
                        onClick={() => handleParticipantClick(participant.userId, participant.name)}
                      >
                        <TableCell className="text-center font-semibold">{participant.rank}</TableCell>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell className="text-right font-semibold">{participant.fatLoss.toFixed(1)}g</TableCell>
                        <TableCell className="text-right font-semibold">{participant.achievement.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <span className={`
                            inline-block px-3 py-1 rounded-full text-xs font-medium
                            ${participant.isAchieved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                            }
                          `}>
                            {participant.isAchieved ? '달성' : '미달성'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, tableData.length)} / 총 {tableData.length}명
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              참가자가 없습니다
            </div>
          )}
        </div>
        {/* Workout Detail Dialog */}
        <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
          <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedParticipant?.name}님의 운동 기록</DialogTitle>
            </DialogHeader>
            {workoutsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                운동 기록이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {[...workouts]
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((w) => (
                  <div key={w.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {formatWorkoutDate(w.startTime)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(w.duration)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">지방 연소</span>
                        <p className="font-semibold text-orange-600">
                          {w.workoutMetrics?.totalFatKcal != null
                            ? `${w.workoutMetrics.totalFatKcal.toFixed(1)} kcal`
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">총 칼로리</span>
                        <p className="font-semibold">
                          {w.workoutMetrics?.totalKcal != null
                            ? `${w.workoutMetrics.totalKcal.toFixed(0)} kcal`
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">평균 심박</span>
                        <p className="font-semibold">
                          {w.workoutMetrics?.averageHeartRate != null
                            ? `${Math.round(w.workoutMetrics.averageHeartRate)} bpm`
                            : '-'}
                        </p>
                      </div>
                    </div>
                    {w.workoutMetrics?.distance != null && w.workoutMetrics.distance > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">거리: </span>
                        <span className="font-medium">{(w.workoutMetrics.distance / 1000).toFixed(2)} km</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
