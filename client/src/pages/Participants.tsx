import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Calendar, UserCheck, Users, X, Search, Clock } from "lucide-react";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import usersData from "@/data/users.json";
import { useNewApplicantCount } from "@/hooks/useNewApplicantCount";

export default function Participants() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chartInterval, setChartInterval] = useState<'daily' | 'weekly'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('전체');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleHour, setScheduleHour] = useState('');
  const [scheduleMinute, setScheduleMinute] = useState('');
  const [todayDiagnosisDialogOpen, setTodayDiagnosisDialogOpen] = useState(false);
  const [newApplicantsDialogOpen, setNewApplicantsDialogOpen] = useState(false);

  // Calculate stats from centralized data
  const allUsers = usersData as any[];
  const totalParticipants = allUsers.length;
  const activeParticipants = allUsers.filter(u => u.status === '참가 중').length;
  const newApplicants = useNewApplicantCount();
  const todayDiagnosis = allUsers.filter(u => u.diagnosisScheduled && u.diagnosisScheduled.startsWith('2026-02-10')).length;

  // Mock data for chart - same period (1월 12일 ~ 2월 9일), different granularities
  // 시간당: 1/12 00:00 ~ 2/9 23:00 (29일 xd7 24시간 = 696 데이터 포인트)
  const hourlyData = Array.from({ length: 29 * 24 }, (_, i) => {
    const day = Math.floor(i / 24);
    const hour = i % 24;
    const month = day < 20 ? 1 : 2;
    const date = day < 20 ? 12 + day : day - 19;
    const baseParticipants = 180 + Math.floor(day * 2.5); // 일별 증가
    const hourVariation = Math.floor(Math.random() * 2); // 시간별 변동
    return {
      date: `${month}/${date} ${hour}:00`,
      totalParticipants: baseParticipants + hourVariation,
      newApplicants: hour >= 9 && hour <= 18 ? Math.floor(Math.random() * 2) : 0,
      diagnosisCompleted: hour >= 10 && hour <= 17 ? Math.floor(Math.random() * 2) : 0,
    };
  });

  const dailyData = [
    { date: '1/12', totalParticipants: 180, newApplicants: 12, diagnosisCompleted: 8 },
    { date: '1/14', totalParticipants: 185, newApplicants: 15, diagnosisCompleted: 10 },
    { date: '1/16', totalParticipants: 192, newApplicants: 18, diagnosisCompleted: 11 },
    { date: '1/18', totalParticipants: 198, newApplicants: 14, diagnosisCompleted: 8 },
    { date: '1/20', totalParticipants: 205, newApplicants: 20, diagnosisCompleted: 13 },
    { date: '1/22', totalParticipants: 212, newApplicants: 16, diagnosisCompleted: 9 },
    { date: '1/24', totalParticipants: 218, newApplicants: 19, diagnosisCompleted: 13 },
    { date: '1/26', totalParticipants: 223, newApplicants: 13, diagnosisCompleted: 8 },
    { date: '1/28', totalParticipants: 228, newApplicants: 17, diagnosisCompleted: 12 },
    { date: '1/30', totalParticipants: 235, newApplicants: 21, diagnosisCompleted: 14 },
    { date: '2/1', totalParticipants: 240, newApplicants: 15, diagnosisCompleted: 10 },
    { date: '2/3', totalParticipants: 245, newApplicants: 18, diagnosisCompleted: 13 },
    { date: '2/5', totalParticipants: 248, newApplicants: 12, diagnosisCompleted: 9 },
    { date: '2/7', totalParticipants: 251, newApplicants: 16, diagnosisCompleted: 13 },
    { date: '2/9', totalParticipants: 253, newApplicants: 14, diagnosisCompleted: 12 },
  ];

  const weeklyData = [
    { date: '1주차', totalParticipants: 150, newApplicants: 45, diagnosisCompleted: 30 },
    { date: '2주차', totalParticipants: 180, newApplicants: 52, diagnosisCompleted: 38 },
    { date: '3주차', totalParticipants: 210, newApplicants: 48, diagnosisCompleted: 35 },
    { date: '4주차', totalParticipants: 240, newApplicants: 55, diagnosisCompleted: 42 },
    { date: '5주차', totalParticipants: 253, newApplicants: 40, diagnosisCompleted: 35 },
  ];

  const chartData = chartInterval === 'weekly' ? weeklyData : dailyData;

  // Mock detailed participant data by date
  const participantDetails: Record<string, { newApplicants: any[], diagnosisCompleted: any[] }> = {
    '1/12': {
      newApplicants: [
        { name: '김민준', phone: '010-1234-5678', state: '신규 신청' },
        { name: '박지우', phone: '010-2345-6789', state: '신규 신청' },
      ],
      diagnosisCompleted: [
        { name: '이수진', phone: '010-3456-7890', state: '진단 완료' },
        { name: '최예린', phone: '010-4567-8901', state: '진단 완료' },
      ],
    },
    '1/14': {
      newApplicants: [
        { name: '정동현', phone: '010-5678-9012', state: '신규 신청' },
        { name: '강서연', phone: '010-6789-0123', state: '신규 신청' },
        { name: '윤재희', phone: '010-7890-1234', state: '신규 신청' },
      ],
      diagnosisCompleted: [
        { name: '한지훈', phone: '010-8901-2345', state: '진단 완료' },
        { name: '오세영', phone: '010-9012-3456', state: '진단 완료' },
      ],
    },
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload) {
      const clickedDate = data.activeLabel;
      setSelectedDate(clickedDate);
      setDialogOpen(true);
    }
  };

  const selectedData = selectedDate ? participantDetails[selectedDate] : null;

  // Use centralized participant data
  const allParticipants = allUsers.map(u => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    state: u.status,
    applyDate: u.applyDate,
    diagnosisDate: u.diagnosisScheduled,
    completedDate: u.diagnosisCompleted
  }));

  // Filter and search
  const filteredParticipants = allParticipants.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.phone.includes(searchQuery);
    const matchesState = stateFilter === '전체' || p.state === stateFilter;
    return matchesSearch && matchesState;
  });

  // Sort
  const sortedParticipants = [...filteredParticipants].sort((a: any, b: any) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedParticipants.length / pageSize);
  const paginatedParticipants = sortedParticipants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSchedule = (participant: any) => {
    setSelectedParticipant(participant);
    setScheduleDate('');
    setScheduleHour('');
    setScheduleMinute('');
    setScheduleDialogOpen(true);
  };

  const handleScheduleSave = () => {
    // In real app, save to backend
    const time = `${scheduleHour}:${scheduleMinute}`;
    console.log('Saving schedule:', { participant: selectedParticipant, date: scheduleDate, time });
    setScheduleDialogOpen(false);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'totalParticipants' && '전체 인원: '}
              {entry.name === 'newApplicants' && '신규 신청자: '}
              {entry.name === 'diagnosisCompleted' && '진단 완료자: '}
              {entry.value}명
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout participantsBadge={newApplicants}>
      <div>
        <div className="space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold">참가자 관리</h1>
            <p className="text-muted-foreground mt-1">PARTICIPANT MANAGEMENT</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Participants */}
            <Card className="organic-transition hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  전체인원
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalParticipants}</div>
              </CardContent>
            </Card>

            {/* Active Participants */}
            <Card className="organic-transition hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  챌린지 참가 중
                </CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeParticipants}</div>
              </CardContent>
            </Card>

            {/* New Applicants */}
            <Card className="organic-transition hover:shadow-md cursor-pointer" onClick={() => setNewApplicantsDialogOpen(true)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  신규 신청자
                </CardTitle>
                <UserCheck className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{newApplicants}</div>
                  <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                    처리 필요
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Today's Diagnosis */}
            <Card className="organic-transition hover:shadow-md cursor-pointer" onClick={() => setTodayDiagnosisDialogOpen(true)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  오늘 진단 예정
                </CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{todayDiagnosis}</div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">참가자 추이 분석</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    전체 인원 변화 및 신규 신청자/진단 완료자 현황
                  </p>
                </div>
                <Select value={chartInterval} onValueChange={(value: any) => setChartInterval(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">일간</SelectItem>
                    <SelectItem value="weekly">주간</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: '인원 (명)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: '전체 인원 (명)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px' }}
                    formatter={(value) => {
                      if (value === 'totalParticipants') return '전체 인원';
                      if (value === 'newApplicants') return '신규 신청자';
                      if (value === 'diagnosisCompleted') return '진단 완료자';
                      return value;
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="newApplicants" 
                    fill="#93c5fd" 
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="diagnosisCompleted" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalParticipants" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Participant List Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">참가자 목록</CardTitle>
              <div className="flex items-center gap-4 mt-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="이름 또는 전화번호로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* State Filter */}
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="신규 신청">신규 신청</SelectItem>
                    <SelectItem value="진단 예정">진단 예정</SelectItem>
                    <SelectItem value="진단 완료">진단 완료</SelectItem>
                    <SelectItem value="참가 중">참가 중</SelectItem>
                    <SelectItem value="챌린지 중단">챌린지 중단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          이름 {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('phone')}>
                        <div className="flex items-center gap-1">
                          전화번호 {sortField === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('state')}>
                        <div className="flex items-center gap-1">
                          현재상태 {sortField === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('applyDate')}>
                        <div className="flex items-center gap-1">
                          신청날짜 {sortField === 'applyDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('diagnosisDate')}>
                        <div className="flex items-center gap-1">
                          진단예정일 {sortField === 'diagnosisDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3 cursor-pointer hover:bg-secondary/50" onClick={() => handleSort('completedDate')}>
                        <div className="flex items-center gap-1">
                          진단완료일 {sortField === 'completedDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </div>
                      </th>
                      <th className="text-left p-3">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedParticipants.map((participant) => (
                      <tr key={participant.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="p-3 font-medium">{participant.name}</td>
                        <td className="p-3 text-muted-foreground">{participant.phone}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            participant.state === '신규 신청' ? 'bg-blue-100 text-blue-700' :
                            participant.state === '진단 예정' ? 'bg-yellow-100 text-yellow-700' :
                            participant.state === '진단 완료' ? 'bg-purple-100 text-purple-700' :
                            participant.state === '참가 중' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {participant.state}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{participant.applyDate}</td>
                        <td className="p-3 text-sm text-muted-foreground">{participant.diagnosisDate || '-'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{participant.completedDate || '-'}</td>
                        <td className="p-3">
                          {participant.state === '신규 신청' && (
                            <Button size="sm" onClick={() => handleSchedule(participant)}>
                              <Clock className="w-3 h-3 mr-1" />
                              진단 일정 설정하기
                            </Button>
                          )}
                          {participant.state === '진단 예정' && (
                            <Button size="sm" variant="outline" onClick={() => handleSchedule(participant)}>
                              <Clock className="w-3 h-3 mr-1" />
                              진단 일정 변경하기
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">페이지당 항목:</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
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
                    size="sm" 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Participant Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-[70vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedDate} 참가자 상세
            </DialogTitle>
          </DialogHeader>
          
          {selectedData ? (
            <div className="space-y-6 mt-4">
              {/* New Applicants Section */}
              {selectedData.newApplicants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                    신규 신청자 ({selectedData.newApplicants.length}명)
                  </h3>
                  <div className="space-y-2">
                    {selectedData.newApplicants.map((person: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="grid grid-cols-[200px_200px_150px] gap-4 p-3 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{person.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{person.phone}</div>
                        <div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                            {person.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis Completed Section */}
              {selectedData.diagnosisCompleted.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    진단 완료자 ({selectedData.diagnosisCompleted.length}명)
                  </h3>
                  <div className="space-y-2">
                    {selectedData.diagnosisCompleted.map((person: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="grid grid-cols-[200px_200px_150px] gap-4 p-3 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{person.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{person.phone}</div>
                        <div>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">
                            {person.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              해당 날짜에 대한 데이터가 없습니다.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedParticipant?.state === '신규 신청' ? '진단 일정 설정하기' : '진단 일정 변경하기'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium mb-2">참가자: {selectedParticipant?.name}</p>
              <p className="text-sm text-muted-foreground">전화번호: {selectedParticipant?.phone}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">진단 날짜</label>
              <Input 
                type="date" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">진단 시간</label>
              <div className="flex gap-2">
                <Select value={scheduleHour} onValueChange={setScheduleHour}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="시간" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i}시
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={scheduleMinute} onValueChange={setScheduleMinute}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="분" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((min) => (
                      <SelectItem key={min} value={min.toString().padStart(2, '0')}>
                        {min}분
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleScheduleSave} disabled={!scheduleDate || !scheduleHour || !scheduleMinute}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Applicants Dialog */}
      <Dialog open={newApplicantsDialogOpen} onOpenChange={setNewApplicantsDialogOpen}>
        <DialogContent className="!max-w-[70vw]">
          <DialogHeader>
            <DialogTitle>신규 신청자 목록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 pb-2 border-b font-medium text-sm">
              <div>이름</div>
              <div>전화번호</div>
              <div>신청일</div>
              <div>상태</div>
              <div className="text-center">액션</div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {allParticipants
                .filter(p => p.state === '신규 신청')
                .map((participant) => (
                  <div key={participant.id} className="grid grid-cols-5 gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors items-center">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-muted-foreground">{participant.phone}</div>
                    <div className="text-sm text-muted-foreground">{participant.applyDate}</div>
                    <div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {participant.state}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSchedule(participant)}
                      >
                        일정 설정하기
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Today's Diagnosis Dialog */}
      <Dialog open={todayDiagnosisDialogOpen} onOpenChange={setTodayDiagnosisDialogOpen}>
        <DialogContent className="!max-w-[60vw]">
          <DialogHeader>
            <DialogTitle>오늘 진단 예정자 목록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 pb-2 border-b font-medium text-sm">
              <div>이름</div>
              <div>전화번호</div>
              <div>진단 예정 시간</div>
              <div>상태</div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {[
                { name: '김민수', phone: '010-1234-5678', time: '09:00', state: '진단 예정' },
                { name: '이영희', phone: '010-2345-6789', time: '10:30', state: '진단 예정' },
                { name: '박지훈', phone: '010-3456-7890', time: '14:00', state: '진단 예정' },
                { name: '정수진', phone: '010-4567-8901', time: '15:30', state: '진단 예정' },
                { name: '최동현', phone: '010-5678-9012', time: '16:00', state: '진단 예정' },
              ].map((participant, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="font-medium">{participant.name}</div>
                  <div className="text-muted-foreground">{participant.phone}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {participant.time}
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {participant.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
