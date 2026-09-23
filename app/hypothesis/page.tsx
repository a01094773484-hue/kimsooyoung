import HypothesisBuilder from '@/components/hypothesis-builder';

export default function HypothesisPage({
  searchParams,
}: {
  searchParams: { asset?: string; template?: string; statement?: string; direction?: string; target?: string; period?: string };
}) {
  const sharedPlan = searchParams.statement &&
    (searchParams.direction === 'rise' || searchParams.direction === 'fall') &&
    ['1m', '3m', '6m', '1y'].includes(searchParams.period ?? '') &&
    Number(searchParams.target) >= 1 && Number(searchParams.target) <= 100
    ? {
        statement: searchParams.statement,
        direction: searchParams.direction as 'rise' | 'fall',
        targetChange: searchParams.target as string,
        period: searchParams.period as '1m' | '3m' | '6m' | '1y',
      }
    : undefined;

  return <HypothesisBuilder assetSymbol={searchParams.asset} templateId={searchParams.template} sharedPlan={sharedPlan} />;
}
