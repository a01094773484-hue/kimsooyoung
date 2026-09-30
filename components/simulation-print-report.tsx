import type { SavedSimulation } from '@/lib/simulation-storage';
import { createSimulationReportData } from '@/lib/simulation-report';

export default function SimulationPrintReport({ record }: { record: SavedSimulation }) {
  const report = createSimulationReportData(record);
  return <section className="print-report" aria-label="교육용 인쇄 리포트"><header><span>InvestLab</span><h1>{report.title}</h1><p>{report.asset} · 저장 시각 {report.savedAt}</p></header><section><h2>연결된 가설</h2><p className="print-hypothesis">{report.hypothesis}</p></section><section><h2>시뮬레이션 조건</h2><dl>{report.conditions.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section><h2>계산 결과</h2><dl>{report.results.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><aside><strong>교육용 안내</strong><p>본 결과는 사용자가 입력한 가정조건을 계산한 교육용 가상 시뮬레이션이며 실제 시장 전망이나 투자추천이 아닙니다.</p></aside></section>;
}
