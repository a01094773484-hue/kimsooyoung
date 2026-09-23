import type { HypothesisDraft } from '@/lib/investlab-storage';

const periodLabels = { '1m': '1개월', '3m': '3개월', '6m': '6개월', '1y': '1년' } as const;

export function createHypothesisShareContent(draft: HypothesisDraft, assetName: string, origin: string) {
  const direction = draft.direction === 'rise' ? '상승' : '하락';
  const sign = draft.direction === 'rise' ? '+' : '-';
  const params = new URLSearchParams({
    asset: draft.selectedSymbol,
    statement: draft.statement.trim(),
    direction: draft.direction,
    target: draft.targetChange,
    period: draft.period,
  });
  const path = `/hypothesis?${params.toString()}`;
  const url = `${origin}${path}`;
  const text = [
    '[InvestLab 투자 가설]',
    `${assetName}: ${draft.statement.trim()}`,
    `${periodLabels[draft.period]} · ${direction} · 목표 ${sign}${draft.targetChange}%`,
  ].join('\n');
  return { title: `${assetName} 투자 가설 | InvestLab`, text, url, combined: `${text}\n${url}` };
}
