export type V1ModuleStatus =
  | 'not-started'
  | 'in-progress'
  | 'verifying'
  | 'completed'
  | 'on-hold';

export type V1VerificationStatus = 'pass' | 'fail' | 'untested';

export type V1ChecklistItem = {
  id: string;
  label: string;
  verification: V1VerificationStatus;
  evidence?: string;
};

export type V1Reference = {
  label: string;
  path: string;
};

export type V1Module = {
  id: string;
  name: string;
  status: V1ModuleStatus;
  relatedPages: { label: string; href: string }[];
  references?: V1Reference[];
  checklist: V1ChecklistItem[];
};

export const v1ProgressMeta = {
  version: 'V1',
  updatedAt: '2026-09-16',
  basis:
    '별도 V1 설계·로드맵 문서가 없어 현재 라우팅, 구현 코드, .bolt 설계 지침을 기준으로 등록했습니다.',
};

export const v1Modules: V1Module[] = [
  {
    id: 'progress-panel',
    name: 'V1 개발 진행률 패널',
    status: 'completed',
    relatedPages: [{ label: '전역', href: '/' }],
    references: [
      { label: '전역 레이아웃', path: 'app/layout.tsx' },
      { label: '이번 작업 요구사항', path: '사용자 요청 2026-09-08' },
    ],
    checklist: [
      {
        id: 'panel-global',
        label: '주요 페이지에서 전역 패널 접근 가능',
        verification: 'pass',
        evidence: '브라우저: / 및 /assets에서 동일 패널 접근 확인',
      },
      {
        id: 'panel-toggle',
        label: '접기·펼치기 동작 및 접힌 진행률 표시',
        verification: 'pass',
        evidence: '브라우저: 버튼 열기 및 패널 접기 동작 확인',
      },
      {
        id: 'panel-summary',
        label: '전체 진행률과 상태별 모듈 수 표시',
        verification: 'pass',
        evidence: '브라우저: PASS 비율과 상태별 집계 표시 확인',
      },
      {
        id: 'panel-accordion',
        label: '모듈별 아코디언과 완료조건 상태 표시',
        verification: 'pass',
        evidence: '브라우저: 다중 아코디언 펼침 및 상태 목록 확인',
      },
      {
        id: 'panel-mobile',
        label: '모바일에서 작은 플로팅 버튼으로 접힘',
        verification: 'pass',
        evidence: '브라우저 390×844: 기본 접힘 및 펼침 레이아웃 확인',
      },
    ],
  },
  {
    id: 'home-discovery',
    name: '메인 투자 탐색',
    status: 'completed',
    relatedPages: [{ label: '메인', href: '/' }],
    references: [{ label: '메인 화면', path: 'components/investlab.tsx' }],
    checklist: [
      {
        id: 'home-load',
        label: '메인페이지 정상 로딩',
        verification: 'pass',
        evidence: '브라우저 및 HTTP 200 응답 확인',
      },
      {
        id: 'home-category',
        label: '주식·가상자산 탭 전환',
        verification: 'pass',
        evidence: '브라우저: 가상자산 탭 활성 상태 확인',
      },
      {
        id: 'home-search',
        label: '자산명·심볼 검색 결과 표시',
        verification: 'pass',
        evidence: '브라우저: “비트” 검색 시 비트코인(BTC) 결과 확인',
      },
      {
        id: 'home-popular',
        label: '인기 종목 선택 시 미리보기 갱신',
        verification: 'pass',
        evidence: '브라우저: 삼성전자 선택 후 가격·심볼 갱신 확인',
      },
      {
        id: 'home-simulation-link',
        label: '선택 자산을 가설 단계로 전달',
        verification: 'pass',
        evidence: '브라우저: /hypothesis?asset=005930 이동 확인',
      },
    ],
  },
  {
    id: 'assets',
    name: '자산 목록 및 상세',
    status: 'not-started',
    relatedPages: [
      { label: '전체 자산', href: '/assets' },
      { label: '자산 상세', href: '/assets/TSLA' },
    ],
    references: [
      { label: '목록 라우트', path: 'app/assets/page.tsx' },
      { label: '상세 라우트', path: 'app/assets/[symbol]/page.tsx' },
      { label: '모의 데이터', path: 'lib/mock-data.ts' },
    ],
    checklist: [
      {
        id: 'assets-list',
        label: '전체 자산 목록 화면 구현',
        verification: 'fail',
        evidence: '브라우저 및 소스: /assets는 준비 중 화면',
      },
      {
        id: 'assets-filter',
        label: '목록 검색 및 자산 유형 필터',
        verification: 'fail',
        evidence: '소스 점검: 전용 목록 화면이 PlaceholderPage 상태',
      },
      {
        id: 'assets-detail',
        label: '심볼별 자산 상세 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /assets/[symbol]이 PlaceholderPage 상태',
      },
      {
        id: 'assets-data',
        label: '검증 가능한 시장 데이터 연결',
        verification: 'untested',
      },
    ],
  },
  {
    id: 'hypothesis',
    name: '투자 가설 작성',
    status: 'completed',
    relatedPages: [{ label: '가설 작성', href: '/hypothesis' }],
    references: [
      { label: '가설 라우트', path: 'app/hypothesis/page.tsx' },
      { label: '가설 작성기', path: 'components/hypothesis-builder.tsx' },
      { label: '가설 예시', path: 'lib/mock-data.ts' },
      { label: '로컬 저장 유틸', path: 'lib/investlab-storage.ts' },
      { label: '가설 공유 콘텐츠 생성', path: 'lib/investlab-share.ts' },
    ],
    checklist: [
      {
        id: 'hypothesis-templates',
        label: '가설 예시 목록 표시',
        verification: 'pass',
        evidence: '브라우저: 메인에서 가설 예시 4개 표시 확인',
      },
      {
        id: 'hypothesis-query',
        label: '자산·템플릿 선택값을 가설 경로로 전달',
        verification: 'pass',
        evidence: '브라우저: asset 및 template 쿼리 전달 확인',
      },
      {
        id: 'hypothesis-editor',
        label: '사용자 가설 입력 화면 구현',
        verification: 'pass',
        evidence: '브라우저: 자산·가설·방향·기간·변화율 입력 및 결과 미리보기 확인',
      },
      {
        id: 'hypothesis-validation',
        label: '입력 검증 후 투자 조건 단계 이동',
        verification: 'pass',
        evidence: '브라우저: 빈 값·범위 오류 안내 및 /simulation/settings 조건 쿼리 전달 확인',
      },
      {
        id: 'hypothesis-storage',
        label: '초안 자동 저장 및 저장 계획 복원·수정·삭제·초기화',
        verification: 'pass',
        evidence: '브라우저·저장 모듈: 저장 목록 반영, 중복 갱신, 새로고침 복원과 8개 저장 시나리오 확인',
      },
      {
        id: 'hypothesis-storage-recovery',
        label: '빈 값·손상 JSON·구버전 저장 데이터 안전 복구',
        verification: 'pass',
        evidence: '저장 모듈·브라우저: 파싱 실패·버전 불일치 안전 복구, 자산 링크 새로고침 후 초안 복원 확인',
      },
      {
        id: 'hypothesis-sharing',
        label: '검증 계획 링크·요약 복사 및 Web Share fallback',
        verification: 'pass',
        evidence: '브라우저: 공유 버튼, 링크·요약 복사 성공 안내와 미지원 환경 fallback 확인',
      },
      {
        id: 'hypothesis-ux-safeguards',
        label: '변경 결과 유지·중복 실행 방지·삭제 확인·모바일 터치 보완',
        verification: 'pass',
        evidence: '브라우저: 변경 안내와 실행 비활성화, 입력 오류 포커스·결과 유지·삭제 확인·모바일 터치 동작 확인',
      },
    ],
  },
  {
    id: 'simulation',
    name: '가상투자 조건 및 실행',
    status: 'in-progress',
    relatedPages: [
      { label: '투자 시작', href: '/simulation' },
      { label: '조건 설정', href: '/simulation/settings' },
    ],
    references: [
      { label: '시작 라우트', path: 'app/simulation/page.tsx' },
      { label: '설정 라우트', path: 'app/simulation/settings/page.tsx' },
      { label: '4단계 안내', path: 'components/investlab.tsx' },
    ],
    checklist: [
      {
        id: 'simulation-guide',
        label: '메인에 4단계 이용 흐름 안내',
        verification: 'pass',
        evidence: '브라우저: 투자 대상부터 결과 확인까지 4단계 표시',
      },
      {
        id: 'simulation-entry',
        label: '가상투자 시작 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /simulation이 PlaceholderPage 상태',
      },
      {
        id: 'simulation-settings',
        label: '투자 금액·기간·조건 설정',
        verification: 'fail',
        evidence: '소스 점검: /simulation/settings가 PlaceholderPage 상태',
      },
      {
        id: 'simulation-engine',
        label: '과거 데이터 기반 시뮬레이션 실행',
        verification: 'untested',
      },
      {
        id: 'simulation-errors',
        label: '잘못된 조건 및 데이터 예외 처리',
        verification: 'untested',
      },
    ],
  },
  {
    id: 'results',
    name: '결과 및 위험 분석',
    status: 'in-progress',
    relatedPages: [{ label: '시뮬레이션 결과', href: '/simulation/result' }],
    references: [
      { label: '결과 라우트', path: 'app/simulation/result/page.tsx' },
      { label: '결과 예시 UI', path: 'components/investlab.tsx' },
    ],
    checklist: [
      {
        id: 'results-preview',
        label: '메인에 결과 차트·핵심 지표 예시 표시',
        verification: 'pass',
        evidence: '브라우저: 차트와 수익률·손실·변동성 지표 표시 확인',
      },
      {
        id: 'results-period',
        label: '결과 예시 기간 탭 전환',
        verification: 'pass',
        evidence: '브라우저: 1년에서 3개월 탭 활성 전환 확인',
      },
      {
        id: 'results-page',
        label: '전용 결과 페이지 구현',
        verification: 'fail',
        evidence: '소스 점검: /simulation/result가 PlaceholderPage 상태',
      },
      {
        id: 'results-dynamic',
        label: '실행 조건에 따른 동적 결과 표시',
        verification: 'untested',
      },
      {
        id: 'results-ai',
        label: '결과 해석용 AI 대화 UI',
        verification: 'pass',
        evidence: '브라우저: AI 대화 패널 열기와 질문 버튼 표시 확인',
      },
    ],
  },
  {
    id: 'ai-assistant',
    name: '프로젝트 전용 AI 챗봇',
    status: 'in-progress',
    relatedPages: [{ label: '전역 AI 챗봇', href: '/' }],
    references: [
      { label: '챗봇 UI', path: 'components/ai-chatbot.tsx' },
      { label: 'AI API 라우트', path: 'app/api/chat/route.ts' },
      { label: '프로젝트 컨텍스트', path: 'lib/project-context.ts' },
      { label: '허용된 앱 동작과 명령 해석', path: 'lib/chat-actions.ts' },
    ],
    checklist: [
      {
        id: 'ai-global-ui',
        label: '전역 열기·닫기 및 모바일 대응 UI',
        verification: 'pass',
        evidence: '브라우저: 메인·가설 화면에서 열기·닫기 및 전역 표시 확인',
      },
      {
        id: 'ai-free-chat',
        label: '자유 입력·후속 질문·중복 전송 방지',
        verification: 'pass',
        evidence: '브라우저: 자유 문장·여러 줄 입력·연속 Enter 1회 전송 확인',
      },
      {
        id: 'ai-session',
        label: '세션 대화 유지 및 확인 후 초기화',
        verification: 'pass',
        evidence: '브라우저: /hypothesis 이동 후 기록 유지와 초기화 확인',
      },
      {
        id: 'ai-context',
        label: '프로젝트 컨텍스트 및 현재 페이지 전달',
        verification: 'pass',
        evidence: '소스·브라우저: 소형 컨텍스트와 현재 pathname 전달 확인',
      },
      {
        id: 'ai-provider',
        label: '실제 AI Provider 답변 생성',
        verification: 'untested',
        evidence: 'OPENAI_API_KEY 미설정으로 실제 모델 응답 미검증',
      },
      {
        id: 'ai-errors',
        label: '로딩·오류 안내·답변 재시도',
        verification: 'pass',
        evidence: '브라우저·API: 키 누락 503 안내와 재시도 버튼 확인',
      },
      {
        id: 'ai-app-actions',
        label: '자연어 검색·필터·페이지 이동 및 기존 UI 상태 동기화',
        verification: 'pass',
        evidence: '브라우저: 자산 검색, 유형 필터, 가설·상세 이동과 페이지 간 상태 전달 확인',
      },
      {
        id: 'ai-action-safety',
        label: '모호한 요청 확인, 빈 결과 안내 및 허용되지 않은 동작 차단',
        verification: 'pass',
        evidence: '브라우저: 빈 검색어 추가 질문, 검색 결과 없음 안내, 삭제 요청 차단 확인',
      },
    ],
  },
  {
    id: 'learning',
    name: '학습 콘텐츠',
    status: 'in-progress',
    relatedPages: [{ label: '학습 콘텐츠', href: '/learn' }],
    references: [{ label: '학습 라우트', path: 'app/learn/page.tsx' }],
    checklist: [
      {
        id: 'learning-index',
        label: '학습 콘텐츠 목록 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /learn이 PlaceholderPage 상태',
      },
      {
        id: 'learning-content',
        label: '콘텐츠 열람 화면 및 본문 구성',
        verification: 'fail',
        evidence: '소스 점검: 콘텐츠 목록·본문 구현 없음',
      },
      {
        id: 'learning-navigation',
        label: '메인·내비게이션에서 학습 화면 연결',
        verification: 'pass',
        evidence: '브라우저: 전역 내비게이션의 /learn 링크 확인',
      },
    ],
  },
  {
    id: 'account',
    name: '회원 및 계정',
    status: 'not-started',
    relatedPages: [
      { label: '로그인', href: '/login' },
      { label: '회원가입', href: '/signup' },
      { label: '마이페이지', href: '/mypage' },
    ],
    references: [
      { label: '로그인 라우트', path: 'app/login/page.tsx' },
      { label: '회원가입 라우트', path: 'app/signup/page.tsx' },
      { label: '마이페이지 라우트', path: 'app/mypage/page.tsx' },
    ],
    checklist: [
      {
        id: 'account-login',
        label: '로그인 화면 및 인증 처리',
        verification: 'fail',
        evidence: '소스 점검: /login이 PlaceholderPage 상태',
      },
      {
        id: 'account-signup',
        label: '회원가입 화면 및 입력 검증',
        verification: 'fail',
        evidence: '소스 점검: /signup이 PlaceholderPage 상태',
      },
      {
        id: 'account-mypage',
        label: '마이페이지 화면 구현',
        verification: 'pass',
        evidence: '브라우저: /mypage에서 저장 통계·최근 활동·빠른 실행, 새로고침 복원과 모바일 배치 확인',
      },
      {
        id: 'account-session',
        label: '로그인 세션 및 로그아웃 처리',
        verification: 'untested',
      },
    ],
  },
  {
    id: 'plans',
    name: '요금제 및 구독',
    status: 'not-started',
    relatedPages: [
      { label: '요금제', href: '/pricing' },
      { label: '구독', href: '/subscription' },
    ],
    references: [
      { label: '요금제 라우트', path: 'app/pricing/page.tsx' },
      { label: '구독 라우트', path: 'app/subscription/page.tsx' },
    ],
    checklist: [
      {
        id: 'plans-pricing',
        label: '요금제 비교 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /pricing이 PlaceholderPage 상태',
      },
      {
        id: 'plans-subscription',
        label: '구독 관리 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /subscription이 PlaceholderPage 상태',
      },
      {
        id: 'plans-flow',
        label: '요금제 선택부터 구독 반영까지 연결',
        verification: 'untested',
      },
    ],
  },
  {
    id: 'information',
    name: '서비스·정책·고객지원',
    status: 'not-started',
    relatedPages: [
      { label: '서비스 소개', href: '/about' },
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '고객센터', href: '/contact' },
    ],
    references: [
      { label: '소개 라우트', path: 'app/about/page.tsx' },
      { label: '정책 라우트', path: 'app/terms/page.tsx, app/privacy/page.tsx' },
      { label: '고객센터 라우트', path: 'app/contact/page.tsx' },
    ],
    checklist: [
      {
        id: 'information-about',
        label: '서비스 소개 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /about이 PlaceholderPage 상태',
      },
      {
        id: 'information-terms',
        label: '이용약관 내용 제공',
        verification: 'fail',
        evidence: '소스 점검: /terms가 PlaceholderPage 상태',
      },
      {
        id: 'information-privacy',
        label: '개인정보처리방침 내용 제공',
        verification: 'fail',
        evidence: '소스 점검: /privacy가 PlaceholderPage 상태',
      },
      {
        id: 'information-contact',
        label: '고객센터 안내 또는 문의 화면 구현',
        verification: 'fail',
        evidence: '소스 점검: /contact가 PlaceholderPage 상태',
      },
    ],
  },
];

export function calculateChecklistProgress(checklist: V1ChecklistItem[]) {
  if (checklist.length === 0) return 0;

  const passed = checklist.filter(
    (item) => item.verification === 'pass'
  ).length;

  return Math.round((passed / checklist.length) * 100);
}

export function getV1ProgressSummary(modules: V1Module[]) {
  const allChecklistItems = modules.flatMap((module) => module.checklist);
  const passedChecklistItems = allChecklistItems.filter(
    (item) => item.verification === 'pass'
  ).length;

  return {
    overallProgress:
      allChecklistItems.length === 0
        ? 0
        : Math.round(
            (passedChecklistItems / allChecklistItems.length) * 100
          ),
    passedChecklistItems,
    totalChecklistItems: allChecklistItems.length,
    moduleCounts: {
      completed: modules.filter((module) => module.status === 'completed').length,
      inProgress: modules.filter((module) => module.status === 'in-progress').length,
      verifying: modules.filter((module) => module.status === 'verifying').length,
      notStarted: modules.filter((module) => module.status === 'not-started').length,
      onHold: modules.filter((module) => module.status === 'on-hold').length,
    },
  };
}
