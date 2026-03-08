import Link from "next/link";
import { ArrowRight, Brain, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    icon: Brain,
    title: "お題 & 条件を確認",
    description: "ランダムに出題されるお題と現場条件を把握します",
  },
  {
    icon: MessageSquare,
    title: "5問の対話で設計判断",
    description: "技術選定からコスト設計まで、Whyを突いた質問に回答します",
  },
  {
    icon: BarChart3,
    title: "設計力スコアを確認",
    description: "5軸のスコアと詳細フィードバックで自分の設計力を知ります",
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-10 animate-fade-in">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
            <Brain className="size-4" />
            エンジニア設計力診断
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            あなたの
            <span className="text-primary">設計力</span>、
            <br className="sm:hidden" />
            測ってみませんか？
          </h1>
          <p className="text-text-sub text-lg leading-relaxed max-w-lg mx-auto">
            ランダムなお題・現場条件・納期に対して設計判断を回答。
            <br />
            AIが5問の対話で深掘りし、設計力スコアを算出します。
          </p>
        </section>

        {/* VPoP 導入メッセージ */}
        <Card className="border-primary/20 bg-primary-light/30">
          <CardHeader className="pb-3">
            <CardDescription className="text-primary font-medium">
              カリスマEMからのメッセージ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text leading-relaxed">
              「はじめまして！今日はカジュアルに設計の話しましょ〜。
              <br />
              正解はないので、気楽にいきましょう。
              <br />
              ……ただ、<span className="font-semibold text-primary">Why</span>{" "}
              は徹底的に聞きますけどね」
            </p>
          </CardContent>
        </Card>

        {/* ステップ説明 */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-center">テストの流れ</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Card key={step.title} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-white text-xs font-bold">
                      {i + 1}
                    </span>
                    <step.icon className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-sub">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex justify-center">
          <Button asChild size="lg" className="gap-2 text-base">
            <Link href="/test">
              テスト開始
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>

        {/* 注意書き */}
        <p className="text-center text-xs text-text-sub">
          所要時間：約10〜15分 ｜ 回答はサーバーに保存されません
        </p>
      </div>
    </main>
  );
}
