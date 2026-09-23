'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Check,
  CircleDashed,
  Code2,
  Minus,
  PanelRightClose,
  X,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  calculateChecklistProgress,
  getV1ProgressSummary,
  v1Modules,
  v1ProgressMeta,
  type V1ModuleStatus,
  type V1VerificationStatus,
} from '@/lib/v1-progress';

import styles from './v1-progress-panel.module.css';

const moduleStatusLabels: Record<V1ModuleStatus, string> = {
  'not-started': '미착수',
  'in-progress': '작업중',
  verifying: '검증중',
  completed: '완료',
  'on-hold': '보류',
};

const moduleStatusClasses: Record<V1ModuleStatus, string> = {
  'not-started': styles.statusNotStarted,
  'in-progress': styles.statusInProgress,
  verifying: styles.statusVerifying,
  completed: styles.statusCompleted,
  'on-hold': styles.statusOnHold,
};

const verificationLabels: Record<V1VerificationStatus, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  untested: '미검증',
};

function isRelatedRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function VerificationIcon({ status }: { status: V1VerificationStatus }) {
  if (status === 'pass') return <Check size={12} aria-hidden="true" />;
  if (status === 'fail') return <X size={12} aria-hidden="true" />;
  return <Minus size={12} aria-hidden="true" />;
}

export default function V1ProgressPanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const summary = useMemo(() => getV1ProgressSummary(v1Modules), []);
  const activeModuleId =
    v1Modules.find((module) =>
      module.relatedPages.some((page) => isRelatedRoute(pathname, page.href))
    )?.id ?? v1Modules.find((module) => module.status === 'in-progress')?.id;

  return (
    <aside className={styles.root} aria-label="V1 개발 진행률">
      {!isOpen ? (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          aria-controls="v1-progress-panel"
          aria-label={`V1 개발 진행률 ${summary.overallProgress}%, 패널 열기`}
        >
          <span className={styles.launcherIcon} aria-hidden="true">
            <Code2 size={15} />
          </span>
          <span className={styles.launcherLabel}>V1 진행률</span>
          <span className={styles.launcherProgress}>
            {summary.overallProgress}%
          </span>
        </button>
      ) : (
        <section
          id="v1-progress-panel"
          className={styles.panel}
          aria-labelledby="v1-progress-title"
        >
          <header className={styles.header}>
            <div className={styles.headerRow}>
              <div>
                <span className={styles.eyebrow}>InvestLab {v1ProgressMeta.version}</span>
                <h2 id="v1-progress-title" className={styles.title}>
                  개발 진행률
                </h2>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setIsOpen(false)}
                aria-expanded="true"
                aria-controls="v1-progress-panel"
                aria-label="진행률 패널 접기"
              >
                <PanelRightClose size={19} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.progressRow}>
              <div>
                <div className={styles.progressValue}>
                  {summary.overallProgress}%
                </div>
                <div className={styles.progressCopy}>
                  PASS {summary.passedChecklistItems} / 전체{' '}
                  {summary.totalChecklistItems}
                </div>
              </div>
              <Progress
                className={styles.progressTrack}
                value={summary.overallProgress}
                aria-label={`전체 V1 진행률 ${summary.overallProgress}%`}
              />
            </div>
          </header>

          <div className={styles.summaryGrid} aria-label="모듈 상태 요약">
            <div className={styles.summaryItem}>
              <strong>{summary.moduleCounts.completed}</strong>
              <span>완료</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.moduleCounts.inProgress}</strong>
              <span>작업중</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.moduleCounts.verifying}</strong>
              <span>검증중</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.moduleCounts.notStarted}</strong>
              <span>미착수</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>{summary.moduleCounts.onHold}</strong>
              <span>보류</span>
            </div>
          </div>

          <div className={styles.body}>
            <p className={styles.basis}>{v1ProgressMeta.basis}</p>

            <div className={styles.sectionTitleRow}>
              <strong>V1 모듈</strong>
              <span>기준일 {v1ProgressMeta.updatedAt}</span>
            </div>

            <Accordion
              type="multiple"
              defaultValue={activeModuleId ? [activeModuleId] : []}
            >
              {v1Modules.map((module) => {
                const moduleProgress = calculateChecklistProgress(
                  module.checklist
                );
                const isActive = module.id === activeModuleId;

                return (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className={styles.accordionItem}
                    data-active={isActive}
                  >
                    <AccordionTrigger className={styles.accordionTrigger}>
                      <div className={styles.moduleSummary}>
                        <div className={styles.moduleHeading}>
                          <strong>{module.name}</strong>
                          <b>{moduleProgress}%</b>
                        </div>
                        <div className={styles.moduleMeta}>
                          <span
                            className={`${styles.statusBadge} ${
                              moduleStatusClasses[module.status]
                            }`}
                          >
                            {moduleStatusLabels[module.status]}
                          </span>
                          <span className={styles.miniProgress} aria-hidden="true">
                            <span style={{ width: `${moduleProgress}%` }} />
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className={styles.accordionContent}>
                      <div className={styles.checklist}>
                        {module.checklist.map((item) => (
                          <div className={styles.checkRow} key={item.id}>
                            <span
                              className={`${styles.checkIcon} ${
                                item.verification === 'pass'
                                  ? styles.checkPass
                                  : item.verification === 'fail'
                                    ? styles.checkFail
                                    : styles.checkUntested
                              }`}
                              aria-hidden="true"
                            >
                              <VerificationIcon status={item.verification} />
                            </span>
                            <div className={styles.checkCopy}>
                              <span>{item.label}</span>
                              {item.evidence ? <small>{item.evidence}</small> : null}
                            </div>
                            <span
                              className={`${styles.verificationBadge} ${
                                item.verification === 'pass'
                                  ? styles.checkPass
                                  : item.verification === 'fail'
                                    ? styles.checkFail
                                    : styles.checkUntested
                              }`}
                            >
                              {verificationLabels[item.verification]}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.linksBlock}>
                        <span className={styles.blockLabel}>관련 페이지</span>
                        <div className={styles.pageLinks}>
                          {module.relatedPages.map((page) => (
                            <Link
                              className={styles.pageLink}
                              key={`${module.id}-${page.href}`}
                              href={page.href}
                            >
                              {page.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {module.references?.length ? (
                        <div className={styles.referencesBlock}>
                          <span className={styles.blockLabel}>기준 자료</span>
                          <div className={styles.referencesList}>
                            {module.references.map((reference) => (
                              <span className={styles.reference} key={reference.path}>
                                <strong>{reference.label}</strong> · {reference.path}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </section>
      )}
    </aside>
  );
}
