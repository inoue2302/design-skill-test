"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { match } from "ts-pattern";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopicCard } from "@/components/TopicCard";
import { ChatMessage } from "@/components/ChatMessage";
import { ResultCard } from "@/components/ResultCard";
import { ProgressBar } from "@/components/ProgressBar";
import { chatAction } from "@/app/actions/chat";
import { evaluateAction } from "@/app/actions/evaluate";
import { getRandomTestCondition } from "@/lib/random";
import type {
  TestPhase,
  Topic,
  Constraint,
  ChatMessage as ChatMessageType,
  EvaluationResult,
  AnswerMeta,
} from "@/types";
import { buildInitialGreeting } from "@/lib/system-prompt";

const TOTAL_QUESTIONS = 5;
const TIMER_PROMPT_MS = 3 * 60 * 1000; // 3分

export default function TestPage() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [answerMetas, setAnswerMetas] = useState<AnswerMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const questionStartTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // チャット末尾へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 回答タイマー（3分で促し）
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `timer-${Date.now()}`,
          role: "assistant",
          content:
            "考え中ですか？途中まででもいいので、今の時点の考えを聞かせてください 🙂",
        },
      ]);
    }, TIMER_PROMPT_MS);
  }, []);

  // テスト開始
  const handleStart = useCallback(() => {
    const { topic: newTopic, constraint: newConstraint } =
      getRandomTestCondition();
    setTopic(newTopic);
    setConstraint(newConstraint);
    setPhase("topic");
  }, []);

  // お題確認 → 対話開始
  const handleBeginChat = useCallback(() => {
    if (!topic || !constraint) return;

    const greeting = buildInitialGreeting(topic, constraint);
    const greetingMessage: ChatMessageType = {
      id: `msg-greeting`,
      role: "assistant",
      content: greeting,
    };

    setMessages([greetingMessage]);
    setQuestionIndex(0);
    setPhase("chatting");
    questionStartTime.current = Date.now();
    resetTimer();
  }, [topic, constraint, resetTimer]);

  // メッセージ送信
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !topic || !constraint) return;

    const responseTimeMs = Date.now() - questionStartTime.current;
    const userMessage: ChatMessageType = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    const meta: AnswerMeta = {
      questionIndex,
      responseTimeMs,
    };
    const newMetas = [...answerMetas, meta];
    setAnswerMetas(newMetas);

    const response = await chatAction({
      messages: newMessages,
      topic,
      constraint,
      questionIndex,
      answerMeta: meta,
    });

    if (!response.success) {
      setError(response.error);
      setIsLoading(false);
      return;
    }

    const updatedMessages = [...newMessages, response.message];
    setMessages(updatedMessages);

    // 「評価をまとめます」的な内容で最終フェーズ判定
    const isLastQuestion =
      response.message.content.includes("評価をまとめます") ||
      response.message.content.includes("お疲れさまでした");

    if (isLastQuestion && questionIndex >= TOTAL_QUESTIONS - 1) {
      setPhase("evaluating");
      setIsLoading(true);

      const evalResponse = await evaluateAction({
        messages: updatedMessages,
        topic,
        constraint,
        answerMetas: newMetas,
      });

      if (evalResponse.success) {
        setResult(evalResponse.result);
        setPhase("result");
      } else {
        setError(evalResponse.error);
        setPhase("chatting");
      }
      setIsLoading(false);
      return;
    }

    // 次の質問フェーズに進んだか検知
    if (response.message.content.includes("次の話題")) {
      setQuestionIndex((prev) => Math.min(prev + 1, TOTAL_QUESTIONS - 1));
    }

    questionStartTime.current = Date.now();
    resetTimer();
    setIsLoading(false);
  }, [
    input,
    isLoading,
    topic,
    constraint,
    messages,
    questionIndex,
    answerMetas,
    resetTimer,
  ]);

  // リトライ
  const handleRetry = useCallback(() => {
    setPhase("idle");
    setMessages([]);
    setResult(null);
    setQuestionIndex(0);
    setAnswerMetas([]);
    setError(null);
    setTopic(null);
    setConstraint(null);
  }, []);

  // Ctrl+Enter で送信
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {match(phase)
          .with("idle", () => (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 animate-fade-in">
              <h1 className="text-3xl font-bold">設計力テスト</h1>
              <p className="text-text-sub text-center">
                ランダムなお題と条件が出題されます。
                <br />
                5問の対話であなたの設計力を診断します。
              </p>
              <Button onClick={handleStart} size="lg">
                テスト開始
              </Button>
            </div>
          ))
          .with("topic", () =>
            topic && constraint ? (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-bold text-center">
                  今回のお題はこちら！
                </h2>
                <TopicCard topic={topic} constraint={constraint} />
                <div className="flex justify-center">
                  <Button onClick={handleBeginChat} size="lg">
                    この条件で挑戦する
                  </Button>
                </div>
              </div>
            ) : null
          )
          .with("chatting", () => (
            <div className="flex flex-col h-[calc(100vh-4rem)]">
              {/* プログレス */}
              <div className="flex justify-center py-4">
                <ProgressBar
                  currentQuestion={questionIndex}
                  totalQuestions={TOTAL_QUESTIONS}
                />
              </div>

              {/* メッセージ一覧 */}
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                      EM
                    </div>
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                      <Loader2 className="size-4 animate-spin text-text-sub" />
                    </div>
                  </div>
                )}
                {error && (
                  <Card className="border-warning/30 bg-warning-light">
                    <CardContent className="py-3">
                      <p className="text-sm text-warning">{error}</p>
                    </CardContent>
                  </Card>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 入力フォーム */}
              <div className="border-t border-border bg-surface p-4">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="設計の考えを入力してください..."
                    rows={3}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="self-end"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-text-sub">
                  Ctrl + Enter で送信
                </p>
              </div>
            </div>
          ))
          .with("evaluating", () => (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 animate-fade-in">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-text-sub">評価を作成中...</p>
              <p className="text-xs text-text-sub">
                回答内容を分析しています。少々お待ちください。
              </p>
            </div>
          ))
          .with("result", () =>
            result ? (
              <ResultCard result={result} onRetry={handleRetry} />
            ) : null
          )
          .exhaustive()}
      </div>
    </main>
  );
}
