'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Search, Trash2 } from 'lucide-react';
import { Footer, Header } from './investlab';
import { deleteSimulation, filterAndSortSimulations, loadSimulations, type SavedSimulation, type SimulationAssetFilter, type SimulationScenarioFilter, type SimulationSort } from '@/lib/simulation-storage';

const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const scenarioLabels = { rise: '상승', fall: '하락', flat: '보합' } as const;

export default function SimulationHistory() {
  const [items, setItems] = useState<SavedSimulation[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [scenario, setScenario] = useState<SimulationScenarioFilter>('all');
  const [category, setCategory] = useState<SimulationAssetFilter>('all');
  const [sort, setSort] = useState<SimulationSort>('newest');
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setItems(loadSimulations()); setReady(true); }, []);
  const visible = useMemo(() => filterAndSortSimulations(items, query, scenario, sort, category), [items, query, scenario, sort, category]);
  const toggleSelected = (id: string) => {
    setNotice('');
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) { setNotice('비교할 기록은 최대 2개까지 선택할 수 있어요.'); return current; }
      return [...current, id];
    });
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    try {
      const next = deleteSimulation(pendingDelete);
      setItems(next);
      setSelected((current) => current.filter((id) => id !== pendingDelete));
      setPendingDelete(null);
      setNotice('시뮬레이션 기록을 삭제했습니다.');
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '기록을 삭제하지 못했어요.'); }
  };
  const compareHref = selected.length === 2 ? `/simulation/compare?ids=${selected.map(encodeURIComponent).join(',')}` : '#';

  return <><Header /><main className="history-page"><section className="container history-heading"><span className="eyebrow">교육용 시뮬레이션 기록</span><h1>전체 시뮬레이션 기록</h1><p>저장된 조건과 결과를 다시 보거나 두 기록의 차이를 비교하세요.</p></section><section className="container history-toolbar" aria-label="기록 검색 및 필터"><label className="history-search"><Search size={17} aria-hidden="true" /><span className="sr-only">자산 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="자산명 또는 Symbol 검색" /></label><label><span>시나리오</span><select value={scenario} onChange={(event) => setScenario(event.target.value as SimulationScenarioFilter)}><option value="all">전체</option><option value="rise">상승</option><option value="fall">하락</option><option value="flat">보합</option></select></label><label><span>자산 유형</span><select value={category} onChange={(event) => setCategory(event.target.value as SimulationAssetFilter)}><option value="all">전체</option><option value="stock">주식</option><option value="crypto">가상자산</option></select></label><label><span>정렬</span><select value={sort} onChange={(event) => setSort(event.target.value as SimulationSort)}><option value="newest">최신순</option><option value="oldest">오래된순</option><option value="amount-desc">투자금액 높은순</option><option value="amount-asc">투자금액 낮은순</option></select></label><Link href={compareHref} aria-disabled={selected.length !== 2} className={`primary-button history-compare${selected.length !== 2 ? ' disabled' : ''}`} onClick={(event) => { if (selected.length !== 2) event.preventDefault(); }}>선택 결과 비교 ({selected.length}/2)</Link></section>{notice && <p className="container storage-notice" role="status">{notice}</p>}{error && <p className="container storage-error" role="alert">{error}</p>}{pendingDelete && <section className="container delete-confirm" role="alertdialog" aria-labelledby="delete-title"><p id="delete-title">이 시뮬레이션 기록을 삭제하시겠습니까?</p><div><button type="button" className="secondary-button" onClick={() => setPendingDelete(null)}>취소</button><button type="button" className="danger-confirm" onClick={confirmDelete}>삭제</button></div></section>}<section className="container history-content">{!ready ? <div className="saved-loading" role="status"><span />기록을 불러오는 중이에요.</div> : items.length === 0 ? <div className="saved-empty"><BarChart3 size={28} /><strong>저장된 시뮬레이션이 없습니다.</strong><p>교육용 시뮬레이션을 실행하고 결과를 저장해보세요.</p><Link href="/simulation/settings" className="primary-button">시뮬레이션 시작 <ArrowRight size={15} /></Link></div> : visible.length === 0 ? <div className="saved-empty"><strong>검색 조건에 맞는 기록이 없습니다.</strong><p>검색어나 필터를 바꿔보세요.</p></div> : <div className="history-list">{visible.map((item) => { const checked = selected.includes(item.id); return <article key={item.id} className={checked ? 'selected' : ''}><div className="history-card-head"><label><input type="checkbox" checked={checked} onChange={() => toggleSelected(item.id)} aria-label={`${item.asset.name} 비교 선택`} /><span>비교 선택</span></label><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('ko-KR')}</time></div><div className="history-asset"><span className="asset-icon" style={{ background: item.asset.color }}>{item.asset.icon}</span><div><h2>{item.asset.name}</h2><p>{item.asset.symbol}</p></div></div><dl className="history-values"><div><dt>투자금액</dt><dd>{won.format(item.initialAmount)}원</dd></div><div><dt>시나리오</dt><dd>{scenarioLabels[item.scenario]} {item.scenario !== 'flat' ? `${item.changeRate}%` : ''}</dd></div><div><dt>가상 손익</dt><dd>{item.profitLoss > 0 ? '+' : ''}{won.format(item.profitLoss)}원</dd></div><div><dt>가상 수익률</dt><dd>{item.returnRate > 0 ? '+' : ''}{item.returnRate}%</dd></div></dl><div className="history-card-actions"><Link href={`/simulation/result/${encodeURIComponent(item.id)}`} className="secondary-button">결과 보기</Link><button type="button" className="secondary-button danger" onClick={() => setPendingDelete(item.id)}><Trash2 size={15} /> 삭제</button></div></article>; })}</div>}</section></main><Footer /></>;
}
