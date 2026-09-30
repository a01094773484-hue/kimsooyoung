import assert from 'node:assert/strict';
import test from 'node:test';
import { assets } from './mock-data.ts';
import { calculateSimulation } from './simulation-engine.ts';
import { createSimulationId, findSimulationById, parseSimulations, type SavedSimulation } from './simulation-storage.ts';

function record(id: string, symbol: string, scenario: 'rise' | 'fall' | 'flat', rate: number): SavedSimulation {
  const asset = assets.find((item) => item.symbol === symbol)!;
  const result = calculateSimulation({ asset, initialAmount: 1_000_000, scenario, changeRate: rate }, '2026-09-30T00:00:00.000Z');
  return { ...result, id, createdAt: '2026-09-30T00:01:00.000Z' };
}

test('생성 ID는 안정적인 prefix를 가지며 서로 구분된다', () => {
  const first = createSimulationId(1, 0.1);
  const second = createSimulationId(2, 0.2);
  assert.match(first, /^simulation-1-/);
  assert.notEqual(first, second);
});

test('ID로 정확한 저장 결과를 조회한다', () => {
  const items = [record('a', 'TSLA', 'rise', 10), record('b', 'NVDA', 'fall', 8), record('c', 'BTC', 'flat', 0)];
  assert.equal(findSimulationById(items, 'b')?.asset.symbol, 'NVDA');
  assert.equal(findSimulationById(items, 'b')?.returnRate, -8);
});

test('잘못된 ID는 null을 반환한다', () => assert.equal(findSimulationById([record('a', 'TSLA', 'rise', 10)], 'missing'), null));

test('복수 Record를 파싱해 ID별 결과를 유지한다', () => {
  const parsed = parseSimulations(JSON.stringify([record('a', 'TSLA', 'rise', 10), record('b', 'NVDA', 'fall', 8), record('c', 'BTC', 'flat', 0)]));
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed.map((item) => item.asset.symbol), ['TSLA', 'NVDA', 'BTC']);
});

test('직렬화 후 다시 파싱해도 결과가 유지된다', () => {
  const original = record('reload', 'AAPL', 'rise', 5);
  const restored = parseSimulations(JSON.stringify([original]))[0];
  assert.equal(restored.id, original.id);
  assert.equal(restored.asset.symbol, original.asset.symbol);
  assert.equal(restored.estimatedValue, original.estimatedValue);
  assert.equal(restored.returnRate, original.returnRate);
});

test('calculatedAt과 hypothesis가 없는 Legacy Record를 안전하게 보완한다', () => {
  const legacy = record('legacy', '005930', 'rise', 3) as Partial<SavedSimulation>;
  delete legacy.calculatedAt;
  delete legacy.hypothesis;
  const parsed = parseSimulations(JSON.stringify([legacy]));
  assert.equal(parsed[0].calculatedAt, legacy.createdAt);
  assert.equal(parsed[0].hypothesis, undefined);
});
