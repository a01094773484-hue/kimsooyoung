'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, ClipboardList, Search, Sparkles } from 'lucide-react';
import { Footer, Header } from '@/components/investlab';
import { loadUserDataState, type SavedHypothesis } from '@/lib/investlab-storage';
import { assets } from '@/lib/mock-data';

const periodLabels = { '1m': '1개월', '3m': '3개월', '6m': '6개월', '1y': '1년' } as const;

function hypothesisHref(item: SavedHypothesis) {
  const params = new URLSearchParams({
    asset: item.selectedSymbol,
    statement: item.statement,
    direction: item.direction,
    target: item.targetChange,
    period: item.period,
  });
  return `/hypothesis?${params.toString()}`;
}

export default function InvestLabDashboard() {
  const [items, setItems] = useState<SavedHypothesis[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    const result = loadUserDataState();
    setItems(result.data.hypotheses);
    setHasDraft(Boolean(result.data.draft?.statement.trim()));
    setError(result.error ?? '');
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const syncStorage = () => refresh();
    window.addEventListener('storage', syncStorage);
    window.addEventListener('focus', syncStorage);
    return () => {
      window.removeEventListener('storage', syncStorage);
      window.removeEventListener('focus', syncStorage);
    };
  }, [refresh]);

  const stats = useMemo(() => {
    const uniqueAssets = new Set(items.map((item) => item.selectedSymbol)).size;
    const rising = items.filter((item) => item.direction === 'rise').length;
    return { total: items.length, uniqueAssets, rising, falling: items.length - rising };
  }, [items]);

  const cards = [
    { label: '저장한 검증 계획', value: stats.total, note: '저장된 전체 가설', href: '#recent-activity', icon: ClipboardList },
    { label: '시험한 자산', value: stats.uniqueAssets, note: '중복을 제외한 자산 수', href: '/assets', icon: BarChart3 },
    { label: '상승 가설', value: stats.rising, note: '상승을 예상한 계획', href: '#recent-activity', icon: ArrowUpRight },
    { label: '하락 가설', value: stats.falling, note: '하락을 예상한 계획', href: '#recent-activity', icon: ArrowDownRight },
  ];

  return (
    <>
      <Header />
      <main className="dashboard-page">
        <section className="container dashboard-heading">
          <div>
            <span className="eyebrow">내 투자 학습 현황</span>
            <h1>내 기록 대시보드</h1>
            <p>저장한 투자 가설과 학습 현황을 확인하고 다음 작업을 시작하세요.</p>
          </div>
          {hasDraft && <Link href="/hypothesis" className="draft-resume">작성 중인 초안이 있어요 <ArrowRight size={15} /></Link>}
        </section>

        {loading ? (
          <section className="container dashboard-loading" role="status"><span aria-hidden="true" />대시보드 데이터를 불러오는 중이에요.</section>
        ) : error ? (
          <section className="container dashboard-error" role="alert"><strong>기록을 불러오지 못했어요.</strong><p>{error}</p><button type="button" className="secondary-button" onClick={refresh}>다시 시도</button></section>
        ) : (
          <>
            <section className="container dashboard-stats" aria-label="투자 가설 통계">
              {cards.map(({ label, value, note, href, icon: Icon }) => (
                <Link key={label} href={href} className="dashboard-stat-card">
                  <span className="dashboard-stat-icon"><Icon size={19} /></span>
                  <span>{label}</span>
                  <strong>{value}<small>건</small></strong>
                  <p>{note}</p>
                </Link>
              ))}
            </section>

            <section className="container dashboard-grid">
              <div id="recent-activity" className="dashboard-panel">
                <div className="dashboard-panel-heading"><div><span className="eyebrow">최근 활동</span><h2>최근 저장한 검증 계획</h2></div><Link href="/hypothesis" className="text-link">전체 관리 <ArrowRight size={14} /></Link></div>
                {items.length === 0 ? (
                  <div className="dashboard-empty"><ClipboardList size={24} /><strong>아직 저장한 기록이 없어요.</strong><p>첫 투자 가설을 만들고 검증 계획을 저장해보세요.</p><Link href="/hypothesis" className="primary-button">가설 작성하기 <ArrowRight size={15} /></Link></div>
                ) : (
                  <div className="dashboard-activity-list">
                    {items.slice(0, 5).map((item) => {
                      const asset = assets.find((candidate) => candidate.symbol === item.selectedSymbol);
                      return <Link key={item.id} href={hypothesisHref(item)} className="dashboard-activity-item"><span className="asset-icon" style={{ background: asset?.color }}>{asset?.icon ?? item.selectedSymbol.slice(0, 1)}</span><div><strong>{asset?.name ?? item.selectedSymbol}</strong><p>{item.statement}</p><small>{item.direction === 'rise' ? '상승' : '하락'} · {periodLabels[item.period]} · {item.targetChange}% 기준</small></div><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString('ko-KR')}</time><ArrowRight size={16} aria-hidden="true" /></Link>;
                    })}
                  </div>
                )}
              </div>

              <aside className="dashboard-panel dashboard-quick-actions">
                <div className="dashboard-panel-heading"><div><span className="eyebrow">빠른 실행</span><h2>다음 작업 시작</h2></div></div>
                <Link href="/hypothesis"><Sparkles size={19} /><span><strong>새 투자 가설</strong><small>아이디어를 검증 계획으로 만들기</small></span><ArrowRight size={16} /></Link>
                <Link href="/#asset-discovery"><Search size={19} /><span><strong>자산 탐색</strong><small>주식과 가상자산 찾아보기</small></span><ArrowRight size={16} /></Link>
                <Link href="/simulation/result"><BarChart3 size={19} /><span><strong>결과 화면</strong><small>시뮬레이션 결과 화면으로 이동</small></span><ArrowRight size={16} /></Link>
              </aside>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
