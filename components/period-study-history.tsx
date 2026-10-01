'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search, Trash2 } from 'lucide-react';
import { Footer, Header } from './investlab';
import { deletePeriodStudy, filterAndSortPeriodStudies, loadPeriodStudies, PERIOD_STUDY_CHANGED_EVENT, type PeriodStudyRecord, type PeriodStudySort } from '@/lib/period-study-storage';

const formatRate = (value: number) => `${value > 0 ? '+' : ''}${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(Object.is(value, -0) ? 0 : value)}%`;

export default function PeriodStudyHistory() {
  const [items, setItems] = useState<PeriodStudyRecord[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PeriodStudySort>('newest');
  const [ready, setReady] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const refresh = () => { setItems(loadPeriodStudies()); setReady(true); };
  useEffect(() => { refresh(); window.addEventListener('storage', refresh); window.addEventListener(PERIOD_STUDY_CHANGED_EVENT, refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener(PERIOD_STUDY_CHANGED_EVENT, refresh); }; }, []);
  const visible = useMemo(() => filterAndSortPeriodStudies(items, query, sort), [items, query, sort]);
  const confirmDelete = () => { if (!pendingDelete) return; try { setItems(deletePeriodStudy(pendingDelete)); setPendingDelete(null); setNotice('학습 기록을 삭제했습니다.'); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : '학습 기록을 삭제하지 못했어요.'); } };
  return <><Header /><main className="history-page study-page"><section className="container history-heading"><span className="eyebrow">교육용 기간 비교 학습</span><h1>기간 비교 학습 기록</h1><p>저장 당시의 구간과 계산 결과, 학습 가설과 메모를 다시 확인하세요.</p></section><section className="container study-toolbar" aria-label="학습 기록 검색 및 정렬"><label className="history-search"><Search size={17} aria-hidden="true" /><span className="sr-only">학습 기록 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="자산, 가설 또는 학습 메모 검색" /></label><label><span>정렬</span><select value={sort} onChange={(event) => setSort(event.target.value as PeriodStudySort)}><option value="newest">최신순</option><option value="oldest">오래된순</option></select></label></section>{notice && <p className="container storage-notice" role="status">{notice}</p>}{error && <p className="container storage-error" role="alert">{error}</p>}{pendingDelete && <section className="container delete-confirm" role="alertdialog" aria-labelledby="study-delete-title"><p id="study-delete-title">이 학습 기록을 삭제하시겠습니까?</p><div><button type="button" className="secondary-button" onClick={() => setPendingDelete(null)}>취소</button><button type="button" className="danger-confirm" onClick={confirmDelete}>삭제</button></div></section>}<section className="container history-content">{!ready ? <div className="saved-loading" role="status"><span />학습 기록을 불러오는 중이에요.</div> : items.length === 0 ? <div className="saved-empty"><BookOpen size={28} /><strong>아직 저장한 기간 비교 학습 기록이 없습니다.</strong><p>교육용 예시 구간을 비교하고 첫 학습 기록을 남겨보세요.</p><Link href="/assets/TSLA" className="primary-button">기간 비교 시작 <ArrowRight size={15} /></Link></div> : visible.length === 0 ? <div className="saved-empty"><strong>검색 조건에 맞는 학습 기록이 없습니다.</strong><p>검색어를 바꿔보세요.</p></div> : <div className="history-list study-list">{visible.map((item) => <article key={item.id}><div className="history-card-head"><span>{item.assetName} · {item.assetSymbol}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('ko-KR')}</time></div><h2>{item.hypothesis || '가설 없음'}</h2><p className="study-card-reflection">{item.reflection || '학습 메모 없음'}</p><dl className="history-values"><div><dt>Period A</dt><dd>포인트 {item.periodA.startIndex + 1}~{item.periodA.endIndex + 1}</dd></div><div><dt>A 변화율</dt><dd>{formatRate(item.analysisA.changeRate)}</dd></div><div><dt>Period B</dt><dd>포인트 {item.periodB.startIndex + 1}~{item.periodB.endIndex + 1}</dd></div><div><dt>B 변화율</dt><dd>{formatRate(item.analysisB.changeRate)}</dd></div></dl><div className="history-card-actions"><Link href={`/studies/${encodeURIComponent(item.id)}`} className="secondary-button">상세 보기</Link><button type="button" className="secondary-button danger" onClick={() => setPendingDelete(item.id)}><Trash2 size={15} /> 삭제</button></div></article>)}</div>}</section></main><Footer /></>;
}
