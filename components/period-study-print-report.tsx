import { createPeriodStudyReportData, type PeriodStudyReportSection } from '@/lib/period-study-report';
import type { PeriodStudyRecord } from '@/lib/period-study-storage';

function PeriodSection({ section }: { section: PeriodStudyReportSection }) {
  return <section className="study-print-period" aria-labelledby={`study-print-${section.label.replace(' ', '-').toLowerCase()}`}>
    <h2 id={`study-print-${section.label.replace(' ', '-').toLowerCase()}`}>{section.label}</h2>
    <p className="study-print-range">{section.range}</p>
    <dl>{section.metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>;
}

export default function PeriodStudyPrintReport({ record }: { record: PeriodStudyRecord }) {
  const report = createPeriodStudyReportData(record);
  return <section className="print-report study-print-report" aria-label="기간 비교 학습 인쇄 리포트">
    <header><span>InvestLab</span><h1>{report.title}</h1><p>{report.asset} · 저장 시각 {report.savedAt}</p></header>
    <aside className="study-print-education"><strong>교육용 안내</strong><p>{report.educationalNotice}</p></aside>
    <section><h2>학습 가설</h2><p className="print-hypothesis study-print-copy">{report.hypothesis}</p></section>
    <section><h2>구간 비교 요약</h2><p>{report.summary}</p></section>
    <div className="study-print-periods"><PeriodSection section={report.periodA} /><PeriodSection section={report.periodB} /></div>
    <section><h2>A/B 비교 차이</h2><dl>{report.differences.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section><h2>학습 메모</h2><p className="study-print-copy">{report.reflection}</p></section>
    <aside className="study-print-snapshot"><strong>Snapshot 안내</strong><p>{report.snapshotNotice}</p></aside>
  </section>;
}
