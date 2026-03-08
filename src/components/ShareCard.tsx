"use client";

import { forwardRef } from "react";
import { Trophy } from "lucide-react";
import { match } from "ts-pattern";
import type { EvaluationResult, EvaluationRank } from "@/types";

type ShareCardProps = {
  result: EvaluationResult;
};

const SCORE_LABELS = [
  { key: "stackSelection", label: "技術選定力" },
  { key: "architecture", label: "設計力" },
  { key: "dataDesign", label: "データ設計" },
  { key: "nonFunctional", label: "非機能要件" },
  { key: "operationCost", label: "運用・コスト" },
] as const;

function getRankColor(rank: EvaluationRank): string {
  return match(rank)
    .with("チーフアーキテクト", () => "#F59E0B")
    .with("リードアーキテクト", () => "#6366F1")
    .with("シニア設計者", () => "#10B981")
    .with("ミドル設計者", () => "#0EA5E9")
    .with("ジュニア設計者", () => "#78716C")
    .exhaustive();
}

function getScoreBarColor(score: number): string {
  if (score >= 85) return "#F59E0B";
  if (score >= 70) return "#6366F1";
  if (score >= 50) return "#10B981";
  if (score >= 30) return "#0EA5E9";
  return "#78716C";
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ result }, ref) => {
    const rankColor = getRankColor(result.rank);

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          padding: 40,
          background: "linear-gradient(135deg, #FAFAF9 0%, #EEF2FF 100%)",
          fontFamily: '"Noto Sans JP", system-ui, sans-serif',
          position: "absolute",
          left: -9999,
          top: -9999,
        }}
      >
        {/* ヘッダー */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 14,
              color: "#6366F1",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            エンジニア設計力テスト
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#6366F1",
              lineHeight: 1,
            }}
          >
            {result.totalScore}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: rankColor,
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Trophy size={24} color={rankColor} />
            {result.rank}
          </div>
        </div>

        {/* スコアバー */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E7E5E4",
          }}
        >
          {SCORE_LABELS.map(({ key, label }) => {
            const score = result.scores[key];
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#1C1917" }}>
                    {label}
                  </span>
                  <span style={{ color: "#78716C" }}>{score}/100</span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: "#E7E5E4",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${score}%`,
                      borderRadius: 5,
                      background: getScoreBarColor(score),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 12,
            color: "#78716C",
          }}
        >
          設計力テスト by カリスマEM
        </div>
      </div>
    );
  }
);
ShareCard.displayName = "ShareCard";
