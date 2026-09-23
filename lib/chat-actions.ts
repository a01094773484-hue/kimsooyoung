import { assets, type AssetCategory } from '@/lib/mock-data';

export const APP_ACTION_EVENT = 'investlab:app-action';
export const APP_ACTION_STORAGE_KEY = 'investlab-pending-app-action';

export type AppDestination = 'home' | 'assets' | 'hypothesis' | 'simulation' | 'settings' | 'results' | 'learn';

export type AppAction =
  | { type: 'searchAssets'; query: string; category?: AssetCategory }
  | { type: 'filterAssets'; category: 'all' | AssetCategory }
  | { type: 'navigateTo'; destination: AppDestination }
  | { type: 'openAsset'; symbol: string };

export type InterpretedCommand = {
  action?: AppAction;
  reply: string;
};

export const destinationRoutes: Record<AppDestination, string> = {
  home: '/',
  assets: '/assets',
  hypothesis: '/hypothesis',
  simulation: '/simulation',
  settings: '/simulation/settings',
  results: '/simulation/result',
  learn: '/learn',
};

const assetAliases: Record<string, string[]> = {
  '005930': ['삼성전자', '삼성', '005930'],
  TSLA: ['테슬라', 'tsla'],
  NVDA: ['엔비디아', 'nvidia', 'nvda'],
  AAPL: ['애플', 'apple', 'aapl'],
  BTC: ['비트코인', 'bitcoin', 'btc'],
  ETH: ['이더리움', 'ethereum', 'eth'],
};

function findAsset(text: string) {
  const normalized = text.toLowerCase();
  return assets.find((asset) => assetAliases[asset.symbol]?.some((alias) => normalized.includes(alias.toLowerCase())));
}

function findRecentAsset(messages: Array<{ role: string; content: string }>) {
  for (const message of [...messages].reverse()) {
    const asset = findAsset(message.content);
    if (asset) return asset;
  }
  return undefined;
}

function hasAny(text: string, expressions: RegExp[]) {
  return expressions.some((expression) => expression.test(text));
}

export function isAllowedAppAction(value: unknown): value is AppAction {
  if (!value || typeof value !== 'object') return false;
  const action = value as Partial<AppAction> & Record<string, unknown>;
  if (action.type === 'searchAssets') {
    return typeof action.query === 'string' && action.query.trim().length > 0 &&
      (action.category === undefined || action.category === 'stock' || action.category === 'crypto');
  }
  if (action.type === 'filterAssets') return action.category === 'all' || action.category === 'stock' || action.category === 'crypto';
  if (action.type === 'navigateTo') return typeof action.destination === 'string' && action.destination in destinationRoutes;
  if (action.type === 'openAsset') return typeof action.symbol === 'string' && assets.some((asset) => asset.symbol === action.symbol);
  return false;
}

export function interpretAppCommand(
  input: string,
  messages: Array<{ role: string; content: string }>
): InterpretedCommand | null {
  const text = input.trim();
  const normalized = text.toLowerCase();
  const asset = findAsset(text);
  const recentAsset = findRecentAsset(messages);

  if (hasAny(normalized, [/삭제/, /결제/, /구매/, /주문/, /저장.*덮어/, /계정.*변경/])) {
    return { reply: '이 챗봇은 안전을 위해 조회·검색·필터·화면 이동만 실행할 수 있어요.' };
  }

  const wantsDetail = hasAny(normalized, [/상세/, /자세히/, /정보.*(열어|보여)/, /(이거|그거|두 번째|해당).*열어/]);
  if (wantsDetail) {
    const target = asset ?? recentAsset;
    if (!target) return { reply: '어떤 자산의 상세 화면을 열까요? 자산 이름을 알려주세요.' };
    return {
      action: { type: 'openAsset', symbol: target.symbol },
      reply: `${target.name} 상세 화면으로 이동했어요.`,
    };
  }

  const destinations: Array<{ patterns: RegExp[]; destination: AppDestination; label: string }> = [
    { patterns: [/처음.*화면/, /메인.*(가|이동|보여)/, /홈.*(가|이동)/], destination: 'home', label: '메인' },
    { patterns: [/가설.*(작성|입력|화면|가줘|이동)/], destination: 'hypothesis', label: '투자 가설 작성' },
    { patterns: [/조건.*설정/, /설정.*화면/], destination: 'settings', label: '가상투자 조건 설정' },
    { patterns: [/결과.*(화면|조회|보여|가줘)/], destination: 'results', label: '시뮬레이션 결과' },
    { patterns: [/학습.*(콘텐츠|화면|가줘)/], destination: 'learn', label: '학습 콘텐츠' },
    { patterns: [/전체.*자산/, /자산.*목록/], destination: 'assets', label: '전체 투자 대상' },
    { patterns: [/투자해보기/, /시뮬레이션.*(시작|화면)/], destination: 'simulation', label: '투자해보기' },
  ];
  const destination = destinations.find((item) => hasAny(normalized, item.patterns));
  if (destination) {
    return {
      action: { type: 'navigateTo', destination: destination.destination },
      reply: `${destination.label} 화면으로 이동했어요.`,
    };
  }

  if (hasAny(normalized, [/주식만/, /주식.*(필터|보여|골라)/])) {
    return { action: { type: 'filterAssets', category: 'stock' }, reply: '주식만 보이도록 필터를 적용했어요.' };
  }
  if (hasAny(normalized, [/가상자산만/, /코인만/, /(가상자산|코인).*(필터|보여|골라)/])) {
    return { action: { type: 'filterAssets', category: 'crypto' }, reply: '가상자산만 보이도록 필터를 적용했어요.' };
  }
  if (hasAny(normalized, [/필터.*해제/, /전체.*보여/, /모두.*보여/])) {
    return { action: { type: 'filterAssets', category: 'all' }, reply: '필터를 해제하고 전체 자산을 표시했어요.' };
  }

  const wantsSearch = hasAny(normalized, [/찾아/, /검색/, /보여줘/, /찾아봐/, /어디.*있/]);
  if (wantsSearch && asset) {
    return {
      action: { type: 'searchAssets', query: asset.name, category: asset.category },
      reply: `${asset.name} 검색과 ${asset.category === 'stock' ? '주식' : '가상자산'} 필터를 적용했어요.`,
    };
  }
  if (wantsSearch) {
    const likelyQuery = text
      .replace(/(찾아줘|찾아봐|검색해줘|검색|보여줘|어디에 있어|어디 있어)/g, '')
      .trim();
    if (!likelyQuery) return { reply: '어떤 자산을 찾을까요? 종목명이나 코드를 알려주세요.' };
    return {
      action: { type: 'searchAssets', query: likelyQuery },
      reply: `현재 등록된 자산에서 “${likelyQuery}”을 검색했지만 결과가 없어요. 삼성전자, 테슬라, 엔비디아, 애플, 비트코인, 이더리움 중에서 다시 찾아볼까요?`,
    };
  }

  if (hasAny(normalized, [/싼 것/, /좋은 것/, /추천.*하나/, /뭐가 좋아/])) {
    return { reply: '추천 기준이 필요해요. 주식과 가상자산 중 어떤 유형을 학습하고 싶은지 알려주세요.' };
  }

  return null;
}
