---
name: review
description: マルチエージェント構成でPRのコードレビューを実施する
argument-hint: [PR-number or URL]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(gh *), Bash(git *)
---

# /review コマンド

指定されたPRに対して、マルチエージェント構成でコードレビューを実施します。

## 入力

- `$ARGUMENTS`: PR番号 または PR URL

## 手順

### 1. PR情報と差分の取得

```bash
gh pr view $ARGUMENTS --json number,title,body,baseRefName,headRefName
gh pr diff $ARGUMENTS
```

上記コマンドでPR情報と差分を取得してください。

### 2. サブエージェントによるレビュー実行

取得した diff を以下の6つのサブエージェント（`.claude/agents/` に定義）にそれぞれ渡して並列実行してください。

- **review-logic** — ロジックの正確性
- **review-naming** — 命名規則・可読性
- **review-performance** — パフォーマンス
- **review-security** — セキュリティ
- **review-errorhandling** — エラーハンドリング
- **review-testing** — テストの網羅性

各サブエージェントに diff 全文を渡し、JSON形式の結果を受け取ってください。
Task ツールを使って6つのサブエージェントを並列で起動してください。

### 3. 結果の集約と整形

各サブエージェントから返却されたJSONを以下の手順で処理してください:

1. 各JSONの `findings` 配列を1つに統合
2. **重複排除**: 同一ファイル・同一行（±3行以内）で類似の指摘内容があれば1つにまとめる
3. **severity順に並び替え**: `must` → `imo` → `nits`
4. 指摘が0件の場合は「指摘事項はありません」と報告して終了

### 4. GitHub PRへのレビューコメント投稿

`gh api` を使ってインラインコメント付きレビューを投稿してください。

#### position の算出方法

diff のハンク内での相対行番号（1始まり）を使用します。
`@@ -a,b +c,d @@` の直後の行が position=1 です。

#### 投稿コマンド例

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  -X POST \
  --input - <<EOF
{
  "body": "## コードレビュー結果\n\n| severity | 件数 |\n|----------|------|\n| must | X件 |\n| imo | Y件 |\n| nits | Z件 |",
  "event": "COMMENT",
  "comments": [
    {
      "path": "src/example.ts",
      "position": 10,
      "body": "![must](https://img.shields.io/badge/review-must-red.svg)\n\n**[must/logic]** 指摘内容\n\n💡 改善提案"
    }
  ]
}
EOF
```

#### コメントのフォーマット

各インラインコメントの先頭に shields.io のバッジを付け、以下の形式にしてください:

**must の場合:**
```
![must](https://img.shields.io/badge/review-must-red.svg)

**[must/{category}]** {message}

💡 {suggestion}
```

**imo の場合:**
```
![imo](https://img.shields.io/badge/review-imo-orange.svg)

**[imo/{category}]** {message}

💡 {suggestion}
```

**nits の場合:**
```
![nits](https://img.shields.io/badge/review-nits-green.svg)

**[nits/{category}]** {message}

💡 {suggestion}
```

- suggestion がない場合は💡行を省略

#### event の選択

- must が1件以上: `REQUEST_CHANGES`
- must が0件: `COMMENT`

### 5. 結果サマリーの表示

ターミナルに以下のサマリーを表示してください:

```
## レビュー完了

PR: #{number} {title}

| severity | 件数 |
|----------|------|
| must     | X件  |
| imo      | Y件  |
| nits     | Z件  |

{must がある場合}
⚠️ must な指摘があるため REQUEST_CHANGES としてレビューしました。

{must がない場合}
✅ must な指摘はありません。COMMENT としてレビューしました。
```

## 注意事項

- 既存のレビューコメントと重複しないよう確認してください
- サブエージェントの結果がJSONとしてパースできない場合はスキップしてください
- diff が空の場合は「差分がありません」と報告して終了してください
- 日本語でコメントしてください
- 良い実装には褒めるコメントも残してください（severity は nits として扱う）
