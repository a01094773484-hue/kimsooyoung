export type SavedDirection = 'rise' | 'fall';
export type SavedPeriod = '1m' | '3m' | '6m' | '1y';

export type HypothesisDraft = {
  selectedSymbol: string;
  statement: string;
  direction: SavedDirection;
  targetChange: string;
  period: SavedPeriod;
};

export type SavedHypothesis = HypothesisDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type PersistedData = {
  version: 1;
  draft: HypothesisDraft | null;
  hypotheses: SavedHypothesis[];
};

const STORAGE_KEY = 'investlab-user-data';
const EMPTY_DATA: PersistedData = { version: 1, draft: null, hypotheses: [] };
const validSymbols = new Set(['005930', 'TSLA', 'NVDA', 'AAPL', 'BTC', 'ETH']);
const validDirections = new Set<SavedDirection>(['rise', 'fall']);
const validPeriods = new Set<SavedPeriod>(['1m', '3m', '6m', '1y']);

function isDraft(value: unknown): value is HypothesisDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<HypothesisDraft>;
  return typeof draft.selectedSymbol === 'string' && validSymbols.has(draft.selectedSymbol) &&
    typeof draft.statement === 'string' &&
    typeof draft.direction === 'string' && validDirections.has(draft.direction as SavedDirection) &&
    typeof draft.targetChange === 'string' &&
    typeof draft.period === 'string' && validPeriods.has(draft.period as SavedPeriod);
}

function isSavedHypothesis(value: unknown): value is SavedHypothesis {
  if (!isDraft(value)) return false;
  const saved = value as Partial<SavedHypothesis>;
  return typeof saved.id === 'string' && saved.id.length > 0 &&
    typeof saved.createdAt === 'string' && !Number.isNaN(Date.parse(saved.createdAt)) &&
    typeof saved.updatedAt === 'string' && !Number.isNaN(Date.parse(saved.updatedAt));
}

export function parsePersistedData(raw: string | null): PersistedData {
  if (!raw) return { ...EMPTY_DATA, hypotheses: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    if (parsed.version !== 1) return { ...EMPTY_DATA, hypotheses: [] };
    const draft = parsed.draft === null || parsed.draft === undefined
      ? null
      : isDraft(parsed.draft) ? parsed.draft : null;
    const hypotheses = Array.isArray(parsed.hypotheses) ? parsed.hypotheses.filter(isSavedHypothesis) : [];
    const unique = new Map(hypotheses.map((item) => [item.id, item]));
    return { version: 1, draft, hypotheses: Array.from(unique.values()).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)) };
  } catch {
    return { ...EMPTY_DATA, hypotheses: [] };
  }
}

function readData() {
  if (typeof window === 'undefined') return { ...EMPTY_DATA, hypotheses: [] };
  try {
    return parsePersistedData(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...EMPTY_DATA, hypotheses: [] };
  }
}

function writeData(data: PersistedData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    throw new Error('저장소를 사용할 수 없어요. 브라우저 저장 설정을 확인해주세요.');
  }
}

export function loadUserData() { return readData(); }

export function loadUserDataState(): { data: PersistedData; error: string | null } {
  if (typeof window === 'undefined') return { data: { ...EMPTY_DATA, hypotheses: [] }, error: null };
  try {
    return { data: parsePersistedData(window.localStorage.getItem(STORAGE_KEY)), error: null };
  } catch {
    return {
      data: { ...EMPTY_DATA, hypotheses: [] },
      error: '브라우저 저장소에 접근할 수 없어요. 저장 설정을 확인한 뒤 다시 시도해주세요.',
    };
  }
}

export function saveDraft(draft: HypothesisDraft) {
  const current = readData();
  writeData({ ...current, draft });
}

export function clearDraft() {
  const current = readData();
  writeData({ ...current, draft: null });
}

function fingerprint(item: HypothesisDraft) {
  return `${item.selectedSymbol}|${item.statement.trim().toLowerCase()}|${item.direction}|${item.targetChange}|${item.period}`;
}

export function saveHypothesis(draft: HypothesisDraft, editingId?: string | null) {
  const current = readData();
  const now = new Date().toISOString();
  const existing = editingId
    ? current.hypotheses.find((item) => item.id === editingId)
    : current.hypotheses.find((item) => fingerprint(item) === fingerprint(draft));
  const saved: SavedHypothesis = {
    ...draft,
    id: existing?.id ?? `hypothesis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const hypotheses = [saved, ...current.hypotheses.filter((item) => item.id !== saved.id)]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  writeData({ version: 1, draft, hypotheses });
  return { saved, hypotheses, updated: Boolean(existing) };
}

export function deleteHypothesis(id: string) {
  const current = readData();
  const hypotheses = current.hypotheses.filter((item) => item.id !== id);
  writeData({ ...current, hypotheses });
  return hypotheses;
}

export function clearAllUserData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    throw new Error('저장 기록을 초기화하지 못했어요. 잠시 후 다시 시도해주세요.');
  }
}
