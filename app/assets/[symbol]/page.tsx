import HistoricalPeriodComparison from '@/components/historical-period-comparison';
import { Footer, Header, PlaceholderPage } from '@/components/investlab';
import { assets } from '@/lib/mock-data';

export default function AssetDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const asset = assets.find((item) => item.symbol.toUpperCase() === symbol);

  if (!asset || symbol !== 'TSLA') {
    return <PlaceholderPage title={asset ? `${asset.name} 기간 변화` : `${params.symbol} 자산 정보`} description={asset ? '이 자산은 현재 기간 비교용 예시 데이터가 없습니다.' : '요청한 자산을 찾을 수 없습니다.'} primaryHref="/#asset-discovery" primaryLabel="시장 목록" secondaryHref={`/simulation/settings${asset ? `?asset=${encodeURIComponent(asset.symbol)}` : ''}`} secondaryLabel="가상 시뮬레이션" />;
  }

  return <><Header /><main className="period-page"><section className="container period-heading"><span className="eyebrow">V2 · 교육용 기간 변화</span><h1>{asset.name} 기간 변화 비교</h1><p>{asset.symbol}에 연결된 기존 32개 정적 예시 포인트를 두 구간으로 나누어 비교합니다.</p></section><div className="container"><HistoricalPeriodComparison asset={asset} /></div></main><Footer /></>;
}
