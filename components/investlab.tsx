'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BarChart3, Bot, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Database, Menu, Search, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { assets, chartPoints, hypotheses, popularSymbols, type Asset, type AssetCategory } from '@/lib/mock-data';
import { APP_ACTION_EVENT, APP_ACTION_STORAGE_KEY, type AppAction } from '@/lib/chat-actions';

const navItems = [['서비스 소개', '/about'], ['투자해보기', '/simulation'], ['학습 콘텐츠', '/learn'], ['요금제', '/pricing'], ['내 기록', '/mypage']];

function Logo() {
  return <Link href="/" className="logo" aria-label="InvestLab 메인으로"><span className="logo-mark"><BarChart3 size={19} strokeWidth={3} /></span><strong>InvestLab</strong><span className="logo-tag">가설이 데이터로 더 나은 투자 경험</span></Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="container header-inner"><Logo /><nav className="desktop-nav">{navItems.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><div className="header-actions"><Link href="/assets" className="header-search" aria-label="자산 검색"><Search size={17} /></Link><span className="header-divider" /><Link href="/login" className="login-link">로그인</Link><Link href="/signup" className="signup-button">회원가입</Link><button type="button" className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={22} /> : <Menu size={22} />}</button></div></div>{open && <nav id="mobile-navigation" className="mobile-nav" aria-label="모바일 주요 메뉴">{navItems.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/login" onClick={() => setOpen(false)}>로그인</Link><Link href="/signup" onClick={() => setOpen(false)} className="mobile-signup">회원가입</Link></nav>}</header>;
}

export function Footer() {
  return <footer className="footer"><div className="container footer-main"><div><Logo /><p>데이터로 배우는 더 나은 투자 경험</p></div><div className="footer-links"><Link href="/about">서비스 소개</Link><Link href="/mypage">내 기록</Link><Link href="/subscription">구독 관리</Link><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/contact">고객센터</Link></div></div><div className="container footer-bottom"><span>© 2024 InvestLab. All rights reserved.</span><span>본 서비스의 시뮬레이션 결과는 과거 데이터를 기반으로 하며 실제 투자 결과를 보장하지 않습니다.</span></div></footer>;
}

function Sparkline({ positive = true }: { positive?: boolean }) {
  return <svg className={`sparkline ${positive ? '' : 'sparkline-down'}`} viewBox="0 0 110 30" preserveAspectRatio="none" aria-hidden="true"><path d={positive ? 'M0 23 L8 21 L16 24 L25 16 L33 18 L43 10 L50 15 L59 7 L67 12 L77 4 L84 10 L94 2 L101 8 L110 1' : 'M0 7 L8 9 L16 6 L25 14 L33 12 L43 19 L50 15 L59 23 L67 18 L77 26 L84 21 L94 28 L101 22 L110 29'} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>;
}

function AssetIcon({ asset }: { asset: Asset }) { return <span className="asset-icon" style={{ background: asset.color }}>{asset.icon}</span>; }

function SearchAsset({ value, onChange, onStart, error, errorId, compact = false }: { value: string; onChange: (value: string) => void; onStart: () => void; error?: string; errorId: string; compact?: boolean }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart();
  };
  return <form className={`search-asset ${compact ? 'compact-search' : ''}`} onSubmit={submit} noValidate><div className="search-input-wrap"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="종목명 또는 코드를 검색하세요" aria-label="투자 자산 검색" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} /></div><button type="submit" className="primary-button">가상투자 시작하기 <ArrowRight size={16} /></button>{error && <p id={errorId} className="search-validation-error" role="alert">{error}</p>}</form>;
}

function AssetPreview({ asset, onStart }: { asset: Asset; onStart: () => void }) {
  const path = chartPoints.map((point, index) => `${index * 12},${125 - (point - 28) * 0.9}`).join(' L');
  return <div className="preview-wrap"><div className="preview-card"><div className="preview-header"><div className="preview-title"><AssetIcon asset={asset} /><div><strong>{asset.name}</strong><span>{asset.symbol}</span></div></div><span className="preview-period">최근 1개월 <ChevronDown size={14} /></span></div><div className="preview-price"><strong>{asset.price}</strong><span className={asset.positive ? 'up' : 'down'}>{asset.positive ? '▲' : '▼'} {asset.change}</span></div><div className="chart-tabs"><span>1일</span><span>1주</span><span className="active">1개월</span><span>3개월</span><span>1년</span><span>5년</span></div><svg className="preview-chart" viewBox="0 0 372 130" preserveAspectRatio="none"><path d={`M${path}`} fill="none" stroke="#ff515c" strokeWidth="2.5" strokeLinecap="round" /><path d={`M${path} L372 130 L0 130 Z`} fill="url(#previewFill)" opacity=".3" /><defs><linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff8e96" /><stop offset="1" stopColor="#fff" /></linearGradient></defs></svg><div className="preview-stats"><div><span>전일 대비</span><strong className="up">+12.36 USD</strong></div><div><span>거래량</span><strong>123,456,789</strong></div></div><button className="preview-button" onClick={onStart}><Zap size={14} /> 이 종목으로 가상투자 시작하기</button></div><div className="assistant-bubbles"><p>과거의 데이터가<br /><strong>더 나은 결정을 만듭니다.</strong></p><span>내 투자 가설은 맞을까?</span><span>언제 사고, 언제 팔았다면?</span><span>어떤 위험이 있었을까?</span><span>AI가 결과를 해석해줘요.</span></div></div>;
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>; }

function AssetCard({ asset, onSimulate }: { asset: Asset; onSimulate: (symbol: string) => void }) {
  return <div className="asset-card"><Link href={`/assets/${asset.symbol}`} className="asset-card-link"><div className="asset-card-top"><AssetIcon asset={asset} /><div><strong>{asset.name}</strong><span>{asset.symbol}</span></div></div><div className="asset-value">{asset.price}</div><div className={asset.positive ? 'asset-change up' : 'asset-change down'}>{asset.positive ? '▲' : '▼'} {asset.change}</div><Sparkline positive={asset.positive} /></Link><button className="secondary-button" onClick={() => onSimulate(asset.symbol)}>가상투자하기</button></div>;
}

function Hero({ selected, setSelected, chatAction }: { selected: Asset; setSelected: (asset: Asset) => void; chatAction: AppAction | null }) {
  const [kind, setKind] = useState<AssetCategory>('stock');
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  useEffect(() => {
    if (chatAction?.type === 'searchAssets') {
      setQuery(chatAction.query);
      const matched = assets.find((asset) => `${asset.name}${asset.symbol}`.toLowerCase().includes(chatAction.query.toLowerCase()));
      const category = chatAction.category ?? matched?.category;
      if (category) setKind(category);
      if (matched) setSelected(matched);
    } else if (chatAction?.type === 'filterAssets' && chatAction.category !== 'all') {
      setKind(chatAction.category);
      setQuery('');
    }
  }, [chatAction, setSelected]);
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? assets.filter(
        (asset) =>
          asset.category === kind &&
          `${asset.name}${asset.symbol}`.toLowerCase().includes(normalizedQuery)
      )
    : [];
  const changeQuery = (value: string) => {
    setQuery(value);
    setSearchError('');
  };
  const start = () => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setSearchError('시험할 종목명 또는 코드를 입력해주세요.');
      return;
    }
    const matched = assets.find((asset) => asset.category === kind && (asset.name.toLowerCase() === normalized || asset.symbol.toLowerCase() === normalized));
    if (!matched) {
      setSearchError('검색 결과에서 시험할 자산을 선택해주세요.');
      return;
    }
    setSelected(matched);
    window.location.href = `/hypothesis?asset=${matched.symbol}`;
  };
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">데이터로 배우는, 더 나은 투자</span>
          <h1>
            내 투자 가설,
            <br />
            <em>과거 데이터로 직접 시험</em>해보세요.
          </h1>
          <p>
            주식과 가상자산의 과거 시장 데이터를 바탕으로
            <br className="desktop-only" />
            당신의 투자 아이디어를 가상으로 실험하고, 결과와 이유까지 확인할 수 있습니다.
          </p>

          <div className="hero-action-card">
            <div className="hero-action-head">
              <strong>투자할 자산을 선택하세요</strong>
              <span>자산 유형을 고른 뒤 종목명이나 코드를 검색하세요.</span>
            </div>
            <div className="segmented hero-segmented" aria-label="자산 유형">
              <button
                className={kind === 'stock' ? 'active' : ''}
                onClick={() => setKind('stock')}
                aria-pressed={kind === 'stock'}
              >
                주식
              </button>
              <button
                className={kind === 'crypto' ? 'active' : ''}
                onClick={() => setKind('crypto')}
                aria-pressed={kind === 'crypto'}
              >
                가상자산
              </button>
            </div>
            <SearchAsset value={query} onChange={changeQuery} onStart={start} error={searchError} errorId="hero-asset-search-error" />
            <div className="hero-suggestions">
              <strong>지금 많이 찾는 종목</strong>
              {popularSymbols.map((symbol) => {
                const asset = assets.find((item) => item.symbol === symbol) as Asset;
                return (
                  <button
                    key={symbol}
                    onClick={() => {
                      setSelected(asset);
                      setKind(asset.category);
                      setQuery(asset.name);
                      setSearchError('');
                    }}
                  >
                    {asset.name}
                  </button>
                );
              })}
            </div>
            {normalizedQuery && (
              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 4).map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        setSelected(asset);
                        setQuery(asset.name);
                        setSearchError('');
                      }}
                    >
                      {asset.name}
                      <span>{asset.symbol}</span>
                    </button>
                  ))
                ) : (
                  <p className="search-empty">선택한 자산 유형에서 검색 결과를 찾지 못했어요.</p>
                )}
              </div>
            )}
          </div>
        </div>
        <AssetPreview asset={selected} onStart={start} />
      </div>
    </section>
  );
}

function AssetDiscovery({ selected, onSelect, chatAction }: { selected: Asset; onSelect: (asset: Asset) => void; chatAction: AppAction | null }) {
  const [filter, setFilter] = useState<'all' | AssetCategory>('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (chatAction?.type === 'searchAssets') {
      setSearch(chatAction.query);
      if (chatAction.category) setFilter(chatAction.category);
    } else if (chatAction?.type === 'filterAssets') {
      setFilter(chatAction.category);
      setSearch('');
    }
  }, [chatAction]);
  const filtered = assets.filter((asset) => (filter === 'all' || asset.category === filter) && `${asset.name}${asset.symbol}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <section id="asset-discovery" className="section assets-section">
      <div className="container">
        <SectionHeading title="지금, 어떤 자산을 시험해볼까요?" subtitle="주식과 가상자산을 검색하고, 다양한 투자 대상을 가상으로 경험해보세요." action={<Link href="/assets" className="text-link">더 많은 자산 보기 <ArrowRight size={14} /></Link>} />
        <div className="asset-toolbar">
          <div className="segmented small">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체</button>
            <button className={filter === 'stock' ? 'active' : ''} onClick={() => setFilter('stock')}>주식</button>
            <button className={filter === 'crypto' ? 'active' : ''} onClick={() => setFilter('crypto')}>가상자산</button>
          </div>
          <div className="mini-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="자산 검색" aria-label="자산 목록 검색" /></div>
        </div>
        {filtered.length > 0 ? <div className="asset-grid">
          {filtered.map((asset) => <AssetCard key={asset.symbol} asset={asset} onSimulate={(symbol) => { onSelect(assets.find((item) => item.symbol === symbol) as Asset); window.location.href = `/hypothesis?asset=${symbol}`; }} />)}
        </div> : <div className="asset-list-empty" role="status"><strong>검색 결과가 없어요.</strong><p>다른 종목명이나 코드로 다시 검색해보세요.</p><button type="button" className="secondary-button" onClick={() => { setSearch(''); setFilter('all'); }}>검색 초기화</button></div>}
      </div>
    </section>
  );
}

const processSteps = [{ icon: Search, number: '01', title: '투자 대상 선택', desc: '주식 또는 가상자산을 검색하고 선택하세요.', href: '/assets' }, { icon: ClipboardList, number: '02', title: '시장 가설 입력', desc: '나만의 투자 아이디어를 입력하세요.', href: '/hypothesis' }, { icon: BarChart3, number: '03', title: '가상투자 실행', desc: '투자 금액과 기간을 설정하고 실행하세요.', href: '/simulation/settings' }, { icon: CalendarDays, number: '04', title: '결과·위험 확인', desc: '수익률과 위험 지표를 확인하세요.', href: '/simulation/result' }];
function Process() { return <section className="section process-section"><div className="container"><SectionHeading title="이렇게 진행돼요" subtitle="4단계로 쉽고 간단하게, 나만의 투자 가설을 시험할 수 있습니다." /><div className="process-layout"><div className="process-flow">{processSteps.map((step, index) => { const Icon = step.icon; return <div className="process-item-wrap" key={step.number}><Link href={step.href} className="process-item"><span className="step-number">{step.number}</span><span className="process-icon"><Icon size={25} /></span><strong>{step.title}</strong><p>{step.desc}</p></Link>{index < 3 && <ArrowRight className="process-arrow" size={22} />}</div>; })}</div><div className="learning-card"><Sparkles size={23} /><strong>투자는 감이 아니라,<br />데이터로 배우는 경험입니다.</strong><p>실제 시장 데이터를 기반으로<br />안전하게 가상 투자 경험을 쌓아보세요.</p></div></div></div></section>; }

function ResultExample() { const [period, setPeriod] = useState('1년'); const points = chartPoints.map((point, index) => `${index * 14},${175 - (point - 28) * 1.1}`).join(' L'); return <section className="section result-section"><div className="container"><SectionHeading title="실제 시뮬레이션 결과 예시" subtitle="과거 데이터를 기반으로 한 가상 투자 결과를 미리 살펴보세요." action={<div className="result-actions"><Link href="/assets/TSLA" className="select-button" aria-label="테슬라 상세 보기">테슬라 (TSLA) <ArrowRight size={14} /></Link><Link href="/simulation/result" className="text-link">다른 예시 보기 <ArrowRight size={14} /></Link></div>} /><div className="result-panel"><div className="result-top"><strong>테슬라 (TSLA) 시뮬레이션 결과</strong><div className="chart-legend"><span><i className="dot blue" /> 주가</span><span><i className="dot green" /> 매수 시점</span><span><i className="dot red" /> 매도 시점</span></div><div className="period-tabs">{['3개월', '6개월', '1년', '3년'].map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div></div><div className="result-layout"><div className="large-chart"><div className="y-labels"><span>400</span><span>300</span><span>200</span><span>100</span></div><svg viewBox="0 0 430 190" preserveAspectRatio="none"><defs><linearGradient id="resultFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5e9eff" stopOpacity=".23" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>{[36, 78, 120, 162].map((y) => <line key={y} x1="0" y1={y} x2="430" y2={y} stroke="#e7effa" />)}<path d={`M${points} L430 190 L0 190 Z`} fill="url(#resultFill)" /><path d={`M${points}`} fill="none" stroke="#2879fa" strokeWidth="2.4" strokeLinecap="round" /><circle cx="230" cy="82" r="4" fill="#16b97c" /><circle cx="370" cy="52" r="4" fill="#ff4d59" /></svg><div className="x-labels"><span>2023.11</span><span>2024.01</span><span>2024.03</span><span>2024.05</span><span>2024.07</span><span>2024.09</span><span>2024.11</span></div></div><div className="metrics"><div className="metric"><span>가상 투자금</span><strong>1,000,000원</strong></div><div className="metric"><span>최종 평가금액</span><strong className="green">1,120,000원</strong></div><div className="metric"><span>수익률</span><strong className="red">+12.0%</strong></div><div className="metric"><span>최대 손실</span><strong className="blue-text">-18.5%</strong></div><div className="metric"><span>변동성(연율)</span><strong>32.4%</strong></div><div className="metric"><span>투자 기간</span><strong className="date">2024.01.01 ~ 2024.11.01</strong></div><div className="ai-explanation"><Bot size={16} /><div><strong>AI 학습 해석</strong><p>해당 기간 동안 테슬라는 시장 기대감과 실적 개선으로 상승세를 보였지만, 중간에 큰 변동성이 있었어요.</p></div></div></div></div></div></div></section>; }

function Hypotheses() { return <section className="section hypothesis-section"><div className="container"><SectionHeading title="이런 투자 가설도 시험해보세요" subtitle="다른 사람들은 이런 가설을 시험하고 있어요. 지금 바로 나만의 가설을 선택해보세요." action={<Link href="/hypothesis" className="text-link">더 많은 가설 보기 <ArrowRight size={14} /></Link>} /><div className="hypothesis-grid">{hypotheses.map((item) => <div className="hypothesis-card" key={item.id}><span className="hypothesis-icon">{item.icon}</span><h3>{item.text}</h3><div className="topic-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link href={`/hypothesis?template=${item.id}`} className="secondary-button">이 가설로 시험하기 <ArrowRight size={14} /></Link></div>)}</div></div></section>; }

function Trust() { const items = [{ icon: Database, title: '검증된 시장 데이터', text: 'Yahoo Finance, CoinMarketCap 등 신뢰할 수 있는 데이터를 바탕으로 제공합니다.' }, { icon: CalendarDays, title: '다양한 자산, 긴 데이터 기간', text: '주식·가상자산의 과거 데이터를 최대 10년 이상 제공합니다.' }, { icon: ShieldCheck, title: '투명한 시뮬레이션 방식', text: '수수료·배당·휴장일 등 계산 조건을 직접 확인할 수 있습니다.' }, { icon: CircleHelp, title: '투자 권유가 아닙니다', text: '이 서비스는 교육 목적의 가상 투자이며 실제 투자 수익을 보장하지 않습니다.' }]; return <section className="section trust-section"><div className="container"><SectionHeading title="신뢰할 수 있는 데이터로, 더 정확한 학습을" subtitle="투자의 기본은 신뢰할 수 있는 데이터입니다. 투명한 데이터와 검증 가능한 방식으로 제공합니다." /><div className="trust-grid">{items.map(({ icon: Icon, title, text }) => <div className="trust-card" key={title}><Icon size={21} /><div><strong>{title}</strong><p>{text}</p></div></div>)}</div></div></section>; }

function FinalCTA({ setSelected }: { selected: Asset; setSelected: (asset: Asset) => void }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const changeQuery = (value: string) => {
    setQuery(value);
    setError('');
    const normalized = value.trim().toLowerCase();
    const found = assets.find((asset) => asset.name.toLowerCase() === normalized || asset.symbol.toLowerCase() === normalized);
    if (found) setSelected(found);
  };
  const start = () => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setError('시험할 종목명 또는 코드를 입력해주세요.');
      return;
    }
    const found = assets.find((asset) => asset.name.toLowerCase() === normalized || asset.symbol.toLowerCase() === normalized);
    if (!found) {
      setError('지원하는 자산의 정확한 종목명 또는 코드를 입력해주세요.');
      return;
    }
    window.location.href = `/hypothesis?asset=${found.symbol}`;
  };
  return <section className="final-cta"><div className="container final-cta-inner"><div><h2>지금, 당신의 투자 가설을 직접 시험해보세요.</h2><p>과거의 데이터가 더 나은 투자 판단을 배우는 데 도움을 줍니다.</p></div><SearchAsset compact value={query} onChange={changeQuery} onStart={start} error={error} errorId="footer-asset-search-error" /></div></section>;
}

export default function InvestLabHome() {
  const [selected, setSelected] = useState(assets[1]);
  const [chatAction, setChatAction] = useState<AppAction | null>(null);

  useEffect(() => {
    const receiveAction = (event: Event) => setChatAction((event as CustomEvent<AppAction>).detail);
    window.addEventListener(APP_ACTION_EVENT, receiveAction);
    const pending = sessionStorage.getItem(APP_ACTION_STORAGE_KEY);
    if (pending) {
      try { setChatAction(JSON.parse(pending) as AppAction); } catch { /* 잘못된 세션 명령은 무시 */ }
      sessionStorage.removeItem(APP_ACTION_STORAGE_KEY);
    }
    return () => window.removeEventListener(APP_ACTION_EVENT, receiveAction);
  }, []);

  return <><Header /><main><Hero selected={selected} setSelected={setSelected} chatAction={chatAction} /><AssetDiscovery selected={selected} onSelect={setSelected} chatAction={chatAction} /><Process /><ResultExample /><Hypotheses /><Trust /><FinalCTA selected={selected} setSelected={setSelected} /></main><Footer /></>;
}

export function PlaceholderPage({ title, description, primaryHref = '/', primaryLabel = '메인으로 돌아가기', secondaryHref, secondaryLabel }: { title: string; description?: string; primaryHref?: string; primaryLabel?: string; secondaryHref?: string; secondaryLabel?: string }) { return <><Header /><main className="placeholder"><div className="placeholder-card"><span className="eyebrow">InvestLab</span><h1>{title}</h1><p>{description ?? '현재 페이지를 준비하고 있습니다.\n곧 더 자세한 기능을 제공할 예정입니다.'}</p><div className="placeholder-actions">{secondaryHref && secondaryLabel && <Link href={secondaryHref} className="secondary-button">{secondaryLabel}</Link>}<Link href={primaryHref} className="primary-button">{primaryLabel} <ArrowRight size={16} /></Link></div></div></main><Footer /></>; }
