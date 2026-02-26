---
title: "entire.io — AI の思考プロセスを git に記録する時代"
description: "元 GitHub CEO が創った entire.io の仕組みと、AI Review ツールとの組み合わせが変えるコードレビューの未来について、社内登壇の内容をベースに紹介します。"
date: "2026-02-26"
tags: ["AI", "entire.io", "コードレビュー"]
image: "/images/blog/entire-io-and-ai-review-future/ogp.jpg"
---

こんにちは、わさびーふです。

普段から Claude Code や Devin に PR を書かせて AI Review ツールにレビューさせる、という流れを試しているのですが、「AI が書いたコードを AI がレビューしているのに、なぜ表面的な指摘しか出ないのか」がずっと気になっていました。

## entire.io とは

AI エージェントの「思考プロセス」を git に記録する開発者プラットフォームです。

- **創業者**: Thomas Dohmke（元 GitHub CEO）
- **資金調達**: Seed $60M（評価額 $300M）
- **発表日**: 2026 年 2 月 10 日
- **GitHub Stars**: 3,000+

git は人間がコードを書く時代に設計されました。コミット履歴には「何を変えたか」は残りますが、AI エージェントが「なぜそう書いたか」は残りません。entire.io はこのギャップを埋めるツールです。

## AI Review ツールの現状と共通課題

まず、現在の AI Review ツールの状況を整理します。

| ツール | 仕組み | 速度 |
|--------|--------|------|
| Greptile | コードベースをグラフ化 + Vector Embedding で意味検索 | 約 3 分 |
| Devin Review | 論理的な変更グルーピング + インタラクティブチャット | 5-10 分 |
| Copilot Review | Agentic Tool Calling + CodeQL/ESLint 統合 | 約 30 秒 |

3 ツールに共通する課題があります。

**入力が diff + コードベースに限定されていて、AI がコードを書いた「理由」にアクセスできない**ということです。

レビューする側の AI も、diff という「最終結果」だけを見ているので、表面的な指摘に留まりがちです。実際にチームで使っていても「それはわかってるけど、なぜそう書いたかを見てほしい」と感じることが多いです。

## entire.io で何が変わるか

現状の AI Review は「最終コード」しか見えません。entire.io を導入すると「なぜ」が見えるようになります。

### 現状

```
git diff（最終的なコード変更）← これだけ

❌ 誰が書いたか  ❌ 何を頼んだか  ❌ 途中の試行錯誤
```

### entire.io 導入後

| 保存ファイル | 見えるようになること |
|---|---|
| `prompt.txt` | **何を頼んだか** — 元の指示内容 |
| `full.jsonl` | **AI がどう考えたか** — 推論・試行錯誤の全記録 |
| `metadata.json` | **AI が何% 書いたか** — attribution（人間 vs AI の比率） |
| `context.md` | **どんな文脈で作業したか** — セッションの背景 |

この 4 ファイルは git orphan branch（`entire/checkpoints/v1`）に記録されるため、通常の履歴を汚さず、Review ツールが参照可能な形で永続化されます。

## Entire CLI の基本

### 主要コマンド

```bash
$ entire enable    # 既存リポジトリへシームレス統合
$ entire rewind    # 任意のチェックポイントへ瞬時に非破壊復元
$ entire explain   # AI による文脈解説
```

### チェックポイント戦略

| 戦略 | トリガー | 推奨用途 |
|------|----------|----------|
| `manual-commit` | git commit 時 | main ブランチで安全に運用 |
| `auto-commit` | エージェント応答ごと | feature ブランチ推奨 |

対応エージェントは Claude Code、Gemini CLI、OpenCode の 3 つです。Codex は対応予定。

## チェックポイントの構造

チェックポイントは git orphan branch 上でシャーディング（256 バケット）により格納されます。

```
entire/checkpoints/v1 branch:

<id[:2]>/<id[2:]>/                    ← 12文字 hex ID の先頭2文字でシャード
│
├── metadata.json                     ← 集約統計
│
├── 0/                                ← セッション 0
│   ├── metadata.json                    セッションメタデータ
│   ├── full.jsonl                       完全な会話履歴
│   ├── context.md                       セッションコンテキスト
│   ├── prompt.txt                       プロンプト一覧
│   └── content_hash.txt                 コンテンツハッシュ
│
├── 1/                                ← セッション 1（並行セッション時）
└── 2/                                ← セッション 2 ...
```

### metadata.json の中身

```json
{
  "cli_version": "0.4.7",
  "checkpoint_id": "a3b2c4d5e6f7",
  "strategy": "manual-commit",
  "agent": "Claude Code",
  "files_touched": ["auth.go", "auth_test.go"],

  "token_usage": {
    "input_tokens": 5000,
    "output_tokens": 2000,
    "cache_read_tokens": 3000,
    "api_call_count": 10
  },

  "summary": {
    "intent": "JWT 認証バグの修正",
    "outcome": "期限切れトークンのバリデーション修正",
    "friction": ["テストデータの不整合"],
    "open_items": ["リフレッシュトークンの検討"]
  },

  "initial_attribution": {
    "agent_lines": 146,
    "human_added": 30,
    "agent_percentage": 73.0
  }
}
```

token_usage でセッション単位のコスト算出、summary で AI 生成のセッション要約、initial_attribution で行レベルの帰属情報が得られます。

### コミットに刻まれる帰属情報

entire.io は git commit メッセージにもメタデータを埋め込みます。

```
commit 8a3f2b1e...
Author: developer <dev@example.com>

    fix: JWT トークン期限切れ時の認証バイパスを修正

    Entire-Checkpoint: a3b2c4d5e6f7          ← セッション記録へのリンク
    Entire-Attribution: 73% agent (146/200)   ← AI/人間の貢献比率
```

これにより、AI 比率が高いコミットはセッション記録を重点レビュー、人間比率が高いコミットは従来の diff レビューで十分、という使い分けが可能になります。

## 各 AI Review ツール × entire.io のシナジー

4 ファイルが各ツールの精度をどう変えるかを考えてみます。

- **Greptile** — `full.jsonl` で AI がどの順序で依存を辿ったかをグラフに補完。到達不能な暗黙的依存も検出可能に
- **Devin Review** — AI-to-AI で「生成時の推論」を参照したレビュー。表面的な diff 指摘から意図レベルの深いレビューへ
- **Copilot Review** — コミットトレーラーの Checkpoint ID からセッションへ直接遷移。GitHub ネイティブで「コードの背景」まで一気通貫

### チームレビューへの波及効果

- 「AI の使い方」自体をレビューできるようになる（プロンプトの品質管理）
- 効果的な AI 活用パターンをチーム内で共有・標準化できる
- 「AI が書いたから分からない」というブラックボックス問題を解消する

## コードオーナーシップの再定義

AI が 73% 書いたコードの「オーナー」は誰でしょうか。

従来は「コードを書いた人 = オーナー = 責任者」でシンプルでした。AI 時代ではそう簡単にはいきません。entire.io の Attribution とセッション記録があることで「責任の分解」が可能になります。

| 責任レイヤー | 担当 | entire.io の証跡 |
|---|---|---|
| 意図の責任 | プロンプト作成者 | prompt.txt |
| 推論の妥当性 | AI + レビュアー | full.jsonl |
| 実装の品質 | AI + レビュアー | full.jsonl + diff |
| 最終承認 | レビュアー | PR approve + session |
| 運用責任 | チーム全体 | Attribution トレンド |

バグが発生したとき、「プロンプトが曖昧だったのか」「AI の推論が誤ったのか」「レビューで見落としたのか」をセッション記録から特定できます。entire.io なしでは「AI が書いたから分からない」で終わりますが、entire.io ありでは「Prompt 3 の指示が曖昧で AI が誤解した」と特定できるわけです。

## AI 開発コストの可視化

metadata.json の token_usage を集計すれば、AI 開発コストが初めて「測れる」ようになります。

| 分析観点 | 具体例 |
|---|---|
| 機能あたりコスト | 「認証機能 = $12.30 / 決済機能 = $45」 |
| 開発者あたりコスト | 「A さん $80/月 / B さん $320/月」 |
| PR あたりコスト | 「PR #142 = $3.20（8 セッション）」 |
| rewind 率 | 「30% の rewind = プロンプト改善余地」 |
| cache 効率 | 「cache_read 80% = コンテキスト設計◎」 |

AI 開発は「速さ」だけで語られてきましたが、entire.io によって「コスト効率」で語れるようになります。

## 歴史的文脈: git → GitHub → entire.io

コラボレーション基盤は段階的に進化してきました。

| 年 | プロダクト | 何を変えたか |
|---|---|---|
| 2005 | git | 人間の変更を追跡（ファイル差分、コミット履歴） |
| 2008 | GitHub | 人間同士のレビュー文化を確立（PR、Issue） |
| 2026 | entire.io | 人間と AI のコラボレーションを記録 |

3 つの共通パターンがあります。

1. **暗黙のプロセスを明示化する** — git: FTP 上書きから変更追跡へ。GitHub: メールからレビュー文化へ。entire.io: ブラックボックスから推論記録へ
2. **メタデータが本体より価値を持つ** — git: diff より commit message。GitHub: コードより PR ディスカッション。entire.io: 生成コードよりセッション記録
3. **新しいレビュー文化を生む** — git: 変更前後の比較。GitHub: LGTM 文化。entire.io: プロンプトレビュー・推論監査

## 現状と展望

### 現状の課題

- AI Review ツールがチェックポイントを読み込む統合レイヤーが未実装
- データは専用ブランチに保存されるが、外部ツールが参照する API/MCP がない
- GitHub Issue で MCP server endpoint が提案されているが未着手

### 展望

- 開発スピードが非常に速い — 統合レイヤーの実装が次の転換点になりそうです
- 元 GitHub CEO のネットワークで AI Review ツールとの連携に期待しています
- 「記録」から「活用」フェーズへの移行が始まれば一気に価値が出ると思います

## まとめ

「AI Agent のコードレビューだけで終わらせたい」には 3 つのステップが必要です。

1. **AI の思考プロセスが記録される** ← entire.io が実現中
2. **Review ツールがその記録を参照する** ← これから（未実装）
3. **人間はレビュー結果を承認するだけ** ← いつかは

現状は 1 が動いていて、2 と 3 はまだありません。でも 1 がなければ 2 も 3 も始まりません。

「いつかは」の最初の一歩は、AI の思考を記録すること。entire.io がその基盤になる可能性を感じています。

おしまい

- [GitHub entireio/cli](https://github.com/entireio/cli)
- [entire.io](https://entire.io)
