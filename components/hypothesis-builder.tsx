'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Copy, Link2, RotateCcw, Save, Share2, Trash2, Upload } from 'lucide-react';
import { Footer, Header } from '@/components/investlab';
import { assets, hypotheses, type Asset } from '@/lib/mock-data';
import {
  clearAllUserData,
  clearDraft,
  deleteHypothesis,
  loadUserData,
  saveDraft,
  saveHypothesis,
  type HypothesisDraft,
  type SavedHypothesis,
} from '@/lib/investlab-storage';
import { createHypothesisShareContent } from '@/lib/investlab-share';

type Direction = 'rise' | 'fall';
type Period = '1m' | '3m' | '6m' | '1y';

type HypothesisPlan = {
  asset: Asset;
  statement: string;
  direction: Direction;
  targetChange: number;
  period: Period;
};

const periodLabels: Record<Period, string> = {
  '1m': '1개월',
  '3m': '3개월',
  '6m': '6개월',
  '1y': '1년',
};

function getInitialAsset(assetSymbol?: string, templateId?: string) {
  const directAsset = assets.find((asset) => asset.symbol === assetSymbol);
  if (directAsset) return directAsset;

  const template = hypotheses.find((item) => item.id === templateId);
  const templateAsset = assets.find((asset) => template?.tags.includes(asset.name));
  return templateAsset ?? assets[1];
}

function getInitialStatement(templateId?: string) {
  return hypotheses.find((item) => item.id === templateId)?.text ?? '';
}

export default function HypothesisBuilder({
  assetSymbol,
  templateId,
  sharedPlan,
}: {
  assetSymbol?: string;
  templateId?: string;
  sharedPlan?: { statement: string; direction: Direction; targetChange: string; period: Period };
}) {
  const initialAsset = getInitialAsset(assetSymbol, templateId);
  const initialStatement = sharedPlan?.statement ?? getInitialStatement(templateId);
  const initialDirection: Direction = sharedPlan?.direction ?? (templateId === 'interest-bitcoin' || templateId === 'oil-airline' ? 'fall' : 'rise');

  const [selectedSymbol, setSelectedSymbol] = useState(initialAsset.symbol);
  const [statement, setStatement] = useState(initialStatement);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [targetChange, setTargetChange] = useState(sharedPlan?.targetChange ?? '10');
  const [period, setPeriod] = useState<Period>(sharedPlan?.period ?? '3m');
  const [errors, setErrors] = useState<{ statement?: string; targetChange?: string }>({});
  const [plan, setPlan] = useState<HypothesisPlan | null>(null);
  const [planStale, setPlanStale] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedHypothesis[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'one'; id: string; label: string } | { type: 'all' } | null>(null);
  const statementRef = useRef<HTMLTextAreaElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const stored = loadUserData();
      setSavedItems(stored.hypotheses);
      if (!templateId && !sharedPlan && stored.draft) {
        setSelectedSymbol(assetSymbol ? initialAsset.symbol : stored.draft.selectedSymbol);
        setStatement(stored.draft.statement);
        setDirection(stored.draft.direction);
        setTargetChange(stored.draft.targetChange);
        setPeriod(stored.draft.period);
      }
    } catch {
      setStorageError('저장된 기록을 불러오지 못했어요. 새로 입력한 내용은 계속 사용할 수 있어요.');
    } finally {
      setStorageReady(true);
    }
  }, [assetSymbol, initialAsset.symbol, sharedPlan, templateId]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      saveDraft({ selectedSymbol, statement, direction, targetChange, period });
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '초안을 자동 저장하지 못했어요.');
    }
  }, [direction, period, selectedSymbol, statement, storageReady, targetChange]);

  useEffect(() => {
    if (!shareNotice) return;
    const timer = window.setTimeout(() => setShareNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [shareNotice]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const invalidatePlan = () => {
    if (plan) setPlanStale(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { statement?: string; targetChange?: string } = {};
    const parsedTarget = Number(targetChange);

    if (statement.trim().length < 10) {
      nextErrors.statement = '가설을 10자 이상 입력해주세요.';
    } else if (statement.trim().length > 300) {
      nextErrors.statement = '가설은 300자 이하로 입력해주세요.';
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 100) {
      nextErrors.targetChange = '변화율은 1에서 100 사이로 입력해주세요.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (plan) setPlanStale(true);
      window.requestAnimationFrame(() => {
        if (nextErrors.statement) statementRef.current?.focus();
        else targetRef.current?.focus();
      });
      return;
    }

    const asset = assets.find((item) => item.symbol === selectedSymbol) ?? initialAsset;
    setPlan({
      asset,
      statement: statement.trim(),
      direction,
      targetChange: parsedTarget,
      period,
    });
    setPlanStale(false);
    window.requestAnimationFrame(() => {
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const reset = () => {
    setSelectedSymbol(initialAsset.symbol);
    setStatement(initialStatement);
    setDirection(initialDirection);
    setTargetChange(sharedPlan?.targetChange ?? '10');
    setPeriod(sharedPlan?.period ?? '3m');
    setErrors({});
    setPlan(null);
    setPlanStale(false);
    setEditingId(null);
    setSaveNotice('');
    try {
      clearDraft();
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '초안을 초기화하지 못했어요.');
    }
  };

  const currentDraft = (): HypothesisDraft => ({ selectedSymbol, statement: statement.trim(), direction, targetChange, period });

  const persistPlan = () => {
    if (!plan) return;
    try {
      const result = saveHypothesis(currentDraft(), editingId);
      setSavedItems(result.hypotheses);
      setEditingId(result.saved.id);
      setStorageError('');
      setSaveNotice(result.updated ? '저장한 계획을 최신 내용으로 수정했어요.' : '검증 계획을 저장했어요.');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '계획을 저장하지 못했어요.');
    }
  };

  const restoreSaved = (saved: SavedHypothesis) => {
    setSelectedSymbol(saved.selectedSymbol);
    setStatement(saved.statement);
    setDirection(saved.direction);
    setTargetChange(saved.targetChange);
    setPeriod(saved.period);
    setEditingId(saved.id);
    setErrors({});
    setPlan(null);
    setPlanStale(false);
    setSaveNotice('저장한 계획을 불러왔어요. 수정한 뒤 다시 계획을 만들고 저장할 수 있어요.');
  };

  const removeSaved = (id: string) => {
    try {
      setSavedItems(deleteHypothesis(id));
      if (editingId === id) setEditingId(null);
      setStorageError('');
      setSaveNotice('저장한 계획을 삭제했어요.');
      setPendingDelete(null);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '저장 계획을 삭제하지 못했어요.');
    }
  };

  const clearSavedData = () => {
    try {
      clearAllUserData();
      setSavedItems([]);
      setEditingId(null);
      setStorageError('');
      setSaveNotice('저장된 초안과 계획을 모두 초기화했어요.');
      setPendingDelete(null);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '저장 기록을 초기화하지 못했어요.');
    }
  };

  const reloadSavedData = () => {
    try {
      setSavedItems(loadUserData().hypotheses);
      setStorageError('');
      setSaveNotice('저장된 계획을 다시 불러왔어요.');
    } catch {
      setStorageError('저장된 계획을 다시 불러오지 못했어요.');
    }
  };

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy-failed');
  };

  const getShareContent = (draft: HypothesisDraft) => {
    const asset = assets.find((item) => item.symbol === draft.selectedSymbol);
    return createHypothesisShareContent(draft, asset?.name ?? draft.selectedSymbol, window.location.origin);
  };

  const shareDraft = async (draft: HypothesisDraft) => {
    if (!draft.statement.trim()) {
      setShareNotice('공유할 가설을 먼저 작성해주세요.');
      return;
    }
    const content = getShareContent(draft);
    setShareBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: content.title, text: content.text, url: content.url });
        setShareNotice('공유가 완료되었습니다.');
      } else {
        await copyText(content.combined);
        setShareNotice('공유 기능을 지원하지 않아 요약과 링크를 복사했습니다.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareNotice('공유가 취소되었습니다.');
        return;
      }
      try {
        await copyText(content.combined);
        setShareNotice('공유 대신 요약과 링크를 복사했습니다.');
      } catch {
        setShareNotice('공유하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setShareBusy(false);
    }
  };

  const copySharePart = async (draft: HypothesisDraft, part: 'url' | 'text') => {
    if (!draft.statement.trim()) {
      setShareNotice('복사할 가설을 먼저 작성해주세요.');
      return;
    }
    try {
      setShareBusy(true);
      const content = getShareContent(draft);
      await copyText(part === 'url' ? content.url : content.text);
      setShareNotice(part === 'url' ? '링크가 복사되었습니다.' : '결과 요약이 복사되었습니다.');
    } catch {
      setShareNotice('복사하지 못했습니다. 브라우저 권한을 확인해주세요.');
    } finally {
      setShareBusy(false);
    }
  };

  const settingsHref = plan
    ? `/simulation/settings?asset=${plan.asset.symbol}&direction=${plan.direction}&target=${plan.targetChange}&period=${plan.period}&hypothesis=${encodeURIComponent(plan.statement)}`
    : '/simulation/settings';

  return (
    <>
      <Header />
      <main className="hypothesis-builder-page">
        <section className="container hypothesis-builder-heading">
          <span className="eyebrow">STEP 02 · 시장 가설 입력</span>
          <h1>투자 아이디어를 검증 가능한 가설로 바꿔보세요.</h1>
          <p>자산과 예상 방향, 기간, 변화 기준을 정하면 다음 단계에서 같은 조건으로 가상투자를 준비할 수 있습니다.</p>
        </section>

        <section className="container hypothesis-builder-layout">
          <form className="hypothesis-form-card" onSubmit={submit} noValidate aria-busy={!storageReady}>
            {!storageReady && <p className="form-loading-notice" role="status"><span aria-hidden="true" />저장된 초안을 불러오는 중이에요.</p>}
            <fieldset className="hypothesis-form-fields" disabled={!storageReady}>
            <div className="form-section-heading">
              <span>1</span>
              <div><strong>가설 내용</strong><p>무엇이 가격에 영향을 줄 것이라고 생각하는지 적어주세요.</p></div>
            </div>

            <label className="hypothesis-field">
              <span>투자 자산</span>
              <select
                value={selectedSymbol}
                onChange={(event) => { setSelectedSymbol(event.target.value); invalidatePlan(); }}
              >
                {assets.map((asset) => <option key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol})</option>)}
              </select>
            </label>

            <label className="hypothesis-field">
              <span>나의 투자 가설</span>
              <textarea
                ref={statementRef}
                value={statement}
                onChange={(event) => { setStatement(event.target.value); setErrors((current) => ({ ...current, statement: undefined })); invalidatePlan(); }}
                placeholder="예: AI 수요가 계속 증가하면 엔비디아 주가는 상승할 것이다."
                rows={4}
                maxLength={300}
                aria-invalid={Boolean(errors.statement)}
                aria-describedby={errors.statement ? 'statement-error' : undefined}
              />
              <small className="field-count">{statement.trim().length}자</small>
              {errors.statement && <small id="statement-error" className="field-error">{errors.statement}</small>}
            </label>

            <div className="form-section-heading form-section-divider">
              <span>2</span>
              <div><strong>검증 조건</strong><p>가설을 지지한다고 판단할 기준을 정해주세요.</p></div>
            </div>

            <fieldset className="hypothesis-field">
              <legend>예상 방향</legend>
              <div className="choice-grid two-columns">
                <button type="button" className={direction === 'rise' ? 'active' : ''} aria-pressed={direction === 'rise'} onClick={() => { setDirection('rise'); invalidatePlan(); }}>상승</button>
                <button type="button" className={direction === 'fall' ? 'active' : ''} aria-pressed={direction === 'fall'} onClick={() => { setDirection('fall'); invalidatePlan(); }}>하락</button>
              </div>
            </fieldset>

            <fieldset className="hypothesis-field">
              <legend>검증 기간</legend>
              <div className="choice-grid four-columns">
                {(Object.keys(periodLabels) as Period[]).map((value) => (
                  <button type="button" key={value} className={period === value ? 'active' : ''} aria-pressed={period === value} onClick={() => { setPeriod(value); invalidatePlan(); }}>{periodLabels[value]}</button>
                ))}
              </div>
            </fieldset>

            <label className="hypothesis-field">
              <span>목표 변화율</span>
              <div className="number-input-wrap">
                <input
                  ref={targetRef}
                  type="number"
                  min="1"
                  max="100"
                  inputMode="numeric"
                  value={targetChange}
                  onChange={(event) => { setTargetChange(event.target.value); setErrors((current) => ({ ...current, targetChange: undefined })); invalidatePlan(); }}
                  aria-invalid={Boolean(errors.targetChange)}
                  aria-describedby={errors.targetChange ? 'target-error' : undefined}
                />
                <span>% 이상</span>
              </div>
              {errors.targetChange && <small id="target-error" className="field-error">{errors.targetChange}</small>}
            </label>

            <div className="hypothesis-form-actions">
              <button type="button" className="secondary-button" onClick={reset}><RotateCcw size={15} /> 초기화</button>
              <button type="submit" className="primary-button">검증 계획 만들기 <ArrowRight size={16} /></button>
            </div>
            </fieldset>
          </form>

          <aside ref={planRef} className={`hypothesis-plan-card ${plan ? 'has-result' : ''} ${planStale ? 'is-stale' : ''}`} aria-live="polite">
            {plan ? (
              <>
                <div className="plan-success"><CheckCircle2 size={20} /><span>검증 계획이 준비됐어요</span></div>
                {planStale && <p className="plan-stale-notice">입력 내용이 변경됐어요. 최신 조건으로 검증 계획을 다시 만들어주세요.</p>}
                <div className="plan-asset"><span className="asset-icon" style={{ background: plan.asset.color }}>{plan.asset.icon}</span><div><strong>{plan.asset.name}</strong><span>{plan.asset.symbol}</span></div></div>
                <blockquote>{plan.statement}</blockquote>
                <dl className="plan-conditions">
                  <div><dt>예상 방향</dt><dd>{plan.direction === 'rise' ? '상승' : '하락'}</dd></div>
                  <div><dt>검증 기간</dt><dd>{periodLabels[plan.period]}</dd></div>
                  <div><dt>판정 기준</dt><dd>{plan.direction === 'rise' ? '+' : '-'}{plan.targetChange}% 이상</dd></div>
                </dl>
                <p className="plan-rule">{periodLabels[plan.period]} 뒤 수익률이 {plan.direction === 'rise' ? '+' : '-'}{plan.targetChange}% 이상이면 가설을 지지하는 결과로 판단합니다.</p>
                <div className="plan-share-actions">
                  <button type="button" className="secondary-button" disabled={shareBusy || planStale} onClick={() => void shareDraft(currentDraft())}><Share2 size={15} /> {shareBusy ? '처리 중' : '공유'}</button>
                  <button type="button" className="secondary-button" disabled={shareBusy || planStale} onClick={() => void copySharePart(currentDraft(), 'url')}><Link2 size={15} /> 링크 복사</button>
                  <button type="button" className="secondary-button" disabled={shareBusy || planStale} onClick={() => void copySharePart(currentDraft(), 'text')}><Copy size={15} /> 요약 복사</button>
                </div>
                <button type="button" className="secondary-button plan-save" disabled={planStale} onClick={persistPlan}><Save size={15} /> {editingId ? '저장한 계획 수정' : '검증 계획 저장'}</button>
                {planStale ? <button type="button" className="primary-button plan-next" disabled>최신 계획을 먼저 만들어주세요</button> : <Link href={settingsHref} className="primary-button plan-next">이 조건으로 가상투자 설정 <ArrowRight size={16} /></Link>}
              </>
            ) : (
              <div className="plan-empty">
                <span>검증 계획 미리보기</span>
                <strong>왼쪽에서 가설과 조건을 입력해주세요.</strong>
                <p>완료하면 자산, 기간, 방향과 판정 기준이 여기에 정리됩니다.</p>
              </div>
            )}
          </aside>
        </section>

        {shareNotice && <p className="container share-notice" role="status">{shareNotice}</p>}

        <section className="container saved-hypotheses" aria-live="polite">
          <div className="saved-hypotheses-heading">
            <div><span className="eyebrow">내 저장 기록</span><h2>저장한 검증 계획</h2><p>최근 수정한 순서로 표시되며, 다시 불러와 수정하거나 실행할 수 있습니다.</p></div>
            <div className="saved-hypotheses-actions">
              <button type="button" className="secondary-button" onClick={reloadSavedData} disabled={!storageReady}><Upload size={15} /> 다시 불러오기</button>
              <button type="button" className="secondary-button danger" onClick={() => setPendingDelete({ type: 'all' })} disabled={savedItems.length === 0}>전체 초기화</button>
            </div>
          </div>
          {saveNotice && <p className="storage-notice" role="status">{saveNotice}</p>}
          {storageError && <p className="storage-error" role="alert">{storageError}</p>}
          {pendingDelete && <div className="delete-confirm" role="alert"><p>{pendingDelete.type === 'all' ? '저장된 초안과 계획을 모두 삭제할까요?' : `“${pendingDelete.label}” 저장 계획을 삭제할까요?`}</p><div><button type="button" className="secondary-button" onClick={() => setPendingDelete(null)}>취소</button><button type="button" className="danger-confirm" onClick={() => pendingDelete.type === 'all' ? clearSavedData() : removeSaved(pendingDelete.id)}>삭제 확인</button></div></div>}
          {!storageReady ? (
            <div className="saved-loading" role="status" aria-live="polite"><span aria-hidden="true" />저장한 계획을 불러오는 중이에요.</div>
          ) : savedItems.length === 0 ? (
            <div className="saved-empty"><strong>아직 저장한 계획이 없어요.</strong><p>위에서 검증 계획을 만든 뒤 저장해보세요.</p></div>
          ) : (
            <div className="saved-list">
              {savedItems.map((saved) => {
                const asset = assets.find((item) => item.symbol === saved.selectedSymbol);
                return (
                  <article key={saved.id} className={editingId === saved.id ? 'editing' : ''}>
                    <div className="saved-card-top"><strong>{asset?.name ?? saved.selectedSymbol}</strong><span>{new Date(saved.updatedAt).toLocaleString('ko-KR')}</span></div>
                    <p>{saved.statement}</p>
                    <div className="saved-tags"><span>{saved.direction === 'rise' ? '상승' : '하락'}</span><span>{periodLabels[saved.period]}</span><span>{saved.targetChange}%</span></div>
                    <div className="saved-card-actions"><button type="button" className="secondary-button" onClick={() => restoreSaved(saved)}>불러와 수정</button><Link className="primary-button" href={`/simulation/settings?asset=${saved.selectedSymbol}&direction=${saved.direction}&target=${saved.targetChange}&period=${saved.period}&hypothesis=${encodeURIComponent(saved.statement)}`}>다시 실행</Link><button type="button" className="icon-button" disabled={shareBusy} aria-label={`${asset?.name ?? saved.selectedSymbol} 계획 공유`} onClick={() => void shareDraft(saved)}><Share2 size={16} /></button><button type="button" className="icon-danger" aria-label={`${asset?.name ?? saved.selectedSymbol} 저장 계획 삭제`} onClick={() => setPendingDelete({ type: 'one', id: saved.id, label: asset?.name ?? saved.selectedSymbol })}><Trash2 size={16} /></button></div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
