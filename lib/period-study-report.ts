import type { PeriodSnapshot, PeriodStudyRecord } from './period-study-storage';

const number = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const cleanZero = (value: number) => Object.is(value, -0) ? 0 : value;
const format = (value: number) => number.format(cleanZero(value));
const signed = (value: number, suffix = '') => `${cleanZero(value) > 0 ? '+' : ''}${format(value)}${suffix}`;

export type PeriodStudyReportSection = {
  label: 'Period A' | 'Period B';
  range: string;
  metrics: Array<[string, string]>;
};

export type PeriodStudyReportData = {
  title: string;
  asset: string;
  savedAt: string;
  hypothesis: string;
  reflection: string;
  summary: string;
  periodA: PeriodStudyReportSection;
  periodB: PeriodStudyReportSection;
  differences: Array<[string, string]>;
  educationalNotice: string;
  snapshotNotice: string;
};

function createPeriodSection(label: PeriodStudyReportSection['label'], snapshot: PeriodSnapshot): PeriodStudyReportSection {
  return {
    label,
    range: `포인트 ${snapshot.startIndex + 1} ~ ${snapshot.endIndex + 1}`,
    metrics: [
      ['시작 예시 가격', format(snapshot.startPrice)],
      ['종료 예시 가격', format(snapshot.endPrice)],
      ['변화액', signed(snapshot.priceChange)],
      ['변화율', signed(snapshot.changeRate, '%')],
      ['최고 예시 가격', format(snapshot.highestPrice)],
      ['최저 예시 가격', format(snapshot.lowestPrice)],
      ['변동폭', format(snapshot.range)],
      ['데이터 포인트 수', `${snapshot.pointCount}개`],
    ],
  };
}

export function createPeriodStudyReportData(record: PeriodStudyRecord): PeriodStudyReportData {
  return {
    title: '기간 비교 학습 리포트',
    asset: `${record.assetName} (${record.assetSymbol})`,
    savedAt: new Date(record.createdAt).toLocaleString('ko-KR'),
    hypothesis: record.hypothesis.trim() || '가설 없음',
    reflection: record.reflection.trim() || '작성된 학습 메모가 없습니다.',
    summary: `Period A 변화율은 ${signed(record.analysisA.changeRate, '%')}, Period B는 ${signed(record.analysisB.changeRate, '%')}이며 두 구간의 변화율 차이는 ${format(record.differences.changeRateDifference)}%p입니다.`,
    periodA: createPeriodSection('Period A', record.analysisA),
    periodB: createPeriodSection('Period B', record.analysisB),
    differences: [
      ['변화액 차이', format(record.differences.priceChangeDifference)],
      ['변화율 차이', `${format(record.differences.changeRateDifference)}%p`],
      ['최고값 차이', format(record.differences.highestPriceDifference)],
      ['최저값 차이', format(record.differences.lowestPriceDifference)],
      ['변동폭 차이', format(record.differences.rangeDifference)],
      ['포인트 수 차이', `${format(record.differences.pointCountDifference)}개`],
    ],
    educationalNotice: '이 리포트는 교육용 예시 데이터를 이용한 구간 비교 학습 결과입니다. 실제 과거 시세, 미래 시장 전망 또는 투자 추천을 의미하지 않습니다.',
    snapshotNotice: '이 리포트는 저장 당시의 계산 Snapshot을 사용합니다.',
  };
}
