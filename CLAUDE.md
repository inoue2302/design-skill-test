# CLAUDE.md — エンジニア設計力テスト

## プロジェクト概要

イケてるベンチャーのVPoP（VP of Product）風キャラが、ランダムなお題・現場条件・納期を提示し、
エンジニアの「設計力」を5問の対話で診断するWebアプリ。
やさしげな物腰の裏で、Whyを徹底的に突いてくる。

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui + Tailwind CSS v4
- **AI**: Anthropic API (Claude) — Server Actions 経由
- **RAG**: LangChain + Upstash Vector（評価時のみ使用）
- **Rate Limit**: Upstash Redis
- **Deploy**: Vercel

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint 実行
npm run seed     # ナレッジ → Vector DB 投入
```

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # トップページ
│   ├── test/page.tsx           # テスト画面（対話UI）
│   └── actions/
│       ├── chat.ts             # 対話 Server Action
│       └── evaluate.ts         # 評価 Server Action（RAG使用）
├── components/
│   ├── ui/                     # shadcn/ui
│   ├── TopicCard.tsx           # お題＆条件表示
│   ├── ChatMessage.tsx         # チャットメッセージ
│   └── ResultCard.tsx          # 評価結果表示
├── data/
│   ├── topics.json             # お題100問
│   ├── constraints.json        # 条件パターン
│   └── knowledge/
│       └── evaluation/         # RAG用ナレッジ（評価基準のみ）
├── lib/
│   ├── system-prompt.ts        # AIシステムプロンプト
│   ├── rate-limit.ts           # レート制限（Upstash Redis）
│   ├── random.ts               # お題・条件のランダム抽出
│   └── vector-store.ts         # Upstash Vector 接続
├── scripts/
│   └── seed.ts                 # ナレッジ → Vector DB 投入
└── types/
    └── index.ts                # 型定義
```

## コーディング規約

### TypeScript

- **strict mode 必須** — `any` 禁止、型推論に頼りすぎない
- **型アサーション (`as Type`) 完全禁止** — type guard 関数（`value is T`）で型を絞り込む。`as const` は OK
- Props・状態・APIレスポンスには必ず **型定義（type / interface）** を書く
- 外部データ（JSON.parse / API レスポンス等）は type guard で検証してから使用する
- 型定義は `src/types/` に集約するか、コンポーネントと同ファイルに colocate
- Union 型やリテラル型を活用し、不正な状態を型レベルで排除する
- **`for` 文は原則禁止** — `map` / `filter` / `reduce` 等の宣言的メソッドを使う
- `ts-pattern` の `match` を活用し、switch/if の分岐を宣言的に書く

```typescript
// Good: 状態を型で制約
type TestPhase = "idle" | "topic" | "chatting" | "evaluating" | "result";

// Good: type guard で安全に型を絞る
const isChatResponse = (data: unknown): data is ChatResponse =>
  typeof data === "object" &&
  data !== null &&
  "success" in data &&
  typeof (data as Record<string, unknown>).success === "boolean";

// Good: ts-pattern で宣言的に分岐
match(phase)
  .with("idle", () => <StartScreen />)
  .with("topic", () => <TopicCard topic={topic} constraint={constraint} />)
  .with("chatting", () => <ChatView messages={messages} />)
  .with("evaluating", () => <LoadingScreen />)
  .with("result", () => <ResultCard result={result} />)
  .exhaustive();
```

### コンポーネント設計

- **宣言的に実装する** — 命令的な DOM 操作を避け、状態駆動で UI を表現
- **shadcn/ui をベースにカスタマイズ** — 車輪の再発明をしない
- Server Components をデフォルトとし、`"use client"` は必要最小限に
- コンポーネントは単一責任、Props は明示的に型定義
- 状態遷移は Union 型 + `match` で網羅的に処理する

```typescript
// Good: 宣言的な UI 表現
{messages.map((msg) => (
  <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
))}

// Good: 条件付きレンダリングも宣言的に
<Button disabled={phase !== "idle"} onClick={handleStart}>
  テスト開始
</Button>
```

### スタイリング

- **Tailwind CSS v4** を使用（`@import "tailwindcss"` 形式）
- カスタムアニメーション・CSS変数は `globals.css` に定義
- インラインスタイルは動的な値（JS計算値）のみ許可
- shadcn/ui の `cn()` ユーティリティで条件付きクラス結合

### Server Actions / API

- API キーはサーバーサイドのみ — クライアントに絶対露出させない
- Server Actions (`"use server"`) 経由で Anthropic API を呼び出す
- エラーハンドリングは必ず行い、VPoPの口調でメッセージを返す
- 会話状態はクライアント側（useState）で保持、DB 不要
- 回答タイマーのメタデータ（responseTimeMs）も Server Action に送信する

### 回答タイマー（内部制御）

- フロントエンドで各質問の回答時間を計測する
- ユーザーにはタイマーを表示しない
- 一定時間（3分）経過でAI側から回答を促す
- 回答時間は評価の参考値として記録する（長考自体は減点しない）

### Git / ブランチ運用

- ブランチ名: `feature/issue-{番号}-{概要}`
- コミットメッセージ: `feat:` / `fix:` / `chore:` prefix
- PR は Issue に紐づけ、`Closes #N` で自動クローズ

## 注意事項

- **課金防止**: Upstash 無料枠内で運用。追加課金が発生しない設計を厳守
- **プライバシー**: ユーザーの回答は保存しない（セッション内のみ）
- **RAG は評価時のみ**: お題・条件はJSONから静的に取得。ベクトル検索は最終評価でのみ使用
