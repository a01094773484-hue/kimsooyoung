'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Printer, Save } from 'lucide-react';
import { Footer, Header } from './investlab';
import SimulationPrintReport from './simulation-print-report';
import type { SimulationResult as Result } from '@/lib/simulation-engine';
import { loadCurrentSimulation, loadSimulationById, saveSimulation, type SavedSimulation } from '@/lib/simulation-storage';

const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const scenarioLabel = (value: Result['scenario']) => value === 'rise' ? '상승' : value === 'fall' ? '하락' : '보합';

export default function SimulationResult({ savedId }: { savedId?: string }) {
  const [result, setResult] = useState<Result | SavedSimulation | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setResult(savedId ? loadSimulationById(savedId) : loadCurrentSimulation()); setReady(true); }, [savedId]);
  const persist = () => { if (!result) return; try { saveSimulation(result); setNotice('시뮬레이션 결과를 내 기록에 저장했어요.'); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : '결과를 저장하지 못했어요.'); } };
  if (!ready) return <><Header /><main className="simulation-page"><section className="container simulation-loading" role="status"><span />계산 결과를 불러오는 중이에요.</section></main><Footer /></>;
  if (!result) return <><Header /><main className="simulation-page"><section className="container simulation-empty"><strong>{savedId ? '저장된 시뮬레이션 결과를 찾을 수 없습니다.' : '아직 실행된 시뮬레이션이 없습니다.'}</strong><p>{savedId ? '기록이 삭제되었거나 올바르지 않은 주소입니다.' : '교육용 조건을 입력해 첫 시뮬레이션을 실행해보세요.'}</p><div className="simulation-actions"><Link href="/simulation/settings" className="primary-button">시뮬레이션 시작 <ArrowRight size={16} /></Link>{savedId && <Link href="/mypage" className="secondary-button">Dashboard로 이동</Link>}</div></section></main><Footer /></>;
  const positive = result.profitLoss >= 0;
  const rerunParams = new URLSearchParams({ asset: result.asset.symbol, amount: String(result.initialAmount), direction: result.scenario === 'flat' ? 'flat' : result.scenario, target: String(result.changeRate) });
  if (result.hypothesis) rerunParams.set('hypothesis', result.hypothesis);
  return <><Header /><main className="simulation-page report-page"><section className="container simulation-heading"><span className="eyebrow">{savedId ? '저장된 교육용 기록' : 'STEP 04 · 계산 완료'}</span><h1>{result.asset.name} 교육용 시뮬레이션 결과</h1><p>{savedId ? '저장 당시 입력 조건과 계산 결과입니다.' : '입력한 가상 조건으로 계산된 결과입니다.'}</p></section><section className="container simulation-result-card"><div className="result-status"><CheckCircle2 size={20} /> {savedId ? '저장된 결과를 불러왔습니다.' : '계산이 완료되었습니다.'}</div><div className="simulation-result-grid"><div><span>자산</span><strong>{result.asset.name} ({result.asset.symbol})</strong></div><div><span>가상 투자금</span><strong>{won.format(result.initialAmount)}원</strong></div><div><span>기준 가격</span><strong>{result.asset.price}</strong></div><div><span>적용 시나리오</span><strong>{scenarioLabel(result.scenario)} {result.scenario !== 'flat' && `${result.changeRate}%`}</strong></div><div><span>가상 평가금액</span><strong>{won.format(result.estimatedValue)}원</strong></div><div><span>가상 손익</span><strong className={positive ? 'result-positive' : 'result-negative'}>{positive ? '+' : ''}{won.format(result.profitLoss)}원</strong></div><div><span>가상 수익률</span><strong className={positive ? 'result-positive' : 'result-negative'}>{result.returnRate > 0 ? '+' : ''}{result.returnRate}%</strong></div></div><div className="simulation-hypothesis"><span>연결한 투자 가설</span><p>{result.hypothesis || '정보 없음'}</p></div><p className="calculated-at">{savedId && '저장 시각: '}{new Date('createdAt' in result ? result.createdAt : result.calculatedAt).toLocaleString('ko-KR')}</p><div className="education-warning"><strong>교육용 가상 시뮬레이션 결과</strong><p>이 결과는 실제 시장 가격이나 투자 수익을 의미하지 않으며 투자 행동을 추천하지 않습니다.</p></div>{notice && <p className="storage-notice" role="status">{notice}</p>}{error && <p className="storage-error" role="alert">{error}</p>}<div className="simulation-actions print-hidden">{!savedId && <button type="button" className="primary-button" onClick={persist}><Save size={16} /> 결과 저장</button>}{savedId && <button type="button" className="primary-button" onClick={() => window.print()}><Printer size={16} /> 인쇄 / PDF 저장</button>}<Link href="/simulation/settings" className="primary-button">새 시뮬레이션</Link><Link href={`/simulation/settings?${rerunParams.toString()}`} className="secondary-button">이 조건으로 다시 실행</Link><Link href="/mypage" className="secondary-button">내 기록 보기</Link></div></section>{savedId && 'createdAt' in result && <SimulationPrintReport record={result} />}</main><Footer /></>;
}
