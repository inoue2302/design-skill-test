"use server";

import Anthropic from "@anthropic-ai/sdk";
import { searchEvaluationKnowledge } from "@/lib/vector-store";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  Topic,
  Constraint,
  ChatMessage,
  EvaluateResponse,
  EvaluationResult,
  EvaluationRank,
  EvaluationScores,
  AnswerMeta,
} from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

type EvaluateActionInput = {
  messages: ChatMessage[];
  topic: Topic;
  constraint: Constraint;
  answerMetas: AnswerMeta[];
};

function determineRank(score: number): EvaluationRank {
  if (score >= 85) return "チーフアーキテクト";
  if (score >= 70) return "リードアーキテクト";
  if (score >= 50) return "シニア設計者";
  if (score >= 30) return "ミドル設計者";
  return "ジュニア設計者";
}

const isEvaluationScores = (data: unknown): data is EvaluationScores =>
  typeof data === "object" &&
  data !== null &&
  "stackSelection" in data &&
  "architecture" in data &&
  "dataDesign" in data &&
  "nonFunctional" in data &&
  "operationCost" in data;

const isEvaluationJson = (
  data: unknown
): data is {
  scores: EvaluationScores;
  comment: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
} =>
  typeof data === "object" &&
  data !== null &&
  "scores" in data &&
  "comment" in data &&
  "strengths" in data &&
  "improvements" in data &&
  "modelAnswer" in data &&
  isEvaluationScores((data as Record<string, unknown>).scores);

export async function evaluateAction(
  input: EvaluateActionInput
): Promise<EvaluateResponse> {
  try {
    const rateLimitResult = await checkRateLimit();
    if (!rateLimitResult.allowed) {
      return { success: false, error: rateLimitResult.message };
    }

    // RAG: お題・条件に合った評価基準を検索
    const ragQuery = `${input.topic.category} ${input.topic.title} ${input.constraint.company} ${input.constraint.budget}`;
    const knowledgeResults = await searchEvaluationKnowledge(ragQuery, 3);
    const knowledgeContext = knowledgeResults
      .map((r) => r.content)
      .join("\n\n---\n\n");

    // 会話履歴をテキスト化
    const conversationText = input.messages
      .map((msg) => `[${msg.role === "assistant" ? "EM" : "受験者"}]: ${msg.content}`)
      .join("\n\n");

    // 回答時間の情報
    const timeInfo = input.answerMetas
      .map((m) => `Q${m.questionIndex + 1}: ${Math.round(m.responseTimeMs / 1000)}秒`)
      .join(", ");

    const evaluationPrompt = `あなたはエンジニアの設計力を評価する専門家です。
以下の対話内容を分析し、設計力を評価してください。

## お題
- カテゴリ: ${input.topic.category}
- タイトル: ${input.topic.title}
- 詳細: ${input.topic.description}

## 現場条件
- チーム: ${input.constraint.teamSize}
- 組織: ${input.constraint.company}
- 納期: ${input.constraint.deadline}
- 予算: ${input.constraint.budget}
${input.constraint.extra ? `- 追加制約: ${input.constraint.extra}` : ""}

## 回答時間
${timeInfo || "計測データなし"}

${knowledgeContext ? `## 評価基準（参考ナレッジ）\n${knowledgeContext}\n` : ""}

## 対話内容
${conversationText}

## 評価指示

以下の5軸で0〜100点で評価し、JSON形式で返してください。
お題と条件に応じた評価をすること（スタートアップ×短納期なら割り切り判断を高評価、大企業×長期なら設計の深さを重視）。

必ず以下のJSON形式のみを返してください。JSON以外のテキストは含めないでください。

{
  "scores": {
    "stackSelection": <0-100>,
    "architecture": <0-100>,
    "dataDesign": <0-100>,
    "nonFunctional": <0-100>,
    "operationCost": <0-100>
  },
  "comment": "総合フィードバック（カリスマEMの口調で。3〜5文）",
  "strengths": ["良かった点1", "良かった点2", "良かった点3"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "modelAnswer": "この条件での模範的な設計アプローチの概要（5〜10文で具体的に）"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: evaluationPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "評価の生成に失敗しました。もう一度お試しください。",
      };
    }

    // JSONパース
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: "評価結果の解析に失敗しました。もう一度お試しください。",
      };
    }

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!isEvaluationJson(parsed)) {
      return {
        success: false,
        error: "評価結果のフォーマットが不正です。もう一度お試しください。",
      };
    }

    const { scores } = parsed;
    const totalScore = Math.round(
      (scores.stackSelection +
        scores.architecture +
        scores.dataDesign +
        scores.nonFunctional +
        scores.operationCost) /
        5
    );

    const result: EvaluationResult = {
      totalScore,
      rank: determineRank(totalScore),
      scores: parsed.scores,
      comment: parsed.comment,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      modelAnswer: parsed.modelAnswer,
    };

    return { success: true, result };
  } catch {
    return {
      success: false,
      error: "すみません、評価中にエラーが発生しました。もう一度試してもらえますか？",
    };
  }
}
