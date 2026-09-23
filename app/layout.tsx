import './globals.css';
import type { Metadata } from 'next';
import V1ProgressPanel from '@/components/v1-progress/v1-progress-panel';
import AiChatbot from '@/components/ai-chatbot';

export const metadata: Metadata = {
  title: 'InvestLab | 데이터로 배우는 투자',
  description: '과거 데이터로 투자 가설을 직접 시험하는 교육용 시뮬레이션 서비스',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <AiChatbot />
        <V1ProgressPanel />
      </body>
    </html>
  );
}
