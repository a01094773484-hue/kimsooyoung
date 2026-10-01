import PeriodStudyDetail from '@/components/period-study-detail';

export default function StudyDetailPage({ params }: { params: { id: string } }) { return <PeriodStudyDetail id={decodeURIComponent(params.id)} />; }
