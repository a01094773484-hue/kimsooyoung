import { NextResponse } from 'next/server';
import { PAGE_LABELS, PROJECT_ASSISTANT_CONTEXT } from '@/lib/project-context';
import { isAllowedAppAction, type AppAction } from '@/lib/chat-actions';

type ChatRequestMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function extractResponse(payload: unknown): { answer: string; action?: AppAction } {
  if (!payload || typeof payload !== 'object') return { answer: '' };
  const response = payload as { output_text?: unknown; output?: unknown };
  const answer = typeof response.output_text === 'string' ? response.output_text.trim() : '';
  if (!Array.isArray(response.output)) return { answer };

  const outputText = response.output
    .flatMap((item) => {
      if (!item || typeof item !== 'object' || !Array.isArray((item as { content?: unknown }).content)) return [];
      return (item as { content: Array<{ text?: unknown }> }).content
        .map((content) => typeof content.text === 'string' ? content.text : '')
        .filter(Boolean);
    })
    .join('\n')
    .trim();
  const functionCall = response.output.find((item) => item && typeof item === 'object' && (item as { type?: unknown }).type === 'function_call') as { name?: unknown; arguments?: unknown } | undefined;
  if (!functionCall || typeof functionCall.name !== 'string' || typeof functionCall.arguments !== 'string') {
    return { answer: answer || outputText };
  }

  try {
    const args = JSON.parse(functionCall.arguments) as Record<string, unknown>;
    const actionMap: Record<string, unknown> = {
      search_assets: { type: 'searchAssets', query: args.query, category: args.category },
      filter_assets: { type: 'filterAssets', category: args.category },
      navigate_to: { type: 'navigateTo', destination: args.destination },
      open_asset: { type: 'openAsset', symbol: args.symbol },
    };
    const action = actionMap[functionCall.name];
    return isAllowedAppAction(action) ? { answer: answer || outputText, action } : { answer: answer || outputText };
  } catch {
    return { answer: answer || outputText };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages?: unknown; pathname?: unknown };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: '대화 내용을 확인할 수 없어요.' }, { status: 400 });
    }

    const messages = body.messages
      .filter((message): message is ChatRequestMessage => {
        if (!message || typeof message !== 'object') return false;
        const item = message as Partial<ChatRequestMessage>;
        return (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string';
      })
      .slice(-12)
      .map((message) => ({ ...message, content: message.content.trim().slice(0, 2000) }))
      .filter((message) => message.content.length > 0);

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI 연결 설정이 아직 완료되지 않았어요. 관리자에게 OPENAI_API_KEY 설정을 요청해주세요.' },
        { status: 503 }
      );
    }

    const pathname = typeof body.pathname === 'string' ? body.pathname.slice(0, 200) : '/';
    const pagePath = pathname.split('?')[0];
    const pageLabel = PAGE_LABELS[pagePath] ?? (pagePath.startsWith('/assets/') ? '투자 대상 상세' : '확인되지 않은 화면');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-5-mini',
          instructions: `${PROJECT_ASSISTANT_CONTEXT}\n현재 사용자가 보고 있는 화면: ${pageLabel} (${pathname})\n앱 기능 실행 요청이면 허용된 함수 중 정확히 하나를 호출한다. 필요한 값이 없거나 요청이 애매하면 함수를 호출하지 말고 짧게 다시 질문한다. 일반 질문에는 함수를 호출하지 않는다.`,
          input: messages,
          max_output_tokens: 600,
          tools: [
            { type: 'function', name: 'search_assets', description: '등록된 자산을 이름이나 코드로 검색하고 목록에 반영한다.', parameters: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string', enum: ['stock', 'crypto'] } }, required: ['query'], additionalProperties: false } },
            { type: 'function', name: 'filter_assets', description: '메인 자산 목록을 전체, 주식 또는 가상자산으로 필터링한다.', parameters: { type: 'object', properties: { category: { type: 'string', enum: ['all', 'stock', 'crypto'] } }, required: ['category'], additionalProperties: false } },
            { type: 'function', name: 'navigate_to', description: '허용된 InvestLab 화면으로 이동한다.', parameters: { type: 'object', properties: { destination: { type: 'string', enum: ['home', 'assets', 'hypothesis', 'simulation', 'settings', 'results', 'learn'] } }, required: ['destination'], additionalProperties: false } },
            { type: 'function', name: 'open_asset', description: '등록된 자산의 상세 화면으로 이동한다.', parameters: { type: 'object', properties: { symbol: { type: 'string', enum: ['005930', 'TSLA', 'NVDA', 'AAPL', 'BTC', 'ETH'] } }, required: ['symbol'], additionalProperties: false } },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'AI 답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.' }, { status: 502 });
      }

      const payload = await response.json() as unknown;
      const result = extractResponse(payload);
      if (!result.answer && !result.action) {
        return NextResponse.json({ error: 'AI가 답변을 완성하지 못했어요. 다시 시도해주세요.' }, { status: 502 });
      }

      return NextResponse.json(result);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? '답변 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.'
      : '요청을 처리하지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
