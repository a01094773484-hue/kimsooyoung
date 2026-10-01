export type PeriodAnalysis = {
  startIndex: number;
  endIndex: number;
  startPrice: number;
  endPrice: number;
  priceChange: number;
  changeRate: number;
  highestPrice: number;
  lowestPrice: number;
  range: number;
  pointCount: number;
  points: number[];
};

export type PeriodAnalysisResult =
  | { ok: true; value: PeriodAnalysis }
  | { ok: false; error: string };

export type RangeHighlightLayout = { x: number; width: number };

export type PointDetail = {
  index: number;
  value: number;
  previousValue: number | null;
  change: number | null;
  changeRate: number | null;
  inPeriodA: boolean;
  inPeriodB: boolean;
  inOverlap: boolean;
};

export function getPointDetail(points: readonly number[], pointIndex: number, periodA: { startIndex: number; endIndex: number }, periodB: { startIndex: number; endIndex: number }): PointDetail | null {
  if (points.length === 0 || !Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= points.length) return null;
  const value = points[pointIndex];
  if (!Number.isFinite(value)) return null;
  const previousValue = pointIndex === 0 ? null : points[pointIndex - 1];
  if (previousValue !== null && !Number.isFinite(previousValue)) return null;
  const change = previousValue === null ? null : value - previousValue;
  const changeRate = previousValue === null ? null : previousValue === 0 ? 0 : (change! / previousValue) * 100;
  const inPeriodA = pointIndex >= periodA.startIndex && pointIndex <= periodA.endIndex;
  const inPeriodB = pointIndex >= periodB.startIndex && pointIndex <= periodB.endIndex;
  return { index: pointIndex, value, previousValue, change, changeRate, inPeriodA, inPeriodB, inOverlap: inPeriodA && inPeriodB };
}

export function getRangeHighlightLayout(totalPoints: number, startIndex: number, endIndex: number, chartWidth = 100, minimumWidth = 3): RangeHighlightLayout | null {
  if (!Number.isInteger(totalPoints) || totalPoints < 2 || !Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return null;
  if (startIndex < 0 || endIndex >= totalPoints || startIndex > endIndex || chartWidth <= 0) return null;
  const unit = chartWidth / totalPoints;
  const naturalX = startIndex * unit;
  const naturalWidth = (endIndex - startIndex + 1) * unit;
  const width = Math.min(chartWidth, Math.max(naturalWidth, minimumWidth));
  return { x: Math.max(0, Math.min(naturalX - (width - naturalWidth) / 2, chartWidth - width)), width };
}

export function getRangeOverlap(firstStart: number, firstEnd: number, secondStart: number, secondEnd: number) {
  if (![firstStart, firstEnd, secondStart, secondEnd].every(Number.isInteger)) return null;
  if (firstStart < 0 || secondStart < 0 || firstStart > firstEnd || secondStart > secondEnd) return null;
  const startIndex = Math.max(firstStart, secondStart);
  const endIndex = Math.min(firstEnd, secondEnd);
  return startIndex <= endIndex ? { startIndex, endIndex, pointCount: endIndex - startIndex + 1 } : null;
}

export function selectPeriodRange(
  points: readonly number[],
  startIndex: number,
  endIndex: number
): PeriodAnalysisResult {
  const result = analyzePeriod(points, startIndex, endIndex);
  if (!result.ok) return result;
  if (result.value.pointCount < 2) {
    return { ok: false, error: '변화 비교에는 2개 이상의 데이터 포인트가 필요합니다.' };
  }
  return result;
}

export function analyzePeriod(
  points: readonly number[],
  startIndex: number,
  endIndex: number
): PeriodAnalysisResult {
  if (points.length === 0) {
    return { ok: false, error: '분석할 예시 데이터가 없습니다.' };
  }
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) {
    return { ok: false, error: '포인트 범위가 올바르지 않습니다.' };
  }
  if (startIndex < 0 || endIndex >= points.length) {
    return { ok: false, error: '선택 범위가 예시 데이터 범위를 벗어났습니다.' };
  }
  if (startIndex > endIndex) {
    return { ok: false, error: '시작 포인트는 종료 포인트보다 앞서야 합니다.' };
  }

  const selected = points.slice(startIndex, endIndex + 1);
  if (selected.some((point) => !Number.isFinite(point))) {
    return { ok: false, error: '예시 데이터에 올바르지 않은 값이 있습니다.' };
  }

  const startPrice = selected[0];
  const endPrice = selected[selected.length - 1];
  const priceChange = endPrice - startPrice;
  const changeRate = startPrice === 0 ? 0 : (priceChange / startPrice) * 100;
  const highestPrice = Math.max(...selected);
  const lowestPrice = Math.min(...selected);

  return {
    ok: true,
    value: {
      startIndex,
      endIndex,
      startPrice,
      endPrice,
      priceChange,
      changeRate,
      highestPrice,
      lowestPrice,
      range: highestPrice - lowestPrice,
      pointCount: selected.length,
      points: selected,
    },
  };
}

export function comparePeriods(first: PeriodAnalysis, second: PeriodAnalysis) {
  return {
    priceChangeDifference: Math.abs(first.priceChange - second.priceChange),
    changeRateDifference: Math.abs(first.changeRate - second.changeRate),
    highestPriceDifference: Math.abs(first.highestPrice - second.highestPrice),
    lowestPriceDifference: Math.abs(first.lowestPrice - second.lowestPrice),
    rangeDifference: Math.abs(first.range - second.range),
    pointCountDifference: Math.abs(first.pointCount - second.pointCount),
  };
}
