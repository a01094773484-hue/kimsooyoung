'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Printer } from 'lucide-react';
import { Footer, Header } from './investlab';
import { findSimulationPair, loadSimulations, type SavedSimulation } from '@/lib/simulation-storage';
import { createComparisonDifferences } from '@/lib/simulation-report';

const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const labels = { rise: '상승', fall: '하락', flat: '보합' } as const;

function ResultColumn({ item, label }: { item: SavedSimulation; label: string }) {
  const rows = [['자산', `${item.asset.name} (${item.asset.symbol})`], ['저장 시각', new Date(item.createdAt).toLocaleString('ko-KR')], ['투자금액', `${won.format(item.initialAmount)}원`], ['시나리오', `${labels[item.scenario]}${item.scenario === 'flat' ? '' : ` ${item.changeRate}%`}`], ['기준 가격', item.asset.price || '정보 없음'], ['평가금액', `${won.format(item.estimatedValue)}원`], ['손익', `${item.profitLoss > 0 ? '+' : ''}${won.format(item.profitLoss)}원`], ['수익률', `${item.returnRate > 0 ? '+' : ''}${item.returnRate}%`], ['연결 가설', item.hypothesis || '정보 없음']];
  return <article className="compare-record"><span className="compare-label">{label}</span><h2>{item.asset.name}</h2><dl>{rows.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl><Link href={`/simulation/result/${encodeURIComponent(item.id)}`} className="secondary-button">상세 결과 보기</Link></article>;
}

export default function SimulationCompare({ ids }: { ids: string[] }) {
  const [pair, setPair] = useState<[SavedSimulation, SavedSimulation] | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setPair(findSimulationPair(loadSimulations(), ids)); setReady(true); }, [ids]);
  if (!ready) return <><Header /><main className="simulation-page"><section className="container simulation-loading" role="status"><span />비교할 기록을 불러오는 중이에요.</section></main><Footer /></>;
  if (!pair) return <><Header /><main className="simulation-page"><section className="container simulation-empty"><strong>비교할 시뮬레이션 2건을 찾을 수 없습니다.</strong><p>기록이 삭제되었거나 올바르지 않은 비교 주소입니다.</p><div className="simulation-actions"><Link href="/simulation/history" className="primary-button">기록에서 다시 선택 <ArrowRight size={16} /></Link><Link href="/simulation/settings" className="secondary-button">시뮬레이션 시작</Link></div></section></main><Footer /></>;
  const [first, second] = pair;
  const differences = createComparisonDifferences(first, second);
  return <><Header /><main className="compare-page report-page"><section className="container history-heading"><span className="eyebrow">저장 결과 2개 비교</span><h1>교육용 시뮬레이션 비교</h1><p>저장된 조건과 계산값의 차이만 나란히 보여주며 투자 우열이나 추천을 의미하지 않습니다.</p><button type="button" className="primary-button print-button print-hidden" onClick={() => window.print()}><Printer size={16} /> 비교 리포트 인쇄</button></section><section className="container compare-differences" aria-label="계산값 차이">{differences.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section><section className="container compare-grid"><ResultColumn item={first} label="Record A" /><ResultColumn item={second} label="Record B" /></section><section className="container education-warning"><strong>교육용 비교 안내</strong><p>이 화면은 사용자가 저장한 가상 조건과 계산 결과의 차이를 보여줍니다. 실제 시장 가격, 미래 수익 또는 투자 추천을 의미하지 않습니다.</p><Link href="/simulation/history" className="secondary-button print-hidden">기록 목록으로 돌아가기</Link></section></main><Footer /></>;
}
