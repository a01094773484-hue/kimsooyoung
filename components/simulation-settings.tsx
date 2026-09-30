'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Calculator } from 'lucide-react';
import { Footer, Header } from './investlab';
import { assets } from '@/lib/mock-data';
import { calculateSimulation, type SimulationScenario } from '@/lib/simulation-engine';
import { saveCurrentSimulation } from '@/lib/simulation-storage';

export default function SimulationSettings({ assetSymbol, direction, target, hypothesis, initialAmount }: { assetSymbol?: string; direction?: string; target?: string; hypothesis?: string; initialAmount?: string }) {
  const validAsset = assets.find((asset) => asset.symbol === assetSymbol);
  const [symbol, setSymbol] = useState(validAsset?.symbol ?? assets[0].symbol);
  const [amount, setAmount] = useState(initialAmount && Number(initialAmount) > 0 ? initialAmount : '1000000');
  const [scenario, setScenario] = useState<SimulationScenario>(direction === 'fall' ? 'fall' : direction === 'rise' ? 'rise' : 'flat');
  const [changeRate, setChangeRate] = useState(target && Number(target) >= 0 && Number(target) <= 100 ? target : '10');
  const [errors, setErrors] = useState<{ amount?: string; rate?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedRate = Number(changeRate);
    const nextErrors: typeof errors = {};
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = '투자금액은 0보다 큰 숫자로 입력해주세요.';
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) nextErrors.rate = '변동률은 0에서 100 사이로 입력해주세요.';
    const asset = assets.find((item) => item.symbol === symbol);
    if (!asset) nextErrors.form = '지원하는 자산을 선택해주세요.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const result = calculateSimulation({ asset: asset!, initialAmount: parsedAmount, changeRate: parsedRate, scenario, hypothesis: hypothesis?.trim() || undefined });
      saveCurrentSimulation(result);
      router.push('/simulation/result');
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '시뮬레이션을 실행하지 못했어요.' });
      setBusy(false);
    }
  };

  return <><Header /><main className="simulation-page"><section className="container simulation-heading"><span className="eyebrow">STEP 03 · 교육용 가상투자</span><h1>시뮬레이션 조건 설정</h1><p>선택한 가상 변동률이 투자금액에 미치는 영향을 단순 계산합니다.</p></section><section className="container simulation-layout"><form className="simulation-card" onSubmit={submit} noValidate><div className="form-section-heading"><span>1</span><div><strong>계산 조건</strong><p>실제 예측이 아닌 학습용 조건입니다.</p></div></div><label className="hypothesis-field"><span>투자 자산</span><select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{assets.map((asset) => <option key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol})</option>)}</select></label><label className="hypothesis-field"><span>가상 투자금액</span><input aria-label="가상 투자금액" inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value); setErrors((value) => ({ ...value, amount: undefined })); }} aria-invalid={Boolean(errors.amount)} />{errors.amount && <small className="field-error" role="alert">{errors.amount}</small>}</label><fieldset className="hypothesis-field"><legend>가상 시나리오</legend><div className="choice-grid three-columns">{([['rise','상승'],['fall','하락'],['flat','보합']] as const).map(([value,label]) => <button type="button" key={value} className={scenario === value ? 'active' : ''} aria-pressed={scenario === value} onClick={() => setScenario(value)}>{label}</button>)}</div></fieldset><label className="hypothesis-field"><span>가상 변동률</span><div className="number-input-wrap"><input aria-label="가상 변동률" inputMode="decimal" value={changeRate} disabled={scenario === 'flat'} onChange={(event) => { setChangeRate(event.target.value); setErrors((value) => ({ ...value, rate: undefined })); }} aria-invalid={Boolean(errors.rate)} /><span>%</span></div>{errors.rate && <small className="field-error" role="alert">{errors.rate}</small>}</label>{errors.form && <p className="storage-error" role="alert">{errors.form}</p>}<button className="primary-button simulation-submit" disabled={busy}>{busy ? '계산 중…' : <>시뮬레이션 실행 <ArrowRight size={16} /></>}</button></form><aside className="simulation-card simulation-summary"><Calculator size={24} /><h2>계산 기준</h2><dl><div><dt>선택 자산</dt><dd>{assets.find((asset) => asset.symbol === symbol)?.name}</dd></div><div><dt>시나리오</dt><dd>{scenario === 'rise' ? '상승' : scenario === 'fall' ? '하락' : '보합'} {scenario !== 'flat' && `${changeRate || 0}%`}</dd></div></dl>{hypothesis && <blockquote>{hypothesis}</blockquote>}<p className="education-note">이 기능은 사용자가 지정한 조건을 단순 계산하며 실제 가격이나 투자 수익을 예측하지 않습니다.</p></aside></section></main><Footer /></>;
}
