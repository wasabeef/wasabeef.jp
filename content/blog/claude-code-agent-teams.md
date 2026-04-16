---
title: "Claude Code の Agent Teams と Codex で Cross Model Review する"
description: "Claude Code の Agent Teams 機能を使って、計画・実装・レビュー・テスト・ドキュメントの全工程を複数の AI エージェントに委譲する構成を紹介します。"
date: "2026-04-15"
tags: ["Claude Code", "AI", "開発ツール"]
image: "/images/blog/claude-code-agent-teams/agent-teams-running.png"
---

こんにちは、わさびーふです。

今回は Claude Code の [**Agent Teams**](https://code.claude.com/docs/ja/agent-teams) を使って、Opus と Codex（OpenAI）に cross-model review させる構成を紹介しようと思います。

Claude Code も Skills や Sub-Agent が追加されて作業効率はかなり上がりました。ただ、結局レビューの品質は自分が担保しないといけなくて、大きめの変更だと見落としが怖い。特に並列作業を沢山しすぎて、1 つ 1 つのレビューが雑になっていたのが正直なところです。

Agent Teams を使うと「チームで実装して」と頼むだけで、計画・実装・レビュー・テスト・ドキュメントまで複数の AI エージェントが担当してくれます。完全放置ではなく Lead が差し戻し判断やフェーズ間の調整をするので monitor は必要ですが、自分が手を動かすのは計画の承認と最終確認くらいになりました。

**⚠️ 前提**
- Agent Teams は experimental 機能。環境変数 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` が必要
- かなり個人的な好みが反映された構成なので、**あくまで参考程度に**
- Codex を使わない場合は、Codex 部分を省いて **Sonnet + Opus だけの構成**でも十分。reviewer を Opus 1 本にするだけなので始めやすいと思います
- Codex を使う場合は OpenAI の API 利用料が別途かかります
- Agent Teams 自体も teammate 数に応じて Anthropic 側の token コストが増えます。特に Phase 3 の fan-out は 5 agent 並列なのでコスト判断に注意

![Agent Teams 実行中の様子](/images/blog/claude-code-agent-teams/agent-teams-running.png)

## Agent Teams とは

Claude Code の [Agent Teams](https://code.claude.com/docs/ja/agent-teams) は、1 つのセッション内で複数の AI エージェント（teammate）を spawn して協調作業させる機能です。Lead（自分が操作している Claude Code 本体）が司令塔となり、各 teammate にタスクを割り振ります。

commands や roles が「Claude に専門家の帽子をかぶせる」のに対して、Agent Teams は「専門家チームを編成して仕事を委譲する」イメージです。

## 設計方針

この構成を作るにあたって、4 つの方針を決めました。

### 1. 作業は Sonnet + advisor、レビューは Opus + Codex

Sonnet は実装作業向きで高速。ただし判断に迷う場面では `advisor()` を呼び出して Opus のアドバイスを受けられるようにしています。レビューは Opus と Codex（OpenAI）の 2 モデルで独立評価する **cross-model validation** で品質を担保します。

### 2. Lead は調整のみ、全作業は teammate に委譲

Lead（Opus）はタスクの割り振りと結果の判断だけを行います。実際のコード読み書きはすべて teammate が担当。Lead のコンテキストが肥大化しないための設計です。

### 3. レビュー ❌ → 修正 → 再レビュー → 承認のループ

レビューで問題が見つかったら、作業 agent に差し戻して修正させ、再度レビューにかけます。承認されるまでこのループを繰り返す仕組みです。

### 4. Spec-Driven — 仕様 (what) と実装計画 (how) を分離

planner が plan.md に「第 1 部: 仕様 (What)」と「第 2 部: 実装計画 (How)」を書きます。仕様セクションは実装に依存しない振る舞いの定義で、実装コードを読まなくても正しさを判断できるように書きます。この plan.md が全 teammate の判断基準になり、reviewer は仕様適合性を評価し、tester はテストケースを導出します。

## パイプライン

フルパイプラインは 4 つの Phase で構成されています。旧構成では全て直列でしたが、Phase 3 で最大限の並列化（fan-out）を行うように書き直しました。

```mermaid
flowchart TB
    Lead([Lead Opus: 初期指示])
    Explorer[explorer<br/>Sonnet]
    Planner[planner<br/>Opus]
    PlanReview[plan-reviewer<br/>Codex]
    PlanOK{承認?}
    Gate([★ ユーザー確認ゲート])
    Impl[implementer<br/>Sonnet + advisor]

    Lead --> Explorer --> Planner --> PlanReview --> PlanOK
    PlanOK -->|❌| Planner
    PlanOK -->|✅| Gate
    Gate -->|承認| Impl
    Gate -->|却下| Planner

    ImplOpus[impl-reviewer-opus<br/>Opus]
    ImplCodex[impl-reviewer-codex<br/>Codex]
    ImplOK{承認?}

    Impl --> ImplOpus & ImplCodex
    ImplOpus & ImplCodex --> ImplOK
    ImplOK -->|❌| Impl

    SecOpus[security-opus<br/>Opus]
    SecCodex[security-codex<br/>Codex]
    Perf[performance<br/>Sonnet + advisor]
    Tester[tester<br/>Sonnet + advisor]
    DocWriter[doc-writer<br/>Sonnet + advisor]

    ImplOK -->|✅| SecOpus & SecCodex & Perf & Tester & DocWriter

    TestOpus[test-reviewer-opus<br/>Opus]
    TestCodex[test-reviewer-codex<br/>Codex]
    TestOK{承認?}

    Tester --> TestOpus & TestCodex
    TestOpus & TestCodex --> TestOK
    TestOK -->|❌| Tester

    DocOpus[doc-reviewer-opus<br/>Opus]
    DocCodex[doc-reviewer-codex<br/>Codex]
    DocOK{承認?}

    DocWriter --> DocOpus & DocCodex
    DocOpus & DocCodex --> DocOK
    DocOK -->|❌| DocWriter

    SecOK{sec/perf<br/>判定}
    SecOpus & SecCodex & Perf --> SecOK
    SecOK -->|❌| Impl

    Join([全 branch 完了待ち])
    SecOK -->|✅| Join
    TestOK -->|✅| Join
    DocOK -->|✅| Join

    Auditor[doc-auditor<br/>Sonnet]
    Done([完了])

    Join --> Auditor
    Auditor -->|❌| DocWriter
    Auditor -->|✅| Done

    classDef work fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,rx:5,ry:5
    classDef review fill:#fef3c7,stroke:#d97706,stroke-width:2px,rx:5,ry:5
    classDef gate fill:#fce7f3,stroke:#db2777,stroke-width:2px,rx:5,ry:5
    classDef decision fill:#f3f4f6,stroke:#374151,stroke-width:2px

    class Explorer,Planner,Impl,Tester,DocWriter,Auditor,Perf work
    class PlanReview,ImplOpus,ImplCodex,SecOpus,SecCodex,TestOpus,TestCodex,DocOpus,DocCodex review
    class Gate,Join gate
    class PlanOK,ImplOK,TestOK,DocOK,SecOK decision
```

### 並列化の設計判断

| Phase | 方式 | 理由 |
|-------|------|------|
| Phase 2 | 並列 tool call | 2 agent のみ + 直後に join → background のオーバーヘッド不要 |
| Phase 3 | 全 `run_in_background` | chain ごとに独立進行。tester/doc-writer 完了通知で即 follow-up 起動 |
| security と tester/doc-writer を同時 fan-out | — | security ❌ の手戻りリスクはあるが、❌ は低頻度 → 期待値的に並列が得 |
| performance を Phase 3 に配置 | — | impl-review ✅ 後の承認済みコードを分析すべき |

ポイントは Phase 1 の「ユーザー確認ゲート」と Phase 3 の fan-out です。計画を承認したら、セキュリティ・パフォーマンス・テスト・ドキュメントが全て並列で走るので、旧構成の直列パイプラインよりかなり速くなりました。

## Agent 一覧

### 作業系

| Agent | Model | 責務 |
|-------|-------|------|
| explorer | Sonnet | コードベース探索・構造把握。planner に情報を提供 |
| planner | Opus | 仕様 (what) + 実装計画 (how) を plan.md に策定 |
| implementer | Sonnet + advisor | コード実装・修正 |
| tester | Sonnet + advisor | テスト設計・実装・実行 |
| doc-writer | Sonnet + advisor | ドキュメント作成・更新 |
| doc-auditor | Sonnet | 既存ドキュメントの整合性監査 |
| performance | Sonnet + advisor | パフォーマンス分析・ベンチマーク |

### レビュー/監査系

実装・テスト・ドキュメント・セキュリティの 4 領域を、Opus と Codex のペアでカバーしています。同じ観点で独立評価する **cross-model validation** の構成です。

| 対象 | Opus 側 | Codex 側 |
|------|---------|----------|
| 計画 | —（planner が Opus のため） | plan-reviewer |
| 実装 | impl-reviewer-opus | impl-reviewer-codex |
| テスト | test-reviewer-opus | test-reviewer-codex |
| ドキュメント | doc-reviewer-opus | doc-reviewer-codex |
| セキュリティ | security-opus | security-codex |

plan-reviewer だけ Codex のみ（Opus ペアなし）です。planner 自体が Opus なので、same-model review を避けるためです。

### オンデマンド

| Agent | Model | 用途 |
|-------|-------|------|
| analyzer | Opus | 根本原因分析。バグ調査・障害対応時に spawn |

## Codex reviewer の仕組み

レビュー系の「Codex」と書いている agent は、Sonnet が Codex CLI を呼び出してレビューを実行する構成です。

```yaml
---
name: impl-reviewer-codex
model: sonnet
skills: [codex-cli-runtime, gpt-5-4-prompting]
---
```

**⚠️ この Codex 連携は個人ハックです。** `codex-cli-runtime` と `gpt-5-4-prompting` は [openai-codex plugin](https://github.com/openai/codex-plugin-cc) の内部 skill で、本来は `codex:codex-rescue` 専用（`user-invocable: false`）です。公式にサポートされた組み込み方ではないため、plugin の更新で動かなくなる可能性があります。また、Agent Teams の仕様上 teammate 実行時に agent ファイルの `skills` frontmatter は直接適用されず、project/user settings 側で skill が有効になっている必要があります。

この前提を理解した上で使う分には、Claude（Opus）と OpenAI（Codex）による cross-model validation は面白い体験です。同じモデルファミリーだけでレビューするよりも、異なるモデルの視点が入ることで見落としが減ります。実際に使っていて、Opus がスルーしたパフォーマンス問題を Codex が拾ってくれたり、逆に Codex が過剰に警告した箇所を Opus が「問題なし」と判断してくれたりすることがあります。

## advisor と Opus reviewer の違い

![/advisor コマンドの設定画面](/images/blog/claude-code-agent-teams/advisor-command.png)

作業系 agent が使う `advisor` と、レビュー系の Opus reviewer は役割が異なります。

| | advisor | Opus reviewer |
|---|---|---|
| タイミング | 作業中 | 作業完了後 |
| 呼び出し | Sonnet が自律的に `advisor()` | Lead がタスク割当 |
| 目的 | 実装品質の底上げ | 独立した最終レビュー |
| 視点 | 局所的（今の判断） | 全体的（成果物全体） |

advisor は「実装中の相談相手」、Opus reviewer は「完成品を評価する第三者」という位置づけです。

## Dual Review の判断ロジック

Opus と Codex の両方がレビューした結果は、Lead が以下のルールで判断します。

- **Opus ❌ + Codex ❌** → 差し戻し
- **Opus ❌ + Codex ✅**（または逆） → Lead が内容を見て判断
- **Opus ⚠️ + Codex ⚠️** → 原則パス。同一箇所の指摘なら修正推奨

片方だけが ❌ の場合、Lead が指摘内容を精査して最終判断するのがポイントです。

## ワークフローパターン

フルパイプライン以外にも、必要なフェーズだけを実行するパターンがあります。全パターン共通で Phase 0（TeamCreate）を最初に実行し、完了時は TeamDelete でクリーンアップします。

### フルパイプライン

新機能追加やリファクタリング向け。Phase 1-4 を順に実行します。

```
チームで gemini 対応を実装して。
```

Phase 3 でセキュリティ・パフォーマンス・テスト・ドキュメントが全て並列で走るので、直列で回すより速いです。

### レビューのみ

```
チームでこの PR をレビューして。
```

impl-reviewer-opus と impl-reviewer-codex が並列で実行されます。

### 計画のみ

```
チームで実装方針を決めて。
```

explorer → planner → plan-reviewer → ユーザー確認ゲートで止まります。

### テストのみ

```
チームでテストを書いて。
```

### ドキュメントのみ

```
チームでドキュメントを整備して。
```

doc-writer → doc-reviewer-opus + doc-reviewer-codex → doc-auditor の順で実行されます。

### パフォーマンス + セキュリティ監査

```
チームでセキュリティとパフォーマンスを監査して。
```

security-opus + security-codex + performance が全て並列で実行されます。

### セキュリティ監査のみ

```
チームでセキュリティ監査して。
```

security-opus と security-codex が並列で実行されます。

### バグ調査

```
チームでこのバグの原因を調べて。
```

analyzer が単体で spawn されます。

### ドキュメント監査のみ

```
チームでドキュメントの監査をして。
```

doc-auditor が単体で spawn されます。既存ドキュメントの正確性・整合性をチェックします。

キーワードは「チームで」です。CLAUDE.md に以下のように書いておくと、Lead がこのキーワードを検知して `README.md` を読み、Agent Teams モードで動作します。

```markdown
## Agent Teams

ユーザーが「チームで」「チームを作って」等のキーワードで指示した場合、
**`~/.claude/agents/README.md` を読んで従う。**
```

## 成果物ディレクトリ

主な成果物は `docs/plans/` 以下に集約されます。全 agent がファイルを出力するわけではなく、doc-auditor は Lead へのメッセージ報告のみです。

```
docs/plans/2026-04-15-feat-street-fighter-analyze/
├── exploration.md             ← explorer
├── plan.md                    ← planner
└── reviews/
    ├── plan-codex.md          ← plan-reviewer
    ├── impl-opus.md           ← impl-reviewer-opus
    ├── impl-codex.md          ← impl-reviewer-codex
    ├── test-opus.md           ← test-reviewer-opus
    ├── test-codex.md          ← test-reviewer-codex
    ├── doc-opus.md            ← doc-reviewer-opus
    ├── doc-codex.md           ← doc-reviewer-codex
    ├── security-opus.md       ← security-opus
    ├── security-codex.md      ← security-codex
    └── performance.md         ← performance
```

`reviews/` 配下の命名規則は `<対象>-<model>.md`。retry 時は同ファイルを上書きし、差分は git diff で確認します。

## Agent 定義ファイルの構造

各 agent は `~/.claude/agents/` に 1 ファイル = 1 ロールで定義しています。フロントマターで model やツールを指定し、本文に責務と行動指針を記述します。全 agent に共通して「全出力を日本語で行う」ルールを設定しています。

また、本文の冒頭に「あなたは〇〇を担当する **teammate**」と明記しています。Agent Teams では teammate として spawn されるのですが、この一言があるだけで agent が自分の立場を正しく認識して、Lead への報告形式やスコープの逸脱防止がかなり安定します。

さらに重要なのが **Phase 0（チーム初期化）** です。README.md の実行手順では、パイプライン開始前に `TeamCreate` でチームを作成し、以降の全 `Agent()` 呼び出しに `team_name` と `name` を指定するよう定義しています。`team_name` なしで spawn すると通常の subagent として動いてしまい teammate にならないので、この手順は省略できません。

```
Agent({
  team_name: "<slug>",
  name: "explorer",
  subagent_type: "explorer",
  prompt: "..."
})
```

もう 1 つ重要なのが **retry 時の再利用ルール** です。レビューで ❌ が出て修正→再レビューする場合、新しい `Agent()` を spawn するのではなく、`SendMessage` で既存の teammate に再依頼します。新規 spawn すると `-2` サフィックス付きの別 teammate が生成されて、前回のコンテキストが失われてしまいます。

```
# 正: 既存 teammate に再依頼
SendMessage({ to: "impl-reviewer-opus", message: "修正内容: ... 再レビューしてください" })

# 誤: 新しい Agent を spawn → 別インスタンスが生成される
Agent({ name: "impl-reviewer-opus", ... })
```

以下に各ファイルの要点を抜粋して載せておきます。差し戻し対応や出力形式などの定型セクションは省略しています。

### 作業系

<details>
<summary>explorer.md — コードベース探索・構造把握</summary>

```yaml
---
name: explorer
description: コードベースを探索し、構造・パターン・依存関係を把握する。planner や他の teammate に情報を提供する
model: sonnet
tools: [Read, Write, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはコードベース探索を担当する teammate。

## 責務

対象リポジトリの構造・パターン・依存関係を調査し、後続の teammate（planner 等）が判断に必要な情報を収集する。

## 調査項目

1. **ディレクトリ構造** — 主要なディレクトリとその役割
2. **アーキテクチャパターン** — 使われているフレームワーク、設計パターン、レイヤー構造
3. **依存関係** — 外部ライブラリ、内部モジュール間の依存
4. **既存の類似実装** — 追加したい機能に関連する既存コード
5. **設定・環境** — ビルド設定、CI/CD、環境変数
6. **テスト構成** — テストフレームワーク、テストディレクトリ、既存テストのパターン

## 原則

- 既存コードは編集しない（読み取り専用）。ただし調査結果を exploration.md として計画ディレクトリに書き出す
- 推測ではなく実際にコードを読んで事実を報告する
- 関連するファイルパスと行番号を具体的に示す
- 後続の teammate が参照しやすい形式でまとめる
```

</details>

<details>
<summary>planner.md — 計画策定</summary>

```yaml
---
name: planner
description: 仕様策定と実装計画を行う。仕様 (what) と実装計画 (how) を 1 ファイルに統合し、全 teammate の判断基準を提供する
model: opus
tools: [Read, Write, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは仕様策定と実装計画を担当する teammate。

## 責務

Lead から受け取った指示と explorer の調査結果を分析し、**仕様 (what)** と **実装計画 (how)** を 1 つの plan.md に作成する。

plan.md は全 teammate の判断基準となる:
- reviewer → 仕様適合性の評価基準
- tester → テストケースの導出元
- implementer → 実装手順の指示書
- doc-writer → ドキュメントの情報源

## plan.md の構成

### 第 1 部: 仕様 (What)

実装方法に依存しない、外部から見た振る舞いの定義。

1. **要件** — 何を達成するか、スコープの明確化
2. **インターフェース契約** — API シグネチャ、型定義、スキーマ、公開 IF
3. **振る舞い定義** — 入力→出力のマッピング、正常系・異常系・エッジケース
4. **非機能要件** — パフォーマンス制約、セキュリティ要件、互換性
5. **受入条件** — 完了と判断する具体的な条件 (テストで検証可能な形式)

### 第 2 部: 実装計画 (How)

仕様を実現するための技術的手順。

1. **影響範囲** — 変更対象ファイル、依存関係、影響を受けるモジュール
2. **技術選定** — ライブラリ、アルゴリズム、アーキテクチャパターンの選択と理由
3. **実装ステップ** — 順序付きの具体的な作業手順
4. **リスク評価** — 実装上のリスク (破壊的変更、マイグレーション、ロールバック手順)

## 原則

- コードベースを実際に読んで現状を把握してから計画する
- 推測ではなく事実に基づく
- 仕様セクションは実装非依存にする — 実装コードを読まなくても検証可能であること
- 構造変更と動作変更を分離して計画する
- 各ステップは implementer が迷わず実行できる粒度にする
```

</details>

<details>
<summary>implementer.md — コード実装・修正</summary>

```yaml
---
name: implementer
description: レビュー済みの計画に基づいてコードを実装する。新規コード作成、既存コード修正、リファクタリングを実行する
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはコード実装を担当する teammate。

## 責務

planner が作成し plan-reviewer がレビュー済みの計画に従い、コードを実装する。

## advisor 活用

作業中に判断に迷う場面では advisor() を呼び出して Opus のアドバイスを受ける:
- 設計判断の分岐点（複数の実装方法がある場合）
- セキュリティに関わる実装（暗号化、認証、入力検証）
- 既存コードとの整合性が不明な場合
- パフォーマンスへの影響が懸念される場合

advisor は相談相手。最終レビューは別途 impl-reviewer-opus / impl-reviewer-codex が行う。

## 原則

- 計画のステップを順番に実行する
- 計画にない変更は行わない（スコープ厳守）
- 構造変更と動作変更を分離する
- 過度な抽象化より明快さを優先
- 早期リターンでネスト削減
- マジックナンバー・ハードコード禁止
- セキュリティ脆弱性を導入しない（OWASP Top 10）

## 実装手順

1. 計画を確認し、対象ファイルを読む
2. 構造変更があれば先に実施
3. 動作変更を実施
4. ビルド・lint が通ることを確認
```

</details>

<details>
<summary>tester.md — テスト設計・実装・実行</summary>

```yaml
---
name: tester
description: 実装に対するテストコードを設計・作成・実行する。ユニットテスト、統合テスト、エッジケースをカバーする
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob]
background: true
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはテスト設計・実装を担当する teammate。

## 責務

implementer が実装したコードに対して、適切なテストを設計・実装・実行する。

## テスト戦略

1. **既存テストの把握** — テストフレームワーク、規約、ディレクトリ構造を確認
2. **テスト設計** — 正常系、異常系、境界値、エッジケースを洗い出す
3. **テスト実装** — プロジェクトの既存テストパターンに合わせて作成
4. **テスト実行** — 全テストが pass することを確認

## advisor 活用

作業中に判断に迷う場面では advisor() を呼び出して Opus のアドバイスを受ける:
- テスト戦略の選定（どこまでテストすべきか）
- セキュリティテストの設計（攻撃パターンの網羅性）
- モック vs 実依存の判断
- edge case の洗い出しが不十分と感じた場合

advisor は相談相手。最終レビューは別途 test-reviewer-opus / test-reviewer-codex が行う。

## 原則

- 既存テストのパターン・命名規約に従う
- テーブル駆動テスト等、プロジェクトで使われているパターンを踏襲
- モック vs 実 DB 等の方針は既存テストに合わせる
- 実装の内部構造ではなく、振る舞いをテストする
- カバレッジだけでなくテストの意味・価値を重視
```

</details>

<details>
<summary>doc-writer.md — ドキュメント作成・更新</summary>

```yaml
---
name: doc-writer
description: 実装変更に基づいてドキュメントを作成・更新する。PR description、CHANGELOG、API docs、コメントを整備する
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob]
background: true
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはドキュメント作成・更新を担当する teammate。

## 責務

実装変更の内容を把握し、関連するドキュメントを作成・更新する。

## 対象

1. **PR description** — 変更内容、動機、影響範囲のサマリー
2. **CHANGELOG** — ユーザー向けの変更履歴エントリ
3. **API docs** — 公開 API の変更に伴うドキュメント更新
4. **README** — セットアップ手順や Usage に影響がある場合
5. **コードコメント** — 複雑なロジックの補足（必要最小限）

## advisor 活用

作業中に判断に迷う場面では advisor() を呼び出して Opus のアドバイスを受ける:
- ドキュメントの対象読者・粒度の判断
- 技術的に正確な記述か不安がある場合
- 破壊的変更のマイグレーションガイドの書き方
- セキュリティに関する注意事項の記述

advisor は相談相手。最終レビューは別途 doc-reviewer-opus / doc-reviewer-codex が行う。

## 原則

- 実装の diff を実際に読んでから書く
- 「何を変えたか」だけでなく「なぜ変えたか」を記述
- 既存ドキュメントのスタイル・フォーマットに合わせる
- 過度な説明は避け、簡潔に保つ
- 不要なドキュメントは作成しない
```

</details>

<details>
<summary>doc-auditor.md — 既存ドキュメントの整合性監査</summary>

```yaml
---
name: doc-auditor
description: 既存ドキュメントの正確性・鮮度・実装との整合性を監査する。陳腐化した記述や不整合を検出する
model: sonnet
tools: [Read, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは既存ドキュメントの監査を担当する teammate。

## 責務

実装変更に伴い、既存ドキュメントが正確かどうかを監査する。doc-writer が新規作成・更新するのに対し、doc-auditor は既存ドキュメント全体の整合性をチェックする。

## 監査項目

1. **実装との整合性** — ドキュメントに記載された API、設定、手順が実装と一致しているか
2. **陳腐化した記述** — 削除・変更された機能への言及が残っていないか
3. **リンク切れ** — 内部リンク、外部リンクが有効か
4. **サンプルコード** — 掲載されたコード例が現在の実装で動作するか
5. **セキュリティ** — 秘密情報（API キー、トークン、内部 URL）が記載されていないか
6. **網羅性** — 新規追加された機能・設定がドキュメント化されているか

## advisor について

本 agent は使用しない。監査作業はドキュメントと実装の突合（一致するか否かの判定）が主であり、創造的判断を伴う場面が少ないため。

## 原則

- 実装コードとドキュメントの両方を読んで突合する
- 問題箇所はファイルパス・行番号で具体的に指摘する
- 修正が必要な箇所は doc-writer への指示として明記する
```

</details>

<details>
<summary>performance.md — パフォーマンス分析・ベンチマーク</summary>

```yaml
---
name: performance
description: パフォーマンス分析を実施する。プロファイリング、ベンチマーク、ボトルネック特定、最適化提案を行う
model: sonnet
tools: [Read, Write, Bash, Grep, Glob]
background: true
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはパフォーマンス分析を担当する teammate。

## 責務

実装コードのパフォーマンスを実測・分析し、ボトルネックの特定と最適化提案を行う。

impl-reviewer の perf 観点が「コード上の問題指摘」なのに対し、本 agent は「実測に基づく分析」を行う。

## advisor 活用

分析結果の解釈や最適化戦略で判断に迷う場合は advisor() を呼び出して Opus のアドバイスを受ける。

## 分析項目

1. **アルゴリズム計算量** — Big O 分析、データ構造の選択妥当性
2. **プロファイリング** — CPU、メモリ使用量、ホットスポット特定
3. **I/O 効率** — ファイル I/O、ネットワーク、DB クエリの効率性
4. **並行処理** — 並列化可能性、ロック競合、goroutine/thread 効率
5. **リソース管理** — メモリリーク、connection リーク、fd リーク
6. **ベンチマーク** — 可能であればベンチマークを実行し数値で示す

## 分析手順

1. 対象コードを読み、計算量・構造を静的に分析する
2. 可能であればベンチマーク・プロファイリングを実行する
3. ボトルネックを特定し、影響度を定量的に示す
4. 最適化案を ROI（改善効果 vs 実装コスト）順に提示する
```

</details>

### レビュー/監査系

<details>
<summary>plan-reviewer.md — 計画レビュー（Codex）</summary>

```yaml
---
name: plan-reviewer
description: 計画の妥当性を Codex でレビューする。設計リスク、代替案、見落としを検出する
model: sonnet
tools: [Bash, Read, Write, Grep, Glob]
skills: [codex-cli-runtime, gpt-5-4-prompting]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは計画レビューを担当する teammate。Codex CLI を使って planner が作成した計画をレビューする。

## 責務

planner の計画を Codex に渡し、以下の観点でレビュー結果を取得する。

## レビュー観点

1. **設計の妥当性** — 要件を満たしているか、過不足はないか
2. **リスク・盲点** — planner が見落としている問題はないか
3. **代替案** — より良いアプローチはないか
4. **実現可能性** — 技術的に実行可能か、工数は妥当か
5. **影響範囲の漏れ** — 変更による副作用が見落とされていないか
6. **セキュリティ** — 設計レベルの脆弱性（認証・認可の欠陥、データ露出リスク、信頼境界の違反）はないか
```

</details>

<details>
<summary>impl-reviewer-opus.md — 実装レビュー（Opus）</summary>

```yaml
---
name: impl-reviewer-opus
description: 実装コードを Opus でレビューする。impl-reviewer-codex と同一観点で独立評価し、cross-model validation を行う
model: opus
tools: [Read, Write, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは実装レビュー (Opus 側) を担当する teammate。

## 責務

implementer が実装したコードを独立してレビューする。impl-reviewer-codex と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

1. **計画との整合性** — 計画通りに実装されているか、逸脱はないか
2. **アーキテクチャ一貫性** — 既存コードベースのパターン・規約に従っているか
3. **設計判断** — 適切な抽象化レベルか、責務分離は正しいか
4. **コード品質** — 可読性、重複、命名、コードスメル
5. **セキュリティ** — OWASP Top 10、認証・認可の欠陥、秘密情報の露出、信頼境界の違反、依存ライブラリの既知脆弱性
6. **パフォーマンス** — O(n²) ループ、不要な再計算、メモリリーク
7. **バグリスク** — off-by-one、null 参照、型不一致、競合状態、エッジケースの考慮漏れ
8. **保守性・テスタビリティ** — 将来の変更に対する堅牢性、テストしにくい構造
```

</details>

<details>
<summary>impl-reviewer-codex.md — 実装レビュー（Codex）</summary>

```yaml
---
name: impl-reviewer-codex
description: 実装コードを Codex でレビューする。impl-reviewer-opus と同一観点で独立評価し、cross-model validation を行う
model: sonnet
tools: [Bash, Read, Write, Grep, Glob]
skills: [codex-cli-runtime, gpt-5-4-prompting]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは実装レビュー (Codex 側) を担当する teammate。Codex CLI を使ってコードレビューを実行する。

## 責務

implementer が実装したコードを Codex に渡し、独立してレビューする。impl-reviewer-opus と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

impl-reviewer-opus と同一。
```

</details>

<details>
<summary>test-reviewer-opus.md — テストレビュー（Opus）</summary>

```yaml
---
name: test-reviewer-opus
description: テストコードを Opus でレビューする。test-reviewer-codex と同一観点で独立評価し、cross-model validation を行う
model: opus
tools: [Read, Write, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはテストレビュー (Opus 側) を担当する teammate。

## 責務

tester が作成したテストコードを独立してレビューする。test-reviewer-codex と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

1. **テスト戦略** — テスト対象の選定は適切か、重要なパスが漏れていないか
2. **カバレッジ** — 正常系・異常系・境界値・エッジケースが十分か
3. **テスト品質** — テストが実装の振る舞いを正しく検証しているか
4. **偽陽性リスク** — 実装が壊れても pass するテストになっていないか
5. **テストパターン** — テーブル駆動、パラメタライズ等の活用は適切か
6. **脆いテスト検出** — フレーク（非決定的失敗）リスク、実装内部構造への過度な依存
7. **実行効率** — 不要に遅いテスト、並列実行を阻害する構造
8. **セキュリティテスト** — 悪意のある入力パターン（injection、traversal、XSS payload）の網羅、認証・認可の境界テスト、権限昇格シナリオ
```

</details>

<details>
<summary>test-reviewer-codex.md — テストレビュー（Codex）</summary>

```yaml
---
name: test-reviewer-codex
description: テストコードを Codex でレビューする。test-reviewer-opus と同一観点で独立評価し、cross-model validation を行う
model: sonnet
tools: [Bash, Read, Write, Grep, Glob]
skills: [codex-cli-runtime, gpt-5-4-prompting]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはテストレビュー (Codex 側) を担当する teammate。Codex CLI を使ってテストコードをレビューする。

## 責務

tester が作成したテストコードを Codex に渡し、独立してレビューする。test-reviewer-opus と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

test-reviewer-opus と同一。
```

</details>

<details>
<summary>doc-reviewer-opus.md — ドキュメントレビュー（Opus）</summary>

```yaml
---
name: doc-reviewer-opus
description: ドキュメントを Opus でレビューする。doc-reviewer-codex と同一観点で独立評価し、cross-model validation を行う
model: opus
tools: [Read, Write, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはドキュメントレビュー (Opus 側) を担当する teammate。

## 責務

doc-writer が作成・更新したドキュメントを独立してレビューする。doc-reviewer-codex と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

1. **正確性** — 実装と記述が一致しているか、誤情報はないか
2. **網羅性** — 重要な変更が漏れなく文書化されているか
3. **整合性** — 既存ドキュメントとの矛盾はないか
4. **明確性** — 対象読者にとって分かりやすいか、曖昧・誤解を招く表現はないか
5. **構造・過不足** — 情報の整理・順序は論理的か、不要な情報や欠けている情報はないか
6. **サンプルコード** — 掲載されたコード例が正しく動作するか
7. **メンテナンス性** — 将来の変更で陳腐化しやすい記述はないか
8. **セキュリティ** — 秘密情報（API キー、トークン、内部 URL）の記載、サンプルコード内の脆弱パターン（ハードコード credentials 等）
```

</details>

<details>
<summary>doc-reviewer-codex.md — ドキュメントレビュー（Codex）</summary>

```yaml
---
name: doc-reviewer-codex
description: ドキュメントを Codex でレビューする。doc-reviewer-opus と同一観点で独立評価し、cross-model validation を行う
model: sonnet
tools: [Bash, Read, Write, Grep, Glob]
skills: [codex-cli-runtime, gpt-5-4-prompting]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはドキュメントレビュー (Codex 側) を担当する teammate。Codex CLI を使ってドキュメントをレビューする。

## 責務

doc-writer が作成・更新したドキュメントを Codex に渡し、独立してレビューする。doc-reviewer-opus と同一の観点で評価し、セカンドオピニオンとして機能する。

## レビュー観点

doc-reviewer-opus と同一。
```

</details>

<details>
<summary>security-opus.md — セキュリティ専門監査（Opus）</summary>

```yaml
---
name: security-opus
description: セキュリティ監査を Opus で実施する。security-codex と同一観点で独立評価し、cross-model validation を行う
model: opus
tools: [Read, Write, Grep, Glob, Bash]
background: true
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはセキュリティ監査 (Opus 側) を担当する teammate。

## 責務

実装コードに対して深いセキュリティ監査を行う。security-codex と同一の観点で独立評価し、セカンドオピニオンとして機能する。

impl-reviewer の sec 観点が「広く浅く」なのに対し、本 agent は「狭く深く」専門的に監査する。

## 監査観点

1. **インジェクション** — SQL, コマンド, XPath, テンプレート, LDAP injection
2. **認証・認可** — 認証バイパス, 権限昇格, セッション管理, CSRF
3. **データ保護** — 秘密情報の露出, 暗号化の妥当性, ハッシュアルゴリズム, salt/iteration
4. **入力検証** — バリデーション不足, サニタイズ漏れ, path traversal, SSRF
5. **依存関係** — 既知脆弱性 (CVE), サプライチェーンリスク, outdated dependencies
6. **設計レベル** — 信頼境界の違反, 安全でないデシリアライズ, race condition, TOCTOU
7. **LLM/AI セキュリティ** — prompt injection, データ漏洩, モデル操作リスク
```

</details>

<details>
<summary>security-codex.md — セキュリティ専門監査（Codex）</summary>

```yaml
---
name: security-codex
description: セキュリティ監査を Codex で実施する。security-opus と同一観点で独立評価し、cross-model validation を行う
model: sonnet
tools: [Bash, Read, Write, Grep, Glob]
skills: [codex-cli-runtime, gpt-5-4-prompting]
background: true
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたはセキュリティ監査 (Codex 側) を担当する teammate。Codex CLI を使ってセキュリティ監査を実行する。

## 責務

実装コードを Codex に渡し、独立してセキュリティ監査する。security-opus と同一の観点で評価し、セカンドオピニオンとして機能する。

impl-reviewer の sec 観点が「広く浅く」なのに対し、本 agent は「狭く深く」専門的に監査する。

## 監査観点

security-opus と同一。
```

</details>

### オンデマンド

<details>
<summary>analyzer.md — 根本原因分析</summary>

```yaml
---
name: analyzer
description: 根本原因分析の専門家。5 Whys、仮説駆動調査、Evidence-First アプローチで複雑な問題を解決する
model: opus
tools: [Read, Grep, Glob, Bash]
---

> **RULE: 全出力を日本語で行う。Lead からの指示が英語でもこの規則を適用する。技術用語・コード・ファイルパスは原語のまま。**

あなたは根本原因分析を担当する teammate。

## 責務

バグ、障害、予期しない挙動の根本原因を特定する。推測ではなく証拠に基づく分析を行い、再発防止策まで提案する。

## 分析手法

1. **症状の整理** — 何が起きているか、再現手順、影響範囲を明確化する
2. **仮説の列挙** — 考えられる原因を複数挙げる（1 つに飛びつかない）
3. **証拠の収集** — コード、ログ、設定、git history を読んで各仮説を検証する
4. **5 Whys** — 直接原因から根本原因まで掘り下げる
5. **反証の探索** — 有力な仮説に対して意図的に反証を探す

## 原則

- 推測と事実を明確に区別する
- 確証バイアスに注意（最初の仮説に固執しない）
- 証拠がない場合は「不明」と報告する
- 複数の原因が絡む場合は因果関係を整理する

## パイプライン上の位置

標準パイプラインには組み込まない。オンデマンドで spawn される:
- バグ調査時
- 障害対応時
- テストが原因不明で失敗した時
- Lead が「なぜこうなったか調べて」と指示した時
```

</details>

## セットアップ

### 前提条件

**Claude Code 公式機能:**
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` を環境変数に設定

**別途インストールが必要（Codex 構成の場合 — 個人ハック）:**
- Codex plugin（`codex@openai-codex`）— OpenAI の Codex CLI を Claude Code から呼び出すためのプラグイン。別途 OpenAI API キーの設定が必要
- `codex-cli-runtime` / `gpt-5-4-prompting` — plugin 内部の skill（本来は `codex:codex-rescue` 専用、`user-invocable: false`）を teammate から流用している。**公式にサポートされた使い方ではないため、plugin 更新で壊れる可能性あり**。project/user settings 側で有効化が必要

**この構成でのおすすめ:**
- Lead のモデルに `opus[1m]` を指定（teammate が多いとコンテキストが大きくなるため 1M context が安心）
- セッション開始時に `/advisor opus` を実行（advisor ツールの model を Opus に設定）

### ディレクトリ構成

```
~/.claude/agents/
├── README.md                  ← パイプライン定義・設計方針
├── explorer.md
├── planner.md
├── plan-reviewer.md
├── implementer.md
├── impl-reviewer-opus.md
├── impl-reviewer-codex.md
├── tester.md
├── test-reviewer-opus.md
├── test-reviewer-codex.md
├── doc-writer.md
├── doc-reviewer-opus.md
├── doc-reviewer-codex.md
├── doc-auditor.md
├── security-opus.md
├── security-codex.md
├── performance.md
└── analyzer.md
```

`README.md` は Lead に読ませるファイルですが、**置くだけでは自動で読み込まれません**。前述の CLAUDE.md に「`~/.claude/agents/README.md` を読んで従う」と書いているから Lead が参照するのであって、これは個人の custom convention です。

※以下は README の内容を記事用に注釈を加えて転載したもので、本文と一部重複します。本文にない情報は **Phase 0（チーム初期化）の具体的な API 呼び出し**、**step 番号付きの実行手順**、**Phase 3 差し戻し時の再実行判断基準**、**Team vs Subagent の使い分け** です。不要であれば折りたたみのまま飛ばしてください。

<details>
<summary>README.md — パイプライン定義・設計方針（注釈付き転載）</summary>

```markdown
# Agent Teams 構成

Claude Code Agent Teams 用の agent 定義。

## 設計方針

- **作業 = Sonnet + advisor**、**レビュー = Opus + Codex** (cross-model validation)
- Lead (Opus) は初期指示と調整のみ。全作業は teammate に委譲
- 1 role = 1 file で責務を明確に分離
- 全レビューにセキュリティ観点を含む
- Opus と Codex は同じレビュー観点で独立評価（セカンドオピニオン）
- 全 agent の出力は日本語（技術用語・コード・ファイルパスは原語のまま）
- レビュー ❌ → 修正 → 再レビュー → 承認のループで品質担保
- 極力並列化。直列は依存関係が不可避な箇所のみ
- **Spec-Driven**: planner が仕様 (what) と実装計画 (how) を plan.md に統合。仕様が全 teammate の判断基準

## パイプライン概要図

人間向けの俯瞰図。AI Lead は「実行手順」セクションに従うこと。

Phase 0 — チーム初期化 (全パターン共通)
  TeamCreate → TaskCreate → 以降の全 spawn に team_name + name を指定

Phase 1 — 直列
  Lead → explorer → planner → plan-reviewer ⇄ planner → ★gate → implementer

Phase 2 — impl dual review (並列 tool call)
  ├─▶ impl-reviewer-opus  ┐
  └─▶ impl-reviewer-codex ┘ → ❌ なら implementer 修正 → 再実行

Phase 3 — 最大 fan-out (全 run_in_background: true)
  ├─▶ security-opus ──────────────────────────────┐
  ├─▶ security-codex ─────────────────────────────┤
  ├─▶ performance ────────────────────────────────┤
  ├─▶ tester → test-reviewer-opus/codex ──────────┤
  └─▶ doc-writer → doc-reviewer-opus/codex ───────┘
      security/performance ❌ → implementer 修正 → Phase 2 から再実行

Phase 4 — join → 最終監査
  doc-auditor → ❌ なら doc-writer 修正 → doc-review → doc-auditor 再実行
  → 完了

## 実行手順 (Lead 用)

### Phase 0 — チーム初期化

> **重要**: この手順を省略すると teammate ではなく通常 subagent として spawn される。必ず最初に実行すること。

0a. TeamCreate でチームを作成
    - TeamCreate({ team_name: "<slug>", description: "タスクの説明" })
0b. パイプライン全体のタスクを TaskCreate で登録 (Phase 1〜4 の主要タスク)
0c. 以降の全 Agent() 呼び出しに **team_name** と **name** を指定
    - Agent({ team_name: "<slug>", name: "explorer", subagent_type: "explorer", prompt: "..." })
    - team_name なし → 通常 subagent (teammate にならない)
    - name なし → SendMessage で参照不可
0d. teammate との通信は SendMessage({ to: "<name>", message: "..." }) を使用
0e. タスク完了時は TaskUpdate で status を更新
0f. **retry 時は既存 teammate に SendMessage で再依頼する。新しい Agent() を spawn しない。**
    - 新規 spawn すると -2 サフィックス付きの別 teammate が生成され、前回のコンテキストが失われる

### Phase 1 — 直列

1. **explorer** を spawn。結果を保持
2. **planner** を spawn (explorer の結果を渡す)
3. **plan-reviewer** を spawn (plan.md を渡す) 。※ Codex 単独 (dual review なし)
   - IF ✅ → step 4 へ
   - IF ⚠️ → Lead が指摘を精査。妥当なら planner 修正 → step 3、軽微なら step 4 へ
   - IF ❌ → SendMessage で planner に指摘を渡して修正 → SendMessage で plan-reviewer に再レビュー依頼
4. ユーザーに計画を提示し確認を求める
   - IF 承認 → step 5 へ
   - IF 却下/修正指示 → planner に修正指示 → step 3 に戻る
5. **implementer** を spawn

### Phase 2 — impl dual review

6. 並列 tool call で spawn (background 不使用):
   - **impl-reviewer-opus**
   - **impl-reviewer-codex**
7. 両方の結果を待機し **dual review 判定**:
   - IF 両方 ✅ → Phase 3 へ (step 8)
   - IF 両方 ❌ → SendMessage で implementer に両方の指摘を渡して修正 → SendMessage で既存 reviewer に再レビュー依頼
   - IF 片方 ❌ + 片方 ✅ → Lead が ❌ 側の指摘を精査:
     - 妥当 → SendMessage で implementer 修正 → SendMessage で既存 reviewer に再レビュー依頼
     - 過剰 → Phase 3 へ (理由を記録)
   - IF 両方 ⚠️ → 同一箇所指摘なら implementer 修正 → step 6、異なれば Phase 3 へ

> **dual review 判定ルール**: 以降の全 dual review (security, test-reviewer, doc-reviewer) も同じルールを適用する。performance のみ単独判定 (定量的指標ベースのため cross-model 不要) 。

### Phase 3 — fan-out

8. 以下を**全て run_in_background: true** で spawn:
   - **security-opus**
   - **security-codex**
   - **performance**
   - **tester**
   - **doc-writer**

9. 完了通知を受け取り次第、通知ごとに処理 (通知順序は不定。全 branch は独立して進行し、途中で中断しない。統合評価は step 10 で行う):

   **tester 完了時:**
   - test-reviewer-opus + test-reviewer-codex を並列 spawn → dual review 判定
   - IF ❌ → SendMessage で tester に指摘を渡して修正 → SendMessage で既存 test-reviewer に再レビュー依頼 (✅ まで)

   **doc-writer 完了時:**
   - doc-reviewer-opus + doc-reviewer-codex を並列 spawn → dual review 判定
   - IF ❌ → SendMessage で doc-writer に指摘を渡して修正 → SendMessage で既存 doc-reviewer に再レビュー依頼 (✅ まで)

   **security-opus / security-codex / performance 完了時:**
   - 結果を保持。step 10 で評価

10. **全 background agent + follow-up chain 完了後**、security / performance 結果を評価:
    - security-opus + security-codex → dual review 判定 (step 7 と同じルール)
    - performance → 単独判定 (dual review ペアなし。※ perf 分析は定量的指標ベースのため cross-model 不要)
    - IF 全て ✅ or ⚠️ → Phase 4 へ (step 11)
    - IF security or performance ❌ → step 10a へ
    - IF security ❌ + test-reviewer ❌ 同時発生 → step 10a へ (security 修正を優先)

10a. **security / performance 差し戻し処理** (コード修正が必要なため Phase 2 から再実行):
    1. SendMessage で implementer に指摘 (sec / perf) を渡して修正
    2. SendMessage で既存 impl-reviewer に再レビュー依頼 (Phase 2 再実行 → step 7 → step 8 へ自然に進行)
    3. step 8 再 fan-out 時、Lead は以下を判断:
       - security / performance → 全再実行
       - tester / doc-writer → 差分影響で判断:
         - API 署名・公開 IF・主要ロジック変更 → 再実行
         - 内部実装の軽微修正 → 既存結果を再利用
       - security ❌ + test-reviewer ❌ だった場合 → tester も全再実行

### Phase 4 — join → 最終監査

11. **doc-auditor** を spawn (全成果物を渡す)
    - IF ✅ → step 12 へ
    - IF ❌ → SendMessage で doc-writer に指摘を渡して修正
      → SendMessage で既存 doc-reviewer に再レビュー依頼 (dual review 判定)
      → ✅ 後 doc-auditor 再実行 (✅ まで)
12. ユーザーにチーム終了を確認:
    - 「全タスク完了。チームをシャットダウンしてよいか？」と提示
    - IF 承認 → step 12a へ
    - IF 却下 → チーム維持。ユーザーが追加指示可能な状態で待機
12a. チームクリーンアップ:
    a. 全 teammate に SendMessage で shutdown_request を送信
    b. 全 teammate の終了を確認
    c. TeamDelete でチーム・タスクリストを削除
13. 完了報告

### 並列化の設計判断

| 判断 | 理由 |
|------|------|
| Phase 2 は並列 tool call (background 不使用) | 2 agent のみ + 直後に join → background 不要 |
| Phase 3 は全 run_in_background: true | chain ごとに独立進行。完了通知で即 follow-up 起動。最遅 agent に律速されない |
| security と tester/doc-writer を同時 fan-out | security ❌ 時の手戻りリスクはあるが、❌ は低頻度 → 期待値的に並列が得 |
| performance を Phase 3 に配置 | impl-review ✅ 後の承認済みコードを分析すべき |

## Agent 一覧

### 作業系

| File | Name | Model | 責務 |
|------|------|-------|------|
| explorer.md | explorer | Sonnet | コードベース探索・構造把握。planner に情報提供 |
| planner.md | planner | Opus | 仕様 (what) + 実装計画 (how) を plan.md に策定 |
| implementer.md | implementer | Sonnet + advisor | コード実装・修正 |
| tester.md | tester | Sonnet + advisor | テスト設計・実装・実行 |
| doc-writer.md | doc-writer | Sonnet + advisor | ドキュメント作成・更新 |
| doc-auditor.md | doc-auditor | Sonnet | 既存ドキュメントの整合性監査 |
| performance.md | performance | Sonnet + advisor | パフォーマンス分析・ベンチマーク |

### レビュー/監査系 (Opus + Codex、同一観点で独立評価)

> **例外**: plan-reviewer は Codex のみ。planner が Opus のため、same-model review を避ける設計。
>
> **Model 列の "Codex"**: frontmatter 上は model: sonnet + skills: [codex-cli-runtime]。Sonnet が Codex CLI を呼び出す構造。**ただし Agent Teams の仕様上、agent ファイルの skills frontmatter は teammate 実行時に直接適用されない。skill は project/user settings 側で有効化が必要。**

| File | Name | Model | 対象 |
|------|------|-------|------|
| plan-reviewer.md | plan-reviewer | Codex | 計画（Opus ペアなし — planner が Opus のため） |
| impl-reviewer-opus.md | impl-reviewer-opus | Opus | 実装 |
| impl-reviewer-codex.md | impl-reviewer-codex | Codex | 実装 |
| test-reviewer-opus.md | test-reviewer-opus | Opus | テスト |
| test-reviewer-codex.md | test-reviewer-codex | Codex | テスト |
| doc-reviewer-opus.md | doc-reviewer-opus | Opus | ドキュメント |
| doc-reviewer-codex.md | doc-reviewer-codex | Codex | ドキュメント |
| security-opus.md | security-opus | Opus | セキュリティ専門監査 |
| security-codex.md | security-codex | Codex | セキュリティ専門監査 |

### オンデマンド

| File | Name | Model | 用途 |
|------|------|-------|------|
| analyzer.md | analyzer | Opus | 根本原因分析。バグ調査・障害対応時に spawn |

## ワークフローパターン

ユーザーの指示に応じて、必要な teammate だけを spawn する。

> **全パターン共通**: 必ず Phase 0 (TeamCreate) を最初に実行する。全 agent は teammate として spawn し、完了時は TeamDelete でクリーンアップする。

### フルパイプライン

全フェーズを順に実行。新機能追加やリファクタリング向け。

チームで gemini 対応を実装して。

Phase 0 → Phase 1〜4 の実行手順に従う

### レビューのみ

既存コードや PR を多角的にレビュー。

チームでこの PR をレビューして。

Phase 0 → impl-reviewer-opus + impl-reviewer-codex (並列) → dual review 判定

### 計画のみ

実装方針を策定し、ユーザー確認で止める。

チームで実装方針を決めて。

Phase 0 → explorer → planner ⇄ plan-reviewer → ★ ユーザー確認ゲート

### テストのみ

既存実装に対してテストを追加・レビュー。

チームでテストを書いて。

Phase 0 → tester ⇄ test-reviewer-opus + test-reviewer-codex

### ドキュメントのみ

変更に対するドキュメントを作成・レビュー。

チームでドキュメントを整備して。

Phase 0 → doc-writer ⇄ doc-reviewer-opus + doc-reviewer-codex → doc-auditor

### パフォーマンス + セキュリティ監査

実装コードの非機能要件を監査。

チームでセキュリティとパフォーマンスを監査して。

Phase 0 → security-opus + security-codex + performance（全並列）

### セキュリティ監査のみ

実装コードのセキュリティを専門的に監査。

チームでセキュリティ監査して。

Phase 0 → security-opus + security-codex（並列）

### バグ調査

原因不明の不具合を根本原因分析。

チームでこのバグの原因を調べて。

Phase 0 → analyzer

### ドキュメント監査のみ

既存ドキュメントの正確性・整合性をチェック。

チームでドキュメントの監査をして。

Phase 0 → doc-auditor

## 前提条件

- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 が有効
- model: opus[1m] が設定済 (Lead)
- Codex plugin (codex@openai-codex) が有効
- codex-cli-runtime / gpt-5-4-prompting skill が project/user settings で有効化済み（※ agent ファイルの skills frontmatter だけでは teammate 実行時に適用されない）
- /advisor opus をセッション開始時に実行

## advisor と Opus reviewer の役割分担

| | advisor | Opus reviewer |
|---|---|---|
| タイミング | 作業中 | 作業完了後 |
| 呼び出し | Sonnet が自律的に advisor() | Lead がタスク割当 |
| 目的 | 実装品質の底上げ | 独立した最終レビュー |
| 視点 | 局所的（今の判断） | 全体的（成果物全体） |

## 成果物ディレクトリ

docs/plans/YYYY-MM-DD-<slug>/
├── exploration.md             ← explorer
├── plan.md                    ← planner
└── reviews/
    ├── plan-codex.md          ← plan-reviewer
    ├── impl-opus.md           ← impl-reviewer-opus
    ├── impl-codex.md          ← impl-reviewer-codex
    ├── test-opus.md           ← test-reviewer-opus
    ├── test-codex.md          ← test-reviewer-codex
    ├── doc-opus.md            ← doc-reviewer-opus
    ├── doc-codex.md           ← doc-reviewer-codex
    ├── security-opus.md       ← security-opus
    ├── security-codex.md      ← security-codex
    └── performance.md         ← performance

命名規則: <対象>-<model>.md (reviews/ 配下のため review/audit/analysis は省略)

retry 時は同ファイルを上書き。git diff で差分確認。

## レビュー評価基準

- ✅ 問題なし
- ⚠️ 要検討 (ブロッカーではない)
- ❌ 要修正 (差し戻し)

```

</details>

## まとめ

Agent Teams を使い始めてから、特にレビューの質が変わりました。Opus と Codex の dual review で、片方が見落としていたポイントをもう片方が拾ってくれることが実際にあります。

ただし、フルパイプラインは中規模の機能追加で 20-30 分くらいかかります。小さな修正にフルパイプラインを回すのは過剰なので、ワークフローパターンを使い分けるのが大事です。「レビューのみ」や「セキュリティ監査のみ」を使い分けるだけでも、だいぶ楽になりました。

おしまい
