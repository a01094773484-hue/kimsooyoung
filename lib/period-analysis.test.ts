import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePeriod, comparePeriods, getPointDetail, getRangeHighlightLayout, getRangeOverlap, selectPeriodRange } from './period-analysis.ts';

const sample = [100, 120, 90, 130, 130];

test('전체 기간의 시작·종료 가격과 포인트 수를 계산한다', () => {
  const result = analyzePeriod(sample, 0, 4);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.startPrice, 100);
  assert.equal(result.value.endPrice, 130);
  assert.equal(result.value.pointCount, 5);
});

test('가격 변화액과 변화율을 계산한다', () => {
  const result = analyzePeriod(sample, 0, 1);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.priceChange, 20);
  assert.equal(result.value.changeRate, 20);
});

test('최고·최저·변동폭을 계산한다', () => {
  const result = analyzePeriod(sample, 0, 4);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.highestPrice, 130);
  assert.equal(result.value.lowestPrice, 90);
  assert.equal(result.value.range, 40);
});

test('최소 2개 포인트의 상승 구간을 계산한다', () => {
  const result = analyzePeriod(sample, 0, 1);
  assert.equal(result.ok && result.value.priceChange > 0, true);
});

test('하락 구간을 계산한다', () => {
  const result = analyzePeriod(sample, 1, 2);
  assert.equal(result.ok && result.value.priceChange < 0, true);
});

test('변화가 없는 구간은 NaN 없이 0을 반환한다', () => {
  const result = analyzePeriod(sample, 3, 4);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.priceChange, 0);
  assert.equal(result.value.changeRate, 0);
  assert.equal(Number.isFinite(result.value.changeRate), true);
});

test('포인트 1건도 안전하게 계산한다', () => {
  const result = analyzePeriod(sample, 2, 2);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.pointCount, 1);
  assert.equal(result.value.range, 0);
  assert.equal(result.value.changeRate, 0);
});

test('빈 데이터는 오류를 반환한다', () => {
  assert.equal(analyzePeriod([], 0, 0).ok, false);
});

test('시작이 종료보다 뒤인 범위는 오류를 반환한다', () => {
  assert.equal(analyzePeriod(sample, 3, 1).ok, false);
});

test('데이터 범위 밖 포인트는 오류를 반환한다', () => {
  assert.equal(analyzePeriod(sample, 0, 5).ok, false);
});

test('두 기간의 변화액·변화율·변동폭 차이를 계산한다', () => {
  const first = analyzePeriod(sample, 0, 1);
  const second = analyzePeriod(sample, 1, 2);
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  const difference = comparePeriods(first.value, second.value);
  assert.equal(difference.priceChangeDifference, 50);
  assert.equal(difference.changeRateDifference, 45);
  assert.equal(difference.rangeDifference, 10);
});

test('사용자 지정 범위와 기존 앞 8개 프리셋 범위를 계산한다', () => {
  const points = Array.from({ length: 32 }, (_, index) => index + 1);
  const custom = selectPeriodRange(points, 2, 9);
  const preset = selectPeriodRange(points, 0, 7);
  assert.equal(custom.ok && custom.value.pointCount === 8 && custom.value.startPrice === 3, true);
  assert.equal(preset.ok && preset.value.endPrice === 8, true);
});

test('첫 2개, 마지막 2개, 전체 32개 범위를 지원한다', () => {
  const points = Array.from({ length: 32 }, (_, index) => index + 1);
  assert.equal(selectPeriodRange(points, 0, 1).ok, true);
  assert.equal(selectPeriodRange(points, 30, 31).ok, true);
  const all = selectPeriodRange(points, 0, 31);
  assert.equal(all.ok && all.value.pointCount === 32, true);
});

test('직접 선택은 역방향, 범위 초과, NaN, 1개 포인트를 거부한다', () => {
  assert.equal(selectPeriodRange(sample, 3, 1).ok, false);
  assert.equal(selectPeriodRange(sample, 0, 5).ok, false);
  assert.equal(selectPeriodRange(sample, Number.NaN, 2).ok, false);
  const single = selectPeriodRange(sample, 1, 1);
  assert.equal(single.ok, false);
  if (!single.ok) assert.match(single.error, /2개 이상/);
});

test('A/B 동일 범위는 모든 비교 차이가 0이다', () => {
  const first = selectPeriodRange(sample, 0, 2);
  const second = selectPeriodRange(sample, 0, 2);
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.deepEqual(comparePeriods(first.value, second.value), {
    priceChangeDifference: 0,
    changeRateDifference: 0,
    highestPriceDifference: 0,
    lowestPriceDifference: 0,
    rangeDifference: 0,
    pointCountDifference: 0,
  });
});

test('A/B 서로 다른 범위와 겹치는 범위를 독립 계산한다', () => {
  const first = selectPeriodRange(sample, 0, 2);
  const different = selectPeriodRange(sample, 3, 4);
  const overlap = selectPeriodRange(sample, 1, 3);
  assert.equal(first.ok && different.ok && overlap.ok, true);
  if (!first.ok || !different.ok || !overlap.ok) return;
  assert.equal(comparePeriods(first.value, different.value).pointCountDifference, 1);
  assert.equal(overlap.value.startIndex, 1);
  assert.equal(overlap.value.endIndex, 3);
});

test('A/B 프리셋과 사용자 지정 범위를 차트 좌표로 변환한다', () => {
  assert.deepEqual(getRangeHighlightLayout(32, 0, 7), { x: 0, width: 25 });
  assert.deepEqual(getRangeHighlightLayout(32, 24, 31), { x: 75, width: 25 });
  assert.deepEqual(getRangeHighlightLayout(32, 8, 15), { x: 25, width: 25 });
});

test('겹치는 범위와 겹치지 않는 범위를 구분한다', () => {
  assert.deepEqual(getRangeOverlap(4, 11, 8, 15), { startIndex: 8, endIndex: 11, pointCount: 4 });
  assert.equal(getRangeOverlap(0, 7, 24, 31), null);
});

test('동일 범위는 전체 포인트가 겹친다', () => {
  assert.deepEqual(getRangeOverlap(2, 9, 2, 9), { startIndex: 2, endIndex: 9, pointCount: 8 });
});

test('전체 1~32 범위는 차트 폭을 정확히 채운다', () => {
  assert.deepEqual(getRangeHighlightLayout(32, 0, 31, 496, 10), { x: 0, width: 496 });
});

test('첫 1~2와 마지막 31~32 최소 범위는 보이는 폭을 유지한다', () => {
  const first = getRangeHighlightLayout(32, 0, 1, 100, 10);
  const last = getRangeHighlightLayout(32, 30, 31, 100, 10);
  assert.equal(first?.x, 0);
  assert.equal(first?.width, 10);
  assert.equal(last?.x, 90);
  assert.equal(last?.width, 10);
});

test('잘못된 범위 좌표는 생성하지 않는다', () => {
  assert.equal(getRangeHighlightLayout(32, 8, 7), null);
  assert.equal(getRangeHighlightLayout(32, -1, 2), null);
  assert.equal(getRangeHighlightLayout(32, 0, 32), null);
  assert.equal(getRangeHighlightLayout(1, 0, 0), null);
});

test('첫 포인트는 이전 비교값 없이 안전하게 반환한다', () => {
  const detail = getPointDetail(sample, 0, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  assert.equal(detail?.value, 100);
  assert.equal(detail?.previousValue, null);
  assert.equal(detail?.change, null);
  assert.equal(detail?.changeRate, null);
});

test('두 번째 포인트의 직전 변화액과 변화율을 계산한다', () => {
  const detail = getPointDetail(sample, 1, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  assert.equal(detail?.previousValue, 100);
  assert.equal(detail?.change, 20);
  assert.equal(detail?.changeRate, 20);
});

test('마지막 포인트를 정확히 조회한다', () => {
  const detail = getPointDetail(sample, 4, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  assert.equal(detail?.index, 4);
  assert.equal(detail?.value, 130);
});

test('A에만, B에만, 어느 범위에도 속하지 않는 포인트를 구분한다', () => {
  const aOnly = getPointDetail(sample, 0, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  const bOnly = getPointDetail(sample, 4, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  const neither = getPointDetail(sample, 2, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  assert.equal(aOnly?.inPeriodA && !aOnly.inPeriodB, true);
  assert.equal(bOnly?.inPeriodB && !bOnly.inPeriodA, true);
  assert.equal(!neither?.inPeriodA && !neither?.inPeriodB, true);
});

test('A/B 겹침 및 동일 범위 포함 여부를 계산한다', () => {
  const overlap = getPointDetail(sample, 2, { startIndex: 0, endIndex: 3 }, { startIndex: 2, endIndex: 4 });
  const same = getPointDetail(sample, 1, { startIndex: 0, endIndex: 2 }, { startIndex: 0, endIndex: 2 });
  assert.equal(overlap?.inOverlap, true);
  assert.equal(same?.inOverlap, true);
});

test('전체 범위에서는 모든 포인트가 A/B에 포함된다', () => {
  const detail = getPointDetail(sample, 3, { startIndex: 0, endIndex: 4 }, { startIndex: 0, endIndex: 4 });
  assert.equal(detail?.inPeriodA && detail.inPeriodB && detail.inOverlap, true);
});

test('A/B 범위 변경 후 같은 포인트의 포함 여부가 다시 계산된다', () => {
  const before = getPointDetail(sample, 2, { startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 4 });
  const after = getPointDetail(sample, 2, { startIndex: 1, endIndex: 3 }, { startIndex: 2, endIndex: 4 });
  assert.equal(before?.inPeriodA || before?.inPeriodB, false);
  assert.equal(after?.inPeriodA && after.inPeriodB, true);
});

test('잘못된 포인트 인덱스와 빈 데이터는 null을 반환한다', () => {
  const range = { startIndex: 0, endIndex: 1 };
  assert.equal(getPointDetail(sample, -1, range, range), null);
  assert.equal(getPointDetail(sample, 5, range, range), null);
  assert.equal(getPointDetail(sample, Number.NaN, range, range), null);
  assert.equal(getPointDetail(sample, undefined as unknown as number, range, range), null);
  assert.equal(getPointDetail([], 0, range, range), null);
});
