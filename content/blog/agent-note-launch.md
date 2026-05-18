---
title: "Agent Note を公開しました: AI と一緒に書いたコードの「なぜ」を Git に残す"
description: "AI Coding Agent が書いたコードの文脈が Pull Request から抜け落ちる問題と、Agent Note が Git Notes と PR Report でどう補うかを紹介します。"
date: "2026-05-18"
tags: ["Agent Note", "AI", "Git", "コードレビュー", "OSS"]
image: "https://raw.githubusercontent.com/wasabeef/AgentNote/main/docs/assets/hero.png"
---

こんにちは、わさびーふです。

最近は Claude Code、Codex CLI、Cursor、Gemini CLI のような Coding Agent に実装を頼むことが増えました。

ただ、AI に書いてもらったコードを Pull Request でレビューしていると、ずっと違和感がありました。

**Diff には「何が変わったか」は出ますが、「なぜそう変わったか」は残りません。**

人間が書いた Commit でも Commit Message が弱いとレビューは難しくなります。AI が書いたコードではさらに、Prompt、Response、途中の相談、どの Agent がどのファイルを触ったか、という文脈がレビューから抜け落ちます。

その問題を解決するために、[Agent Note](https://github.com/wasabeef/AgentNote) を作りました。

![Agent Note — AI との会話を Git に保存](https://raw.githubusercontent.com/wasabeef/AgentNote/main/docs/assets/hero.png)

この記事では細かい使い方よりも、なぜこういう記録が必要になったのか、Agent Note がどう Git に文脈を残すのかを中心に書きます。

## AI 時代のレビューで足りないもの

AI Coding Agent は一般的になりました。

実装を頼むこと自体が、もう特別ではなくなりつつあります。コードを書く速度は上がります。テストも追加してくれます。ドキュメントも更新してくれます。Pull Request まで用意してくれるようになりました。

でも、レビューする側に回ると別の問題が出ます。

最終的な Diff だけを見ると、実装の背景が見えません。

- 何を頼んだ結果なのか
- AI はどんな前提で実装したのか
- 途中で方針が変わったのか
- 生成 Bundle なのか、意図して書いた Source なのか
- どの Commit は AI の影響が大きく、どの Commit は人間の修正が中心なのか

人間同士の開発では、Commit Message、Pull Request の説明、レビューコメントがこの文脈を補ってきました。

AI が関わる開発では、Prompt と Response もレビュー材料になります。AI がどういう指示を受けて、どう返して、どのファイルを触ったかが分からないと、レビューの入口で肝心な情報が失われます。

今までは、AI との会話は各 Agent の UI やローカルの履歴に残るだけでした。セッションが終わると、チームに共有されるのは Commit と Pull Request だけになります。

そこで肝心な「なぜその変更になったのか」が抜け落ちます。

## AI Review Tool にも文脈が必要

Copilot、CodeRabbit、Devin、Greptile のような AI Review Tool もよく使うようになりました。

ただし、それらが見ているのは、だいたい Diff と Repository のコードです。

AI が書いたコードを AI がレビューしているのに、生成時の Prompt や意図は見えていません。

これだと、レビューはどうしても表面的になりがちです。

「この変更は何を直すためのものか」「この実装で意図に合っているか」「ユーザーが本当に求めていたことは何か」を判断するには、Diff だけでは足りません。

Agent Note は、その文脈を AI Review Tool も読める形で Pull Request に残します。

Pull Request の本文には人間向けの要約を表示し、同時に `agentnote-reviewer-context` という Hidden Comment を埋め込みます。画面上の PR 本文には表示されませんが、Raw PR Description を読む AI Review Tool は、どこが変わったか、どこを見てほしいか、作者の意図は何かを拾えます。

レビューする AI に対しても「Diff だけ見て」ではなく、「この Prompt と意図も踏まえて見て」と渡すための仕組みです。

### 現状

```text
git diff
Pull Request description

Prompt?       ない
Response?     ない
なぜその実装?  推測するしかない
```

### Agent Note 導入後

```text
git diff
Pull Request description
refs/notes/agentnote
Dashboard

Prompt / Response / Context / AI Ratio を Commit と一緒に追える
```

## 何を残すのか

Agent Note は、AI Coding Agent との会話と変更されたファイルを Commit ごとに残します。

`git log` に、その変更の裏側にある AI との会話を足すようなイメージです。

保存するものは大きく 4 つです。

| 保存するもの | 見えるようになること |
|---|---|
| Prompt / Response | 何を頼み、AI がどう返したか |
| Files | どのファイルを Agent が触ったか |
| AI Ratio | Commit 全体のうち AI が関わった割合の目安 |
| Context | 短い Prompt だけでは分かりにくいときの補足 |

たとえば `はい、では実装して` のような Prompt だけが Pull Request に残っても、あとから読む人には意味が分かりません。

Agent Note は、その Prompt を無理に膨らませるのではなく、Commit に関係する周辺情報から役に立つときだけ `Context` を添えます。

![Dashboard に表示される Context の例](https://raw.githubusercontent.com/wasabeef/AgentNote/main/website/public/images/context-dashboard-example.png)

ここで気をつけたいのは、Agent Note が「AI が書いたから正しい」「AI が書いたから危険」と判定するわけではないことです。

レビューのための材料を増やすツールです。

## 仕組み

Agent Note 自体は Hosted Service ではありません。

通常の Git Workflow の横に、薄い記録レイヤーを足します。

```text
Coding Agent に Prompt を送る
        │
        ▼
Agent Hooks が Prompt / Response / Session 情報を記録する
        │
        ▼
Agent がファイルを編集する
        │
        ▼
Hooks または Local Transcripts が変更ファイルを記録する
        │
        ▼
`git commit` を実行する
        │
        ▼
Git Hook が Session と Commit を結びつける
        │
        ▼
Agent Note が Commit に Git Note を書く
        │
        ▼
Agent Note の pre-push hook が refs/notes/agentnote も共有する
```

一時的な Session Data は `.git/agentnote/` に置かれます。

永続的な Record は `refs/notes/agentnote` に保存されます。

通常の Diff は変えません。Commit Message には Session を結びつける短い trailer だけを追加し、詳細な記録は Git Notes に保存します。必要なときだけ Git Notes を読めば、Commit の裏側にあった AI との会話を追えます。

## なぜ Git Notes なのか

Agent Note で一番意識したのは、開発フローを変えすぎないことです。

`git commit` をやめたくありませんでした。AI の会話履歴を Hosted Service に預ける前提にもしたくありませんでした。

AI と一緒に書いたコードの文脈は、Commit と同じくらいチームの資産になります。だから、その文脈も Git の中に残る形が自然だと思っています。

Git Notes を使うと、通常の Commit 履歴を汚さずに、Commit に追加情報を紐づけられます。

このくらい Git に近い場所に置くのが、ちょうど良いと思っています。

- 普段はいつもの `git log` と Pull Request を見る
- 必要なときだけ Agent Note の情報を読む
- チームには `refs/notes/agentnote` として共有する
- 外部の Hosted Service は不要

AI 開発の記録を、Git の外に逃がさず、Git の近くに置くための設計です。

## Agent Note がやらないこと

Agent Note は、AI が書いたコードの正しさを証明するためのツールではありません。

AI Ratio も、責任や品質を自動で判定するための数字ではありません。あくまで「この Commit には AI の関与がどのくらいありそうか」を見るための目安です。

また、現時点では「この Prompt がこの 1 行を書いた」と完全に断定するものでもありません。`agent-note why` は、対象行から Commit に戻り、その Commit に残っている Prompt、Response、Context を読むための近道です。

Agent Note がやりたいのは、レビューを置き換えることではなく、レビューに必要な文脈を失わせないことです。

## SDD と Agent Note の関係

Spec-Driven Development では、実装前に「何を作るか」「なぜ作るか」を明文化します。

これは AI Coding Agent と相性が良いです。Agent に渡す前提が曖昧だと、速く実装できても、レビュー時に「なぜこの形になったのか」が分かりにくくなるからです。

ただ、Spec だけでは実装中の会話は残りません。Agent がどこをどう解釈したのか、途中で何を相談したのか、最終的にどの Commit にどう反映されたのかは、別の記録として残す必要があります。

Spec が実装前の意図だとすると、Agent Note は実装後の実行記録です。

この 2 つが揃うと、レビューでは「Spec に対して実装が合っているか」と「Agent がどういう文脈でその実装に到達したか」の両方を確認できます。

## Entire との関係

この問題意識は Agent Note だけのものではありません。

[Entire](https://docs.entire.io/overview) も、AI Agent が書いたコードの背景を Git と結びつけるためのツールです。Entire は Checkpoint という単位で Prompt、Transcript、Tool Call、変更ファイルなどを保存し、Commit に紐づけます。Rewind、Resume、検索、Web UI まで含む、より広い Agent 開発の記録基盤に近いプロダクトです。

Agent Note は、意図的にスコープを絞っています。

中心に置いているのは、Commit と Pull Request Review です。記録先は Git Notes の `refs/notes/agentnote` で、PR Report、Dashboard、AI Review Tool 向けの Hidden Comment、`agent-note why` から「この Commit はなぜこうなったのか」をすぐ読めるようにすることを優先しています。

どちらが正しいというより、見ているスコープが違います。

Session 全体を Checkpoint として扱い、戻る・再開する・検索するところまで欲しいなら Entire のような設計が向いています。Pull Request のレビューで、Commit ごとの Prompt、Response、AI Ratio、Context を必要な範囲で共有したいなら Agent Note の方が近いと思っています。

## PR Report と Dashboard

Pull Request では、Agent Note が人間向けの要約を出します。

```md
## 🧑💬🤖 Agent Note

**Total AI Ratio:** ██████░░ 73%
**Model:** `claude-sonnet-4-20250514`

| Commit | AI Ratio | Prompts | Files |
|---|---|---|---|
| ce941f7 feat: add auth | ████░ 73% | 2 | auth.ts, token.ts |

Open Dashboard ↗
```

PR Report は、レビューの最初にざっと状況を掴むためのものです。

一方で、長い会話や Commit ごとの流れを読むには Dashboard の方が向いています。

Dashboard では、PR 単位、Commit 単位で Prompt / Response、変更ファイル、AI Ratio、Diff を確認できます。

![Agent Note Dashboard preview](https://raw.githubusercontent.com/wasabeef/AgentNote/main/docs/assets/dashboard-preview.png)

PR Report は入口、Dashboard は深掘り用、という役割です。

## `agent-note why` の考え方

もう 1 つ、`agent-note why` というコマンドも入れています。

これは、対象行から `git blame` で Commit を探し、その Commit に紐づく Agent Note を読むためのものです。

```bash
npx agent-note why README.md:111
```

まだ「この Prompt がこの 1 行を書いた」と断定する機能ではありません。

ただ、対象行から「この Commit のときに何を頼んでいたか」まで 1 コマンドで戻れるだけでも、コードを読むときの体験は変わります。

将来的には、もっと細かい line-level の説明にも近づけたいですが、まずは既存の Git Blame と Git Notes をつないで、今ある情報にすぐ届くようにしています。

## Agent ごとに取れる文脈は違う

Agent Note は複数の Coding Agent に対応しています。

ただし、Agent ごとに Hook や Transcript の仕組みが違うため、取れる情報の粒度も違います。

Claude Code は最も細かく記録できます。Codex CLI、Cursor、Gemini CLI も、それぞれが公開している Hook や Transcript から取れる範囲で Prompt、Response、変更ファイル、AI Ratio を残します。

ここで精度を大きく見せすぎないことも意識しています。

分からないものは分からないまま扱います。AI Ratio は証明ではなく目安です。

最新の対応状況は [エージェント対応](https://wasabeef.github.io/AgentNote/ja/agent-support/) にまとめています。

## 注意点

Agent Note は、AI との会話をチームに残します。

だから、記録される情報の扱いには少し注意が必要です。

- Prompt や Response には機密情報を書かない方が安全です
- Git Notes を Push すると、チーム内でその会話履歴も共有されます
- AI Ratio は推定値です。品質や責任を自動判定するものではありません
- Agent によって取れる情報の粒度が違います
- Gemini CLI はまだ Preview 扱いです

Agent Note は監査ツールというより、レビューの文脈を増やすための道具です。

## まとめ

AI Coding Agent を使うほど、コードレビューでは「何が変わったか」だけでは足りなくなります。

人間の Commit には Commit Message や Pull Request の会話があります。AI が関わった Commit にも、Prompt、Response、Context、AI Ratio が残っている方がレビューしやすくなります。

Agent Note は、そのための Git-native な OSS です。

- GitHub: <https://github.com/wasabeef/AgentNote>
- Documentation: <https://wasabeef.github.io/AgentNote/ja/>
- npm: <https://www.npmjs.com/package/agent-note>

AI と一緒に書いたコードを、あとからちゃんと読めるようにしたい人は、ぜひ試してみてください。

おしまい
