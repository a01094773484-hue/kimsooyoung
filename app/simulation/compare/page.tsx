import SimulationCompare from '@/components/simulation-compare';

export default function SimulationComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = (searchParams.ids ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  return <SimulationCompare ids={ids} />;
}
