import type { SavedSimulation } from './simulation-storage';

const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const scenarioLabels = { rise: '상승', fall: '하락', flat: '보합' } as const;

export type SimulationReportData = {
  title: string;
  asset: string;
  savedAt: string;
  hypothesis: string;
  conditions: Array<[string, string]>;
  results: Array<[string, string]>;
};

export function createSimulationReportData(record: SavedSimulation): SimulationReportData {
  return {
    title: 'InvestLab 교육용 시뮬레이션 리포트',
    asset: `${record.asset.name} (${record.asset.symbol})`,
    savedAt: new Date(record.createdAt).toLocaleString('ko-KR'),
    hypothesis: record.hypothesis?.trim() || '정보 없음',
    conditions: [
      ['투자금액', `${won.format(record.initialAmount)}원`],
      ['시나리오', `${scenarioLabels[record.scenario]}${record.scenario === 'flat' ? '' : ` ${record.changeRate}%`}`],
      ['변동률', `${record.returnRate > 0 ? '+' : ''}${record.returnRate}%`],
      ['기준 가격', record.asset.price || '정보 없음'],
    ],
    results: [
      ['가상 평가금액', `${won.format(record.estimatedValue)}원`],
      ['가상 손익', `${record.profitLoss > 0 ? '+' : ''}${won.format(record.profitLoss)}원`],
      ['가상 수익률', `${record.returnRate > 0 ? '+' : ''}${record.returnRate}%`],
    ],
  };
}

export function createComparisonDifferences(first: SavedSimulation, second: SavedSimulation) {
  return [
    ['투자금액 차이', `${won.format(Math.abs(first.initialAmount - second.initialAmount))}원`],
    ['변동률 차이', `${Math.abs(first.changeRate - second.changeRate)}%p`],
    ['평가금액 차이', `${won.format(Math.abs(first.estimatedValue - second.estimatedValue))}원`],
    ['손익 차이', `${won.format(Math.abs(first.profitLoss - second.profitLoss))}원`],
    ['수익률 차이', `${Math.abs(first.returnRate - second.returnRate)}%p`],
  ] as Array<[string, string]>;
}
