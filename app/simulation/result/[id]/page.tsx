import SimulationResult from '@/components/simulation-result';

export default function SavedSimulationResultPage({ params }: { params: { id: string } }) {
  return <SimulationResult savedId={params.id} />;
}
