import assert from 'node:assert/strict';
import test from 'node:test';
import { assets } from './mock-data.ts';
import { calculateSimulation } from './simulation-engine.ts';
import { createComparisonDifferences, createSimulationReportData } from './simulation-report.ts';
import { createSimulationId, findSimulationPair, parseSimulations, type SavedSimulation } from './simulation-storage.ts';

function record(id: string, scenario: 'rise' | 'fall', rate: number, createdAt: string): SavedSimulation {
  const asset = assets.find((item) => item.symbol === 'TSLA')!;
  return { ...calculateSimulation({ asset, initialAmount: 1_000_000, scenario, changeRate: rate, hypothesis: 'AI 수요 변화 가설' }, createdAt), id, createdAt };
}
const rise = record('tsla-rise', 'rise', 10, '2026-09-30T01:00:00.000Z');
const fall = record('tsla-fall', 'fall', 8, '2026-09-30T02:00:00.000Z');

test('동일 자산 실험 2건은 독립된 ID와 결과를 가진다', () => {
  assert.notEqual(createSimulationId(1, .1), createSimulationId(2, .2));
  assert.equal(rise.asset.symbol, fall.asset.symbol);
  assert.notEqual(rise.returnRate, fall.returnRate);
});
test('동일 자산 Record 2건은 직렬화 후에도 유지된다', () => assert.equal(parseSimulations(JSON.stringify([rise, fall])).length, 2));
test('동일 자산 2건을 비교 대상으로 조회한다', () => assert.deepEqual(findSimulationPair([rise, fall], [rise.id, fall.id])?.map((item) => item.scenario), ['rise', 'fall']));
test('비교 차이는 저장된 계산값으로 생성한다', () => {
  const differences = Object.fromEntries(createComparisonDifferences(rise, fall));
  assert.equal(differences['평가금액 차이'], '180,000원');
  assert.equal(differences['손익 차이'], '180,000원');
  assert.equal(differences['수익률 차이'], '18%p');
});
test('리포트 데이터에 자산·가설·조건·결과를 매핑한다', () => {
  const report = createSimulationReportData(rise);
  assert.equal(report.asset, '테슬라 (TSLA)');
  assert.equal(report.hypothesis, 'AI 수요 변화 가설');
  assert.equal(Object.fromEntries(report.conditions)['시나리오'], '상승 10%');
  assert.equal(Object.fromEntries(report.results)['가상 평가금액'], '1,100,000원');
});
test('가설이 없는 Legacy Record 리포트는 정보 없음으로 표시한다', () => {
  const legacy = { ...rise, hypothesis: undefined };
  assert.equal(createSimulationReportData(legacy).hypothesis, '정보 없음');
});
test('잘못된 ID는 리포트 대상으로 조회되지 않는다', () => assert.equal(findSimulationPair([rise, fall], ['missing', fall.id]), null));
test('리포트 매핑은 원본 Record를 변경하지 않는다', () => {
  const before = JSON.stringify(rise);
  createSimulationReportData(rise);
  assert.equal(JSON.stringify(rise), before);
});
