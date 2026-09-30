import { assets } from './mock-data.ts';
import type { AssetCategory } from './mock-data';
import type { SimulationResult, SimulationScenario } from './simulation-engine';

export type SavedSimulation = SimulationResult & { id: string; createdAt: string };
export type SimulationSort = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';
export type SimulationScenarioFilter = SimulationScenario | 'all';
export type SimulationAssetFilter = AssetCategory | 'all';
export const SIMULATION_STORAGE_KEY = 'investlab-simulations-v1';

function normalizeSavedSimulation(value: unknown): SavedSimulation | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<SavedSimulation>;
  const scenarios: SimulationScenario[] = ['rise', 'fall', 'flat'];
  const asset = assets.find((candidate) => candidate.symbol === item.asset?.symbol);
  const createdAt = typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : null;
  const calculatedAt = typeof item.calculatedAt === 'string' && !Number.isNaN(Date.parse(item.calculatedAt)) ? item.calculatedAt : createdAt;
  const scenario = typeof item.scenario === 'string' && scenarios.includes(item.scenario as SimulationScenario)
    ? item.scenario as SimulationScenario
    : typeof item.returnRate === 'number' ? item.returnRate > 0 ? 'rise' : item.returnRate < 0 ? 'fall' : 'flat' : null;
  const valid = typeof item.id === 'string' && item.id.length > 0 && Boolean(createdAt && calculatedAt && asset) &&
    typeof item.initialAmount === 'number' && item.initialAmount > 0 && Number.isFinite(item.initialAmount) &&
    typeof item.basePrice === 'number' && item.basePrice > 0 && typeof item.changeRate === 'number' &&
    typeof item.estimatedValue === 'number' && typeof item.profitLoss === 'number' && typeof item.returnRate === 'number' && Boolean(scenario);
  if (!valid || !createdAt || !calculatedAt || !asset || !scenario) return null;
  return { ...item, asset: { ...asset, ...item.asset }, id: item.id!, createdAt, calculatedAt, initialAmount: item.initialAmount!, basePrice: item.basePrice!, changeRate: item.changeRate!, estimatedValue: item.estimatedValue!, profitLoss: item.profitLoss!, returnRate: item.returnRate!, scenario, hypothesis: typeof item.hypothesis === 'string' ? item.hypothesis : undefined };
}

export function parseSimulations(raw: string | null): SavedSimulation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeSavedSimulation).filter((item): item is SavedSimulation => Boolean(item));
    const unique = new Map(normalized.map((item) => [item.id, item]));
    return Array.from(unique.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch { return []; }
}

export function loadSimulations() {
  if (typeof window === 'undefined') return [];
  try { return parseSimulations(window.localStorage.getItem(SIMULATION_STORAGE_KEY)); } catch { return []; }
}

export function createSimulationId(now = Date.now(), random = Math.random()) { return `simulation-${now}-${random.toString(36).slice(2, 9)}`; }
export function findSimulationById(items: SavedSimulation[], id: string) { return items.find((item) => item.id === id) ?? null; }
export function loadSimulationById(id: string) { return findSimulationById(loadSimulations(), id); }

export function filterAndSortSimulations(items: SavedSimulation[], query = '', scenario: SimulationScenarioFilter = 'all', sort: SimulationSort = 'newest', category: SimulationAssetFilter = 'all') {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const filtered = items.filter((item) => {
    const matchesQuery = !normalizedQuery || item.asset.name.toLocaleLowerCase('ko-KR').includes(normalizedQuery) || item.asset.symbol.toLocaleLowerCase('ko-KR').includes(normalizedQuery);
    return matchesQuery && (scenario === 'all' || item.scenario === scenario) && (category === 'all' || item.asset.category === category);
  });
  return [...filtered].sort((a, b) => {
    if (sort === 'oldest') return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (sort === 'amount-desc') return b.initialAmount - a.initialAmount;
    if (sort === 'amount-asc') return a.initialAmount - b.initialAmount;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function removeSimulationById(items: SavedSimulation[], id: string) { return items.filter((item) => item.id !== id); }

export function deleteSimulation(id: string) {
  const next = removeSimulationById(loadSimulations(), id);
  try { window.localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error('기록을 삭제하지 못했어요. 브라우저 저장 설정을 확인해주세요.'); }
  return next;
}

export function findSimulationPair(items: SavedSimulation[], ids: string[]) {
  if (ids.length !== 2 || ids[0] === ids[1]) return null;
  const pair = ids.map((id) => findSimulationById(items, id));
  return pair.every((item): item is SavedSimulation => Boolean(item)) ? [pair[0]!, pair[1]!] as [SavedSimulation, SavedSimulation] : null;
}

export function saveSimulation(result: SimulationResult) {
  const current = loadSimulations();
  const saved: SavedSimulation = { ...result, id: createSimulationId(), createdAt: new Date().toISOString() };
  try { window.localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify([saved, ...current].slice(0, 50))); }
  catch { throw new Error('시뮬레이션 결과를 저장하지 못했어요. 브라우저 저장 설정을 확인해주세요.'); }
  return saved;
}

export function saveCurrentSimulation(result: SimulationResult) {
  try { window.sessionStorage.setItem('investlab-current-simulation', JSON.stringify(result)); }
  catch { throw new Error('계산 결과를 다음 화면으로 전달하지 못했어요.'); }
}

export function loadCurrentSimulation(): SimulationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem('investlab-current-simulation') ?? 'null') as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as SimulationResult;
    if (!assets.some((asset) => asset.symbol === candidate.asset?.symbol) || !Number.isFinite(candidate.initialAmount) || candidate.initialAmount <= 0) return null;
    return candidate;
  } catch { return null; }
}
