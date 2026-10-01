import assert from 'node:assert/strict';
import test from 'node:test';
import { createPeriodStudyReportData } from './period-study-report.ts';
import { updatePeriodStudyMetadata, type PeriodStudyRecord } from './period-study-storage.ts';

const record = (hypothesis = 'A와 B의 변동폭 차이를 확인한다.', reflection = '두 구간의 수치 차이를 관찰했다.'): PeriodStudyRecord => ({
  id: 'period-study-report', assetSymbol: 'TSLA', assetName: 'Tesla', hypothesis, reflection,
  periodA: { startIndex: 0, endIndex: 7 }, periodB: { startIndex: 24, endIndex: 31 },
  analysisA: { startIndex: 0, endIndex: 7, startPrice: 100, endPrice: 112, priceChange: 12, changeRate: 12, highestPrice: 115, lowestPrice: 98, range: 17, pointCount: 8 },
  analysisB: { startIndex: 24, endIndex: 31, startPrice: 230, endPrice: 210, priceChange: -20, changeRate: -8.7, highestPrice: 235, lowestPrice: 205, range: 30, pointCount: 8 },
  differences: { priceChangeDifference: 32, changeRateDifference: 20.7, highestPriceDifference: 120, lowestPriceDifference: 107, rangeDifference: 13, pointCountDifference: 0 },
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
});

test('Study Report 데이터는 제목·자산·저장 시각을 만든다', () => { const report = createPeriodStudyReportData(record()); assert.equal(report.title, '기간 비교 학습 리포트'); assert.equal(report.asset, 'Tesla (TSLA)'); assert.ok(report.savedAt); });
test('학습 가설을 출력하고 빈 가설은 fallback한다', () => { assert.equal(createPeriodStudyReportData(record()).hypothesis, 'A와 B의 변동폭 차이를 확인한다.'); assert.equal(createPeriodStudyReportData(record('   ')).hypothesis, '가설 없음'); });
test('학습 메모를 출력하고 빈 메모는 fallback한다', () => { assert.equal(createPeriodStudyReportData(record()).reflection, '두 구간의 수치 차이를 관찰했다.'); assert.equal(createPeriodStudyReportData(record(undefined, '   ')).reflection, '작성된 학습 메모가 없습니다.'); });
test('Period A 저장 Snapshot을 그대로 매핑한다', () => { const section = createPeriodStudyReportData(record()).periodA; assert.equal(section.range, '포인트 1 ~ 8'); assert.deepEqual(section.metrics, [['시작 예시 가격', '100'], ['종료 예시 가격', '112'], ['변화액', '+12'], ['변화율', '+12%'], ['최고 예시 가격', '115'], ['최저 예시 가격', '98'], ['변동폭', '17'], ['데이터 포인트 수', '8개']]); });
test('Period B 저장 Snapshot을 그대로 매핑한다', () => { const section = createPeriodStudyReportData(record()).periodB; assert.equal(section.range, '포인트 25 ~ 32'); assert.ok(section.metrics.some(([label, value]) => label === '변화액' && value === '-20')); });
test('저장된 Difference Snapshot을 그대로 매핑한다', () => { const differences = createPeriodStudyReportData(record()).differences; assert.deepEqual(differences, [['변화액 차이', '32'], ['변화율 차이', '20.7%p'], ['최고값 차이', '120'], ['최저값 차이', '107'], ['변동폭 차이', '13'], ['포인트 수 차이', '0개']]); });
test('리포트 생성은 chartPoints 재계산 결과가 아닌 비정형 Snapshot 값도 보존한다', () => { const source = record(); source.analysisA.startPrice = 123.45; source.differences.rangeDifference = -4.25; const report = createPeriodStudyReportData(source); assert.equal(report.periodA.metrics[0][1], '123.45'); assert.equal(report.differences[4][1], '-4.25'); });
test('metadata 수정 후 리포트에 최신 가설과 메모가 반영된다', () => { const source = record(); const updated = updatePeriodStudyMetadata([source], source.id, '수정 가설', '수정 메모', '2026-09-02T00:00:00.000Z')[0]; const report = createPeriodStudyReportData(updated); assert.equal(report.hypothesis, '수정 가설'); assert.equal(report.reflection, '수정 메모'); });
test('metadata 수정과 리포트 생성은 Core Snapshot을 변경하지 않는다', () => { const source = record(); const before = JSON.stringify(source); const updated = updatePeriodStudyMetadata([source], source.id, '수정', '수정', '2026-09-02T00:00:00.000Z')[0]; createPeriodStudyReportData(updated); assert.equal(JSON.stringify(source), before); assert.deepEqual(updated.analysisA, source.analysisA); assert.deepEqual(updated.differences, source.differences); });
test('리포트 생성은 입력 Record를 변경하지 않는다', () => { const source = record(); const before = structuredClone(source); createPeriodStudyReportData(source); assert.deepEqual(source, before); });
test('교육용 안내와 Snapshot 안내를 포함한다', () => { const report = createPeriodStudyReportData(record()); assert.match(report.educationalNotice, /교육용 예시 데이터/); assert.match(report.educationalNotice, /투자 추천/); assert.match(report.snapshotNotice, /저장 당시의 계산 Snapshot/); });
