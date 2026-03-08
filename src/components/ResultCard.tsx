"use client";

import { useRef, useState, useCallback } from "react";
import { match } from "ts-pattern";
import html2canvas from "html2canvas-pro";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Download,
} from "lucide-react";
import { ShareCard } from "@/components/ShareCard";
import type { EvaluationResult, EvaluationRank } from "@/types";

type ResultCardProps = {
  result: EvaluationResult;
  onRetry: () => void;
};

const SCORE_LABELS = [
  { key: "stackSelection", label: "技術選定力" },
  { key: "architecture", label: "設計力" },
  { key: "dataDesign", label: "データ設計力" },
  { key: "nonFunctional", label: "非機能要件" },
  { key: "operationCost", label: "運用・コスト" },
] as const;

function getRankColor(rank: EvaluationRank): string {
  return match(rank)
    .with("チーフアーキテクト", () => "text-amber-500")
    .with("リードアーキテクト", () => "text-primary")
    .with("シニア設計者", () => "text-emerald-600")
    .with("ミドル設計者", () => "text-sky-600")
    .with("ジュニア設計者", () => "text-text-sub")
    .exhaustive();
}

function getScoreColor(score: number): string {
  if (score >= 85) return "bg-amber-500";
  if (score >= 70) return "bg-primary";
  if (score >= 50) return "bg-emerald-500";
  if (score >= 30) return "bg-sky-500";
  return "bg-text-sub";
}

function buildShareText(result: EvaluationResult): string {
  return `【設計力テスト結果】
スコア: ${result.totalScore}/100
ランク: ${result.rank}

技術選定力: ${result.scores.stackSelection}
設計力: ${result.scores.architecture}
データ設計: ${result.scores.dataDesign}
非機能要件: ${result.scores.nonFunctional}
運用・コスト: ${result.scores.operationCost}

#設計力テスト`;
}

export function ResultCard({ result, onRetry }: ResultCardProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = buildShareText(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const generateImage = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!shareCardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      return canvas;
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleDownloadImage = useCallback(async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `設計力テスト_${result.totalScore}点_${result.rank}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [generateImage, result]);

  const handleShareX = useCallback(async () => {
    // 画像をダウンロード
    const canvas = await generateImage();
    if (canvas) {
      const link = document.createElement("a");
      link.download = `設計力テスト_${result.totalScore}点.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    // 少し待ってからX投稿画面を開く
    setTimeout(() => {
      const text = `設計力テスト結果: ${result.totalScore}点（${result.rank}）\n\nダウンロードした画像を添付してね！\n\n#設計力テスト`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }, 500);
  }, [result, generateImage]);

  const handleNativeShare = useCallback(async () => {
    const canvas = await generateImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "設計力テスト結果.png", { type: "image/png" });
      const shareData: ShareData = {
        title: "設計力テスト結果",
        text: buildShareText(result),
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const textOnly: ShareData = {
          title: "設計力テスト結果",
          text: buildShareText(result),
        };
        await navigator.share(textOnly);
      }
    }, "image/png");
  }, [generateImage, result]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 画像生成用の非表示カード */}
      <ShareCard ref={shareCardRef} result={result} />

      {/* スコアヘッダー */}
      <Card className="text-center">
        <CardHeader>
          <CardDescription>設計力スコア</CardDescription>
          <div className="animate-count-up">
            <p className="text-7xl font-bold text-primary">
              {result.totalScore}
            </p>
          </div>
          <CardTitle className={`text-2xl ${getRankColor(result.rank)}`}>
            <Trophy className="inline size-6 mr-1 mb-1" />
            {result.rank}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 共有ボタン */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "コピーしました" : "結果をコピー"}
        </Button>
        <Button
          onClick={handleDownloadImage}
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={generating}
        >
          <Download className="size-4" />
          画像を保存
        </Button>
        <Button
          onClick={handleShareX}
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={generating}
        >
          𝕏 画像付きポスト
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            onClick={handleNativeShare}
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={generating}
          >
            <Share2 className="size-4" />
            共有
          </Button>
        )}
      </div>

      {/* 5軸スコア */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">スコア詳細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SCORE_LABELS.map(({ key, label }) => {
            const score = result.scores[key];
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-text-sub">{score}/100</span>
                </div>
                <div className="h-2.5 rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 総合コメント */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">総合フィードバック</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{result.comment}</p>
        </CardContent>
      </Card>

      {/* 良かった点 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="size-5 text-success" />
            良かった点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-success border-success/30">
                  ✓
                </Badge>
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 改善点 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="size-5 text-secondary" />
            改善点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.improvements.map((imp) => (
              <li key={imp} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-secondary border-secondary/30">
                  !
                </Badge>
                {imp}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 模範設計 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            この条件での模範設計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {result.modelAnswer}
          </p>
        </CardContent>
      </Card>

      {/* リトライ */}
      <div className="flex justify-center pb-8">
        <Button onClick={onRetry} size="lg" variant="outline" className="gap-2">
          <RotateCcw className="size-4" />
          もう一度挑戦する
        </Button>
      </div>
    </div>
  );
}
