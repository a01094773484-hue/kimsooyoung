import assert from 'node:assert/strict';
import test from 'node:test';
import { assets } from './mock-data.ts';
import { calculateSimulation } from './simulation-engine.ts';
import { filterAndSortSimulations, findSimulationPair, parseSimulations, removeSimulationById, type SavedSimulation } from './simulation-storage.ts';

function record(id: string, symbol: string, scenario: 'rise' | 'fall' | 'flat', rate: number, amount: number, createdAt: string): SavedSimulation {
  const asset = assets.find((item) => item.symbol === symbol)!;
  return { ...calculateSimulation({ asset, initialAmount: amount, scenario, changeRate: rate }, createdAt), id, createdAt };
}

const records = [
  record('old', 'TSLA', 'rise', 10, 1_000_000, '2026-09-28T00:00:00.000Z'),
  record('middle', 'TSLA', 'fall', 8, 500_000, '2026-09-29T00:00:00.000Z'),
  record('new', 'BTC', 'flat', 0, 2_000_000, '2026-09-30T00:00:00.000Z'),
];

test('기록 목록은 기본 최신순으로 정렬된다', () => assert.deepEqual(filterAndSortSimulations(records).map((item) => item.id), ['new', 'middle', 'old']));
test('오래된순과 투자금액순 정렬을 지원한다', () => {
  assert.deepEqual(filterAndSortSimulations(records, '', 'all', 'oldest').map((item) => item.id), ['old', 'middle', 'new']);
  assert.deepEqual(filterAndSortSimulations(records, '', 'all', 'amount-desc').map((item) => item.id), ['new', 'old', 'middle']);
  assert.deepEqual(filterAndSortSimulations(records, '', 'all', 'amount-asc').map((item) => item.id), ['middle', 'old', 'new']);
});
test('자산명 검색은 trim을 적용한다', () => assert.deepEqual(filterAndSortSimulations(records, '  비트코인  ').map((item) => item.id), ['new']));
test('Symbol 검색은 대소문자를 무시한다', () => assert.equal(filterAndSortSimulations(records, 'tsla').length, 2));
test('시나리오 필터를 적용한다', () => assert.deepEqual(filterAndSortSimulations(records, '', 'fall').map((item) => item.id), ['middle']));
test('자산 유형 필터를 적용한다', () => {
  assert.deepEqual(filterAndSortSimulations(records, '', 'all', 'newest', 'crypto').map((item) => item.id), ['new']);
  assert.equal(filterAndSortSimulations(records, '', 'all', 'newest', 'stock').length, 2);
});
test('개별 삭제는 지정 ID만 제거한다', () => assert.deepEqual(removeSimulationById(records, 'middle').map((item) => item.id), ['old', 'new']));
test('삭제 결과를 직렬화 후 불러와도 삭제 상태가 유지된다', () => assert.equal(parseSimulations(JSON.stringify(removeSimulationById(records, 'old'))).some((item) => item.id === 'old'), false));
test('같은 자산의 서로 다른 조건 2개를 비교할 수 있다', () => assert.deepEqual(findSimulationPair(records, ['old', 'middle'])?.map((item) => item.returnRate), [10, -8]));
test('서로 다른 자산 2개를 비교할 수 있다', () => assert.deepEqual(findSimulationPair(records, ['old', 'new'])?.map((item) => item.asset.symbol), ['TSLA', 'BTC']));
test('ID 1개, 중복 ID, 잘못된 ID는 비교를 거부한다', () => {
  assert.equal(findSimulationPair(records, ['old']), null);
  assert.equal(findSimulationPair(records, ['old', 'old']), null);
  assert.equal(findSimulationPair(records, ['old', 'missing']), null);
});
test('Legacy Record의 누락된 선택 필드는 안전하게 보완된다', () => {
  const legacy = { ...records[0], calculatedAt: undefined, hypothesis: undefined, scenario: undefined };
  const parsed = parseSimulations(JSON.stringify([legacy]));
  assert.equal(parsed[0].calculatedAt, legacy.createdAt);
  assert.equal(parsed[0].hypothesis, undefined);
  assert.equal(parsed[0].scenario, 'rise');
});
test('손상된 Storage 문자열은 빈 목록으로 처리한다', () => assert.deepEqual(parseSimulations('{broken-json'), []));
