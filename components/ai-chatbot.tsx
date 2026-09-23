'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import {
  APP_ACTION_EVENT,
  APP_ACTION_STORAGE_KEY,
  destinationRoutes,
  interpretAppCommand,
  isAllowedAppAction,
  type AppAction,
} from '@/lib/chat-actions';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
};

const STORAGE_KEY = 'investlab-ai-chat-v1';
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '안녕하세요! InvestLab 사용 방법과 투자 가설 작성 과정을 도와드릴게요. 무엇이 궁금한가요?',
};

const suggestedQuestions = [
  'InvestLab은 어떤 서비스야?',
  '처음 사용하는데 무엇부터 하면 돼?',
  '투자 가설은 어떻게 작성해?',
  '수익률과 최대 손실의 차이를 알려줘.',
];

const quickActions = [
  { label: '사용 방법', prompt: 'InvestLab 사용 방법을 순서대로 알려줘.' },
  { label: '현재 페이지', prompt: '지금 보고 있는 페이지에서 무엇을 할 수 있어?' },
  { label: '학습 추천', prompt: '투자 초보자인 나에게 InvestLab에서 먼저 해볼 활동을 추천해줘.' },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AiChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed.slice(-30));
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  }, [messages, hydrated]);

  useEffect(() => {
    if (open) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, loading, open]);

  const executeAppAction = (action: AppAction) => {
    if (action.type === 'navigateTo') {
      router.push(destinationRoutes[action.destination]);
      return;
    }
    if (action.type === 'openAsset') {
      router.push(`/assets/${action.symbol}`);
      return;
    }

    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent(APP_ACTION_EVENT, { detail: action }));
    } else {
      sessionStorage.setItem(APP_ACTION_STORAGE_KEY, JSON.stringify(action));
      router.push('/');
    }
  };

  const addAssistantReply = (content: string) => {
    setMessages((current) => [...current, { id: createId(), role: 'assistant', content }]);
  };

  const requestAnswer = async (conversation: ChatMessage[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathname: window.location.pathname + window.location.search,
          messages: conversation
            .filter((message) => !message.error && message.id !== 'welcome')
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json() as { answer?: string; error?: string; action?: unknown };
      if (!response.ok || (!data.answer && !data.action)) throw new Error(data.error || '답변을 가져오지 못했어요.');
      if (data.action) {
        if (!isAllowedAppAction(data.action)) throw new Error('안전하게 실행할 수 없는 요청이에요.');
        executeAppAction(data.action);
      }
      addAssistantReply(data.answer || '요청한 기능을 실행했어요.');
    } catch (error) {
      setMessages((current) => [...current, {
        id: createId(),
        role: 'assistant',
        content: error instanceof Error ? error.message : '답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuestion = (question: string) => {
    const content = question.trim();
    if (!content || loading) return;
    const userMessage: ChatMessage = { id: createId(), role: 'user', content };
    const nextMessages = [...messages.filter((message) => !message.error), userMessage];
    setMessages(nextMessages);
    setInput('');
    setConfirmReset(false);
    const command = interpretAppCommand(content, messages);
    if (command) {
      if (command.action) executeAppAction(command.action);
      setMessages([...nextMessages, { id: createId(), role: 'assistant', content: command.reply }]);
      return;
    }
    void requestAnswer(nextMessages);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuestion(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendQuestion(input);
    }
  };

  const retry = () => {
    if (loading) return;
    const cleanMessages = messages.filter((message) => !message.error);
    if (!cleanMessages.some((message) => message.role === 'user')) return;
    setMessages(cleanMessages);
    void requestAnswer(cleanMessages);
  };

  const resetConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setConfirmReset(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="ai-chatbot" data-page={pathname}>
      {open && (
        <section className="ai-chatbot-panel" role="dialog" aria-label="InvestLab AI 챗봇">
          <header className="ai-chatbot-header">
            <span className="ai-chatbot-mark"><Bot size={19} aria-hidden="true" /></span>
            <div><strong>InvestLab AI</strong><span>프로젝트 사용과 투자 학습 도우미</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="챗봇 닫기"><X size={19} /></button>
          </header>

          <div className="ai-chatbot-tools" aria-label="빠른 기능">
            {quickActions.map((action) => <button type="button" key={action.label} onClick={() => sendQuestion(action.prompt)} disabled={loading}>{action.label}</button>)}
            <button type="button" onClick={() => setConfirmReset(true)} disabled={loading}><RotateCcw size={13} /> 초기화</button>
          </div>

          {confirmReset && (
            <div className="ai-chatbot-reset" role="alert">
              <span>대화를 처음부터 시작할까요?</span>
              <button type="button" onClick={() => setConfirmReset(false)}>취소</button>
              <button type="button" onClick={resetConversation}>초기화</button>
            </div>
          )}

          <div className="ai-chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ${message.role} ${message.error ? 'error' : ''}`}>
                <span>{message.role === 'assistant' ? 'AI' : '나'}</span>
                <div>{message.content}</div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="ai-suggestions">
                <strong><Sparkles size={14} /> 이런 질문으로 시작해보세요</strong>
                {suggestedQuestions.map((question) => <button type="button" key={question} onClick={() => sendQuestion(question)}>{question}</button>)}
              </div>
            )}
            {loading && <div className="ai-message assistant loading"><span>AI</span><div><i /><i /><i /><b className="sr-only">답변 생성 중</b></div></div>}
            {!loading && messages[messages.length - 1]?.error && <button type="button" className="ai-retry" onClick={retry}>답변 다시 생성</button>}
            <div ref={messageEndRef} />
          </div>

          <form className="ai-chatbot-input" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              placeholder="InvestLab에 대해 자유롭게 질문하세요"
              rows={1}
              aria-label="AI에게 질문 입력"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="메시지 전송"><Send size={17} /></button>
          </form>
          <p className="ai-chatbot-note">Enter 전송 · Shift+Enter 줄바꿈 · AI 답변은 학습용입니다.</p>
        </section>
      )}
      <button type="button" className="ai-chatbot-launcher" onClick={() => setOpen((current) => !current)} aria-label={open ? '챗봇 닫기' : 'AI 챗봇 열기'} aria-expanded={open}>
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span>{open ? '닫기' : 'AI 챗봇'}</span>
      </button>
    </div>
  );
}
