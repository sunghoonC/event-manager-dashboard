# 이벤트 관리자 대시보드 디자인 아이디어

## 개요
이벤트 관리자를 위한 심플하고 실용적인 웹 대시보드입니다. 외부 서버, 데이터베이스, GraphQL 쿼리와의 연결이 용이하도록 구조를 설계합니다.

---

<response>
<text>
## 아이디어 1: Swiss Functionalism (스위스 기능주의)

**Design Movement**: 1950년대 스위스 국제 타이포그래피 양식에서 영감을 받은 극도로 기능적이고 명료한 디자인

**Core Principles**:
- 정보 계층의 명확성: 타이포그래피와 그리드만으로 모든 정보를 구조화
- 장식 배제: 불필요한 시각 요소 완전 제거, 기능에만 집중
- 수학적 정밀성: 8px 기반 그리드 시스템으로 모든 요소 정렬
- 흑백 대비: 회색조 팔레트로 정보의 중요도 표현

**Color Philosophy**: 
- 베이스: 순백(#FFFFFF), 순흑(#000000)
- 회색조 5단계로 정보 계층 구분 (#F5F5F5, #E0E0E0, #9E9E9E, #424242, #212121)
- 액센트: 단 하나의 색상 - 순수한 빨강(#FF0000)으로 중요 액션만 강조
- 감정적 의도: 신뢰, 명료함, 전문성

**Layout Paradigm**: 
- 좌측 고정 사이드바 (200px) + 우측 유동 콘텐츠 영역
- 8px 그리드 기반 정렬, 모든 여백은 8의 배수
- 수평/수직 구분선으로 영역 명확히 분리
- 테이블과 리스트 중심의 정보 표현

**Signature Elements**:
- 1px 검은색 구분선: 모든 섹션을 명확히 분리
- 모노스페이스 숫자: 데이터 정렬과 가독성 극대화
- 정사각형 아이콘: 16x16px 그리드 기반 아이콘 시스템

**Interaction Philosophy**:
- 즉각적 피드백: 호버 시 배경색만 변경 (애니메이션 없음)
- 명확한 상태 표시: 활성/비활성을 흑백 대비로만 표현
- 키보드 네비게이션 우선: 모든 기능 키보드로 접근 가능

**Animation**: 
- 애니메이션 최소화: 기능에 방해되는 모든 모션 제거
- 페이드 인/아웃만 허용: 100ms 이하의 빠른 전환
- 데이터 로딩: 단순한 점 3개 애니메이션

**Typography System**:
- 헤드라인: Helvetica Neue Bold, 24px/32px/40px
- 본문: Helvetica Neue Regular, 14px/16px, line-height 1.5
- 데이터/숫자: IBM Plex Mono, 14px, tabular-nums
- 모든 텍스트 좌측 정렬 원칙
</text>
<probability>0.07</probability>
</response>

<response>
<text>
## 아이디어 2: Brutalist Data (브루탈리스트 데이터)

**Design Movement**: 1960년대 브루탈리즘 건축에서 영감을 받은 날것의 구조 노출 디자인

**Core Principles**:
- 원재료 노출: HTML 기본 요소의 날것 느낌 유지
- 비대칭 균형: 의도적으로 불규칙한 레이아웃으로 긴장감 조성
- 과감한 타이포그래피: 크기 대비를 극단적으로 활용
- 기능 우선: 시각적 편안함보다 정보 전달 우선

**Color Philosophy**:
- 베이스: 콘크리트 그레이(#CCCCCC), 다크 차콜(#1A1A1A)
- 강조색: 경고 오렌지(#FF6B00), 전기 블루(#00D4FF)
- 시스템 색상: 성공(#00FF00), 오류(#FF0000) - 순수한 RGB 값
- 감정적 의도: 직접성, 솔직함, 강렬함

**Layout Paradigm**:
- 비대칭 3단 분할: 좌측 네비(15%), 중앙 콘텐츠(60%), 우측 정보(25%)
- 겹치는 레이어: 요소들이 의도적으로 서로 침범
- 격자 무시: 정렬되지 않은 듯한 배치로 역동성 표현
- 큰 여백과 밀집 영역의 극단적 대비

**Signature Elements**:
- 두꺼운 테두리: 4px 검은색 실선으로 영역 강조
- 노출된 데이터 구조: JSON 형식 그대로 보여주는 섹션
- 오버레이 레이블: 콘텐츠 위에 겹쳐진 큰 타이틀

**Interaction Philosophy**:
- 충격적 피드백: 클릭 시 전체 화면 플래시 효과
- 상태의 물리적 표현: 로딩 중 요소가 흔들림
- 직접적 조작: 드래그로 요소 재배치 가능

**Animation**:
- 급격한 전환: ease-in-out 없이 linear만 사용
- 충돌 효과: 요소가 나타날 때 튕기는 듯한 모션
- 글리치 효과: 데이터 업데이트 시 짧은 왜곡 애니메이션

**Typography System**:
- 헤드라인: Space Grotesk Bold, 48px/64px, letter-spacing -0.02em
- 본문: Courier New, 15px, line-height 1.4
- 강조: Space Grotesk Black, 96px, 화면 전체를 가로지르는 타이틀
- 대소문자 혼용: 의도적으로 불규칙한 캡스 사용
</text>
<probability>0.05</probability>
</response>

<response>
<text>
## 아이디어 3: Organic Minimalism (유기적 미니멀리즘)

**Design Movement**: 일본 와비사비와 스칸디나비아 디자인의 융합

**Core Principles**:
- 자연스러운 불완전함: 완벽한 정렬보다 유기적 흐름 추구
- 여백의 호흡: 넉넉한 공간으로 시각적 안정감 제공
- 촉각적 질감: 부드러운 그림자와 미묘한 그라데이션
- 점진적 공개: 필요한 정보만 단계적으로 노출

**Color Philosophy**:
- 베이스: 따뜻한 아이보리(#FAF8F3), 차분한 차콜(#2D2D2A)
- 자연색: 세이지 그린(#A8B5A0), 테라코타(#C97B63), 스톤 블루(#8B9DAF)
- 중성 팔레트: 베이지/그레이 5단계 (#F5F3EE, #E8E6E1, #D1CFC8, #9B9A94, #6B6A65)
- 감정적 의도: 고요함, 집중, 균형

**Layout Paradigm**:
- 유동적 비대칭: 콘텐츠에 따라 자연스럽게 확장/축소
- 카드 기반 모듈: 둥근 모서리(12px)와 부드러운 그림자
- 수직 리듬: 24px 기준선 그리드로 텍스트 정렬
- 공간의 레이어링: 전경/중경/배경의 깊이감

**Signature Elements**:
- 부드러운 그림자: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)
- 라운드 아이콘: 24px 원형 컨테이너 안의 16px 아이콘
- 미묘한 그라데이션: 배경에 5% 이하의 색상 변화

**Interaction Philosophy**:
- 부드러운 반응: 모든 상호작용에 ease-out 곡선 적용
- 맥락적 피드백: 호버 시 요소가 살짝 떠오름 (translateY -2px)
- 점진적 강조: 중요 정보는 서서히 나타남

**Animation**:
- 유기적 곡선: cubic-bezier(0.4, 0.0, 0.2, 1) 기본 사용
- 페이드 + 슬라이드: 요소가 20px 아래에서 페이드 인
- 지속 시간: 200-300ms, 절대 500ms 초과 금지
- 스태거 효과: 리스트 아이템이 50ms 간격으로 순차 등장

**Typography System**:
- 헤드라인: Instrument Serif Medium, 32px/40px, letter-spacing -0.01em
- 본문: Inter Regular, 15px, line-height 1.6, letter-spacing -0.005em
- 라벨: Inter Medium, 13px, line-height 1.4, letter-spacing 0.01em
- 숫자: Instrument Sans SemiBold, tabular-nums
- 계층: 크기보다 무게와 색상으로 구분
</text>
<probability>0.08</probability>
</response>
