export type AssetCategory = 'stock' | 'crypto';

export type Asset = {
  name: string;
  symbol: string;
  category: AssetCategory;
  price: string;
  change: string;
  positive: boolean;
  color: string;
  icon: string;
};

export const assets: Asset[] = [
  { name: '삼성전자', symbol: '005930', category: 'stock', price: '72,400원', change: '+1.40%', positive: true, color: '#1464f4', icon: 'S' },
  { name: '테슬라', symbol: 'TSLA', category: 'stock', price: '322.18 USD', change: '+3.98%', positive: true, color: '#e22c37', icon: 'T' },
  { name: '엔비디아', symbol: 'NVDA', category: 'stock', price: '137.21 USD', change: '+2.14%', positive: true, color: '#75b72b', icon: 'N' },
  { name: '애플', symbol: 'AAPL', category: 'stock', price: '228.36 USD', change: '-0.52%', positive: false, color: '#171717', icon: 'A' },
  { name: '비트코인', symbol: 'BTC', category: 'crypto', price: '94,521,000원', change: '+1.12%', positive: true, color: '#f7931a', icon: '₿' },
  { name: '이더리움', symbol: 'ETH', category: 'crypto', price: '4,821,000원', change: '-0.73%', positive: false, color: '#627eea', icon: '◆' },
];

export const popularSymbols = ['005930', 'TSLA', 'NVDA', 'AAPL', 'BTC', 'ETH'];

export const hypotheses = [
  { id: 'interest-bitcoin', icon: '%', text: '금리가 오르고 악재 뉴스가 많아지면 비트코인은 하락할까?', tags: ['비트코인', '금리', '거시경제'] },
  { id: 'ai-nvidia', icon: '✦', text: 'AI 수요가 증가하면 엔비디아의 주가는 계속 오를까?', tags: ['엔비디아', 'AI', '반도체'] },
  { id: 'consumer-apple', icon: '▣', text: '소비 지표가 좋아지면 애플의 주가도 상승할까?', tags: ['애플', '소비', '경기지표'] },
  { id: 'oil-airline', icon: '◈', text: '국제 유가가 오르면 항공주의 주가는 하락할까?', tags: ['항공주', '유가', '원자재'] },
];

export const chartPoints = [36, 42, 38, 48, 44, 53, 45, 57, 51, 61, 57, 68, 64, 72, 67, 78, 70, 81, 76, 88, 82, 91, 86, 96, 91, 102, 98, 108, 103, 114, 110, 119];
