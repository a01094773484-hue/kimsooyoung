import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePeriod, comparePeriods } from './period-analysis.ts';
import { createPeriodStudy, createPeriodStudyId, filterAndSortPeriodStudies, findPeriodStudyById, parsePeriodStudies, PERIOD_STUDY_STORAGE_KEY, removePeriodStudyById, snapshotPeriod, updatePeriodStudyMetadata, type PeriodStudyInput } from './period-study-storage.ts';
import { SIMULATION_STORAGE_KEY } from './simulation-storage.ts';

const points = [10, 12, 9, 14, 13, 16];
const first = analyzePeriod(points, 0, 2);
const second = analyzePeriod(points, 3, 5);
if (!first.ok || !second.ok) throw new Error('테스트 구간 생성 실패');
const firstValue = first.value;
const secondValue = second.value;

function input(overrides: Partial<PeriodStudyInput> = {}): PeriodStudyInput {
  return { assetSymbol: 'TSLA', assetName: '테슬라', hypothesis: '앞 구간과 뒤 구간을 비교한다.', reflection: '변화율 차이를 확인했다.', periodA: { startIndex: 0, endIndex: 2 }, periodB: { startIndex: 3, endIndex: 5 }, analysisA: snapshotPeriod(firstValue), analysisB: snapshotPeriod(secondValue), differences: comparePeriods(firstValue, secondValue), ...overrides };
}

function study(id: string, createdAt = '2026-10-01T00:00:00.000Z', overrides: Partial<PeriodStudyInput> = {}) { return createPeriodStudy(input(overrides), createdAt, id); }

test('Study를 안정적인 ID와 생성·수정 시각으로 만든다', () => { const record = study('period-study-fixed'); assert.equal(record.id, 'period-study-fixed'); assert.equal(record.createdAt, record.updatedAt); });
test('생성 ID는 period-study namespace에서 서로 구분된다', () => { assert.notEqual(createPeriodStudyId(1, .1), createPeriodStudyId(2, .2)); assert.match(createPeriodStudyId(1, .1), /^period-study-/); });
test('A/B Snapshot과 Difference를 저장한다', () => { const record = study('snapshot'); assert.equal(record.analysisA.startPrice, 10); assert.equal(record.analysisB.endPrice, 16); assert.equal(record.differences.changeRateDifference, comparePeriods(first.value, second.value).changeRateDifference); });
test('Snapshot은 전체 points 배열을 복사하지 않는다', () => { const record = study('compact'); assert.equal('points' in record.analysisA, false); assert.equal('points' in record.analysisB, false); });
test('가설과 학습 메모를 저장하고 공백을 정리한다', () => { const record = study('text', undefined, { hypothesis: '  가설  ', reflection: '  메모  ' }); assert.equal(record.hypothesis, '가설'); assert.equal(record.reflection, '메모'); });
test('빈 가설과 메모도 안전하게 저장한다', () => { const record = study('empty-text', undefined, { hypothesis: '', reflection: '' }); assert.equal(record.hypothesis, ''); assert.equal(record.reflection, ''); });
test('직렬화 후 Reload해도 ID와 Snapshot이 유지된다', () => { const original = study('reload'); const loaded = parsePeriodStudies(JSON.stringify([original]))[0]; assert.deepEqual(loaded, original); });
test('metadata 수정은 updatedAt만 갱신하고 Snapshot은 불변이다', () => { const original = study('update'); const next = updatePeriodStudyMetadata([original], original.id, '새 가설', '새 메모', '2026-10-02T00:00:00.000Z')[0]; assert.equal(next.hypothesis, '새 가설'); assert.equal(next.updatedAt, '2026-10-02T00:00:00.000Z'); assert.deepEqual(next.analysisA, original.analysisA); assert.equal(next.createdAt, original.createdAt); });
test('개별 삭제는 지정 ID만 제거하고 Reload에도 유지된다', () => { const remaining = removePeriodStudyById([study('a'), study('b')], 'a'); assert.deepEqual(parsePeriodStudies(JSON.stringify(remaining)).map((item) => item.id), ['b']); });
test('잘못된 ID 조회는 null이다', () => { assert.equal(findPeriodStudyById([study('a')], 'missing'), null); });
test('손상된 Storage는 빈 목록으로 처리한다', () => { assert.deepEqual(parsePeriodStudies('{broken'), []); });
test('잘못된 항목만 제외하고 정상 Study는 유지한다', () => { const valid = study('valid'); const parsed = parsePeriodStudies(JSON.stringify([{ id: 'invalid' }, valid])); assert.deepEqual(parsed.map((item) => item.id), ['valid']); });
test('필수 범위 누락과 Snapshot 불일치 Record는 제외한다', () => { const valid = study('valid'); const missing = { ...valid, periodA: undefined }; const mismatch = { ...valid, id: 'mismatch', periodB: { startIndex: 0, endIndex: 1 } }; assert.deepEqual(parsePeriodStudies(JSON.stringify([missing, mismatch])), []); });
test('자산명과 Symbol을 대소문자 무시 부분 검색한다', () => { const items = [study('a')]; assert.equal(filterAndSortPeriodStudies(items, '슬라').length, 1); assert.equal(filterAndSortPeriodStudies(items, 'tsla').length, 1); });
test('가설과 Reflection을 trim 후 부분 검색한다', () => { const items = [study('a')]; assert.equal(filterAndSortPeriodStudies(items, '  뒤 구간 ').length, 1); assert.equal(filterAndSortPeriodStudies(items, '차이를 확인').length, 1); });
test('최신순과 오래된순을 지원한다', () => { const items = [study('old', '2026-10-01T00:00:00.000Z'), study('new', '2026-10-02T00:00:00.000Z')]; assert.deepEqual(filterAndSortPeriodStudies(items).map((item) => item.id), ['new', 'old']); assert.deepEqual(filterAndSortPeriodStudies(items, '', 'oldest').map((item) => item.id), ['old', 'new']); });
test('정상 Study 수는 Dashboard 집계값으로 사용할 수 있다', () => { assert.equal(parsePeriodStudies(JSON.stringify([study('a'), study('b')])).length, 2); });
test('Study와 Simulation은 서로 다른 Storage Key를 사용한다', () => { assert.notEqual(PERIOD_STUDY_STORAGE_KEY, SIMULATION_STORAGE_KEY); });
test('기존 V2 분석 결과와 Study Snapshot 값이 일치한다', () => { const record = study('regression'); assert.equal(record.analysisA.priceChange, firstValue.priceChange); assert.equal(record.analysisB.highestPrice, secondValue.highestPrice); });
test('200자 가설과 500자 메모 초과는 거부한다', () => { assert.throws(() => createPeriodStudy(input({ hypothesis: '가'.repeat(201) }))); assert.throws(() => createPeriodStudy(input({ reflection: '나'.repeat(501) }))); });
