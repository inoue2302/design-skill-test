// ─── お題 ───
export type TopicCategory = "web" | "api" | "infra" | "data" | "mobile";

export type Topic = {
  id: string;
  category: TopicCategory;
  title: string;
  description: string;
};

// ─── 現場条件 ───
export type Constraint = {
  id: string;
  teamSize: string;
  company: string;
  deadline: string;
  budget: string;
  extra?: string;
};

// ─── テスト画面状態 ───
export type TestPhase =
  | "idle"
  | "topic"
  | "chatting"
  | "evaluating"
  | "result";

// ─── チャット ───
export type MessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
};

// ─── 回答メタ ───
export type AnswerMeta = {
  questionIndex: number;
  responseTimeMs: number;
};

// ─── 評価結果 ───
export type EvaluationScores = {
  stackSelection: number;
  architecture: number;
  dataDesign: number;
  nonFunctional: number;
  operationCost: number;
};

export type EvaluationRank =
  | "ジュニア設計者"
  | "ミドル設計者"
  | "シニア設計者"
  | "リードアーキテクト"
  | "チーフアーキテクト";

export type EvaluationResult = {
  totalScore: number;
  rank: EvaluationRank;
  scores: EvaluationScores;
  comment: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
};

// ─── Server Action レスポンス ───
export type ChatResponse =
  | { success: true; message: ChatMessage; questionIndex: number }
  | { success: false; error: string };

export type EvaluateResponse =
  | { success: true; result: EvaluationResult }
  | { success: false; error: string };

// ─── Type Guards ───
export const isChatResponse = (data: unknown): data is ChatResponse =>
  typeof data === "object" &&
  data !== null &&
  "success" in data &&
  typeof (data as Record<string, unknown>).success === "boolean";

export const isTopic = (data: unknown): data is Topic =>
  typeof data === "object" &&
  data !== null &&
  "id" in data &&
  "category" in data &&
  "title" in data &&
  "description" in data;

export const isConstraint = (data: unknown): data is Constraint =>
  typeof data === "object" &&
  data !== null &&
  "id" in data &&
  "teamSize" in data &&
  "company" in data &&
  "deadline" in data &&
  "budget" in data;

// ─── カテゴリ表示名マッピング ───
export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  web: "Web アプリ",
  api: "API / バックエンド",
  infra: "インフラ / DevOps",
  data: "データ",
  mobile: "モバイル",
};
