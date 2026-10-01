import type { PeriodAnalysis } from './period-analysis';
import { assets } from './mock-data.ts';

export const PERIOD_STUDY_STORAGE_KEY = 'investlab-period-studies-v1';
export const PERIOD_STUDY_CHANGED_EVENT = 'investlab-period-studies-changed';

export type PeriodSnapshot = Omit<PeriodAnalysis, 'points'>;
export type PeriodDifferenceSnapshot = {
  priceChangeDifference: number;
  changeRateDifference: number;
  highestPriceDifference: number;
  lowestPriceDifference: number;
  rangeDifference: number;
  pointCountDifference: number;
};

export type PeriodStudyRecord = {
  id: string;
  assetSymbol: string;
  assetName: string;
  hypothesis: string;
  reflection: string;
  periodA: { startIndex: number; endIndex: number };
  periodB: { startIndex: number; endIndex: number };
  analysisA: PeriodSnapshot;
  analysisB: PeriodSnapshot;
  differences: PeriodDifferenceSnapshot;
  createdAt: string;
  updatedAt: string;
};

export type PeriodStudyInput = Omit<PeriodStudyRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type PeriodStudySort = 'newest' | 'oldest';

function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function validDate(value: unknown): value is string { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function normalizeRange(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const item = value as { startIndex?: unknown; endIndex?: unknown };
  return Number.isInteger(item.startIndex) && Number.isInteger(item.endIndex) && (item.startIndex as number) >= 0 && (item.startIndex as number) <= (item.endIndex as number) ? { startIndex: item.startIndex as number, endIndex: item.endIndex as number } : null;
}

function normalizeSnapshot(value: unknown): PeriodSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PeriodSnapshot>;
  const valid = [item.startIndex, item.endIndex, item.startPrice, item.endPrice, item.priceChange, item.changeRate, item.highestPrice, item.lowestPrice, item.range, item.pointCount].every(finite);
  if (!valid || !Number.isInteger(item.startIndex) || !Number.isInteger(item.endIndex) || !Number.isInteger(item.pointCount) || item.startIndex! < 0 || item.endIndex! < item.startIndex! || item.pointCount! < 2) return null;
  return item as PeriodSnapshot;
}

function normalizeDifferences(value: unknown): PeriodDifferenceSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PeriodDifferenceSnapshot>;
  const values = [item.priceChangeDifference, item.changeRateDifference, item.highestPriceDifference, item.lowestPriceDifference, item.rangeDifference, item.pointCountDifference];
  return values.every(finite) ? item as PeriodDifferenceSnapshot : null;
}

function normalizeStudy(value: unknown): PeriodStudyRecord | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PeriodStudyRecord>;
  const analysisA = normalizeSnapshot(item.analysisA);
  const analysisB = normalizeSnapshot(item.analysisB);
  const differences = normalizeDifferences(item.differences);
  const periodA = normalizeRange(item.periodA);
  const periodB = normalizeRange(item.periodB);
  const asset = assets.find((candidate) => candidate.symbol === item.assetSymbol);
  if (typeof item.id !== 'string' || !item.id || !asset || typeof item.assetName !== 'string' || !item.assetName || !periodA || !periodB || !analysisA || !analysisB || !differences || periodA.startIndex !== analysisA.startIndex || periodA.endIndex !== analysisA.endIndex || periodB.startIndex !== analysisB.startIndex || periodB.endIndex !== analysisB.endIndex || !validDate(item.createdAt) || !validDate(item.updatedAt)) return null;
  const hypothesis = typeof item.hypothesis === 'string' ? item.hypothesis.trim().slice(0, 200) : '';
  const reflection = typeof item.reflection === 'string' ? item.reflection.trim().slice(0, 500) : '';
  return { ...item, assetName: asset.name, hypothesis, reflection, periodA, periodB, analysisA, analysisB, differences } as PeriodStudyRecord;
}

export function snapshotPeriod(value: PeriodAnalysis): PeriodSnapshot {
  const { points: _points, ...snapshot } = value;
  return snapshot;
}

export function createPeriodStudyId(now = Date.now(), random = Math.random()) { return `period-study-${now}-${random.toString(36).slice(2, 9)}`; }

export function parsePeriodStudies(raw: string | null): PeriodStudyRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeStudy).filter((item): item is PeriodStudyRecord => Boolean(item));
    const unique = new Map(normalized.map((item) => [item.id, item]));
    return Array.from(unique.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch { return []; }
}

export function loadPeriodStudies() {
  if (typeof window === 'undefined') return [];
  try { return parsePeriodStudies(window.localStorage.getItem(PERIOD_STUDY_STORAGE_KEY)); } catch { return []; }
}

export function findPeriodStudyById(items: PeriodStudyRecord[], id: string) { return items.find((item) => item.id === id) ?? null; }
export function loadPeriodStudyById(id: string) { return findPeriodStudyById(loadPeriodStudies(), id); }

export function filterAndSortPeriodStudies(items: PeriodStudyRecord[], query = '', sort: PeriodStudySort = 'newest') {
  const normalized = query.trim().toLocaleLowerCase('ko-KR');
  return items.filter((item) => !normalized || [item.assetName, item.assetSymbol, item.hypothesis, item.reflection].some((value) => value.toLocaleLowerCase('ko-KR').includes(normalized))).sort((a, b) => sort === 'oldest' ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function createPeriodStudy(input: PeriodStudyInput, now = new Date().toISOString(), id = createPeriodStudyId()): PeriodStudyRecord {
  if (!assets.some((asset) => asset.symbol === input.assetSymbol) || !input.assetName || input.hypothesis.trim().length > 200 || input.reflection.trim().length > 500) throw new Error('학습 기록 입력값을 확인해주세요.');
  if (!normalizeSnapshot(input.analysisA) || !normalizeSnapshot(input.analysisB) || !normalizeDifferences(input.differences)) throw new Error('저장할 기간 분석 결과가 올바르지 않습니다.');
  if (input.periodA.startIndex !== input.analysisA.startIndex || input.periodA.endIndex !== input.analysisA.endIndex || input.periodB.startIndex !== input.analysisB.startIndex || input.periodB.endIndex !== input.analysisB.endIndex) throw new Error('저장할 기간 범위와 분석 결과가 일치하지 않습니다.');
  return { ...input, hypothesis: input.hypothesis.trim(), reflection: input.reflection.trim(), id, createdAt: now, updatedAt: now };
}

function persist(items: PeriodStudyRecord[]) {
  window.localStorage.setItem(PERIOD_STUDY_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(PERIOD_STUDY_CHANGED_EVENT));
}

export function savePeriodStudy(input: PeriodStudyInput) {
  const record = createPeriodStudy(input);
  try { persist([record, ...loadPeriodStudies()].slice(0, 100)); }
  catch { throw new Error('학습 기록을 저장하지 못했어요. 브라우저 저장 설정을 확인해주세요.'); }
  return record;
}

export function updatePeriodStudyMetadata(items: PeriodStudyRecord[], id: string, hypothesis: string, reflection: string, updatedAt = new Date().toISOString()) {
  if (hypothesis.trim().length > 200 || reflection.trim().length > 500) throw new Error('학습 기록 입력 길이를 확인해주세요.');
  return items.map((item) => item.id === id ? { ...item, hypothesis: hypothesis.trim(), reflection: reflection.trim(), updatedAt } : item);
}

export function updatePeriodStudy(id: string, hypothesis: string, reflection: string) {
  const current = loadPeriodStudies();
  if (!findPeriodStudyById(current, id)) throw new Error('수정할 학습 기록을 찾을 수 없습니다.');
  const next = updatePeriodStudyMetadata(current, id, hypothesis, reflection);
  try { persist(next); } catch { throw new Error('학습 기록을 수정하지 못했어요.'); }
  return findPeriodStudyById(next, id)!;
}

export function removePeriodStudyById(items: PeriodStudyRecord[], id: string) { return items.filter((item) => item.id !== id); }
export function deletePeriodStudy(id: string) {
  const next = removePeriodStudyById(loadPeriodStudies(), id);
  try { persist(next); } catch { throw new Error('학습 기록을 삭제하지 못했어요.'); }
  return next;
}
