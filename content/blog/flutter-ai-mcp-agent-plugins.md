---
title: "Flutter 公式 Agent Skills の中身を読んで、実務で使えるか考える"
description: "Flutter 公式 Skills を読んでみました。LayoutBuilder の使い分け、pumpAndSettle の注意点、ChangeNotifier を前提とした設計など、既存プロジェクトに取り込む前に見ておきたい箇所を紹介します。"
date: "2026-11-06"
tags: ["Flutter", "Dart", "AI", "Agent Skills"]
---

こんにちは、わさびーふです。

今回は Flutter チームが公開している [Agent Plugins](https://github.com/flutter/agent-plugins) に含まれる、Agent Skills の中身を見ていこうと思います。

「公式の Flutter 用 Skills」と聞くと、とりあえず入れておけばよさそうに見えます。ただ、中身を読むと、レイアウトの基本的な指針から、状態管理やライブラリの選択まで結構踏み込んでいます。

特にアーキテクチャの Skill は、ViewModel に `ChangeNotifier` を使うところまで指定していました。既に Riverpod や BLoC で作っているアプリだと、そのまま任せてよいかは少し考えたいです。

今回はレイアウト、Widget test、アーキテクチャの 3 つを読んで、取り込みたいところと気になったところを書いてみます。

2026 年 11 月 6 日時点の内容です。リンク先の `main` は更新されるので、導入時は最新のファイルも確認してください。今回は定義ファイルを読んだ話で、生成結果の比較や速度の計測はしていません。

## Flutter Agent Skills とは

[flutter/agent-plugins](https://github.com/flutter/agent-plugins) は Flutter チームが保守する、AI コーディングツール向けの plugin 集です。Flutter アプリに追加するライブラリではなく、開発を担当する AI 側に追加するものです。

その中の Skills には、レスポンシブレイアウト、Widget test、ルーティング、ローカライズなど、作業ごとの手順が定義されています。実体は各ディレクトリの `SKILL.md` なので、AI にどんな作業を指示するのかを読めます。

Skills は、名前と説明から関連する作業を判断し、必要なときに詳しい手順を読み込む仕組みです。レイアウト用の指示を、テストを書くだけのときまで全部読み込ませずに済みます。[公式の仕組みの解説](https://docs.flutter.dev/ai/tools#agent-skills)

## レスポンシブ対応は、幅の測り方まで書いてある

[`flutter-build-responsive-layout`](https://github.com/flutter/agent-plugins/blob/main/skills/flutter-build-responsive-layout/SKILL.md) では、レイアウト判断に使う情報を具体的に分けています。

| 判断したいこと | Skill が示す方法 |
|----------------|------------------|
| 通常の構成でのウィンドウサイズ | `MediaQuery.sizeOf(context)` |
| 親の制約が許容する最大幅 | `LayoutBuilder` の `constraints.maxWidth` |
| 広い領域でのフォームや本文の最大幅 | `ConstrainedBox` などで制限 |
| 大きなリストの構築 | `ListView.builder` / `GridView.builder` |

厳密には、`MediaQuery.sizeOf(context)` が返すのは最も近い祖先の `MediaQuery` が持つ `size` です。途中で値を上書きしていれば、ウィンドウサイズとは異なります。また、`constraints.maxWidth` は子が実際に描画された幅ではなく、親から渡される幅の上限です。[MediaQuery.sizeOf](https://api.flutter.dev/flutter/widgets/MediaQuery/sizeOf.html) / [LayoutBuilder](https://api.flutter.dev/flutter/widgets/LayoutBuilder-class.html)

Skill では、画面全体のレイアウトを「phone / tablet」や縦向き・横向きだけで切り替えないよう指示しています。

たとえば、商品一覧を全画面でもサイドパネル内でも使う場合。ウィンドウは広くても、一覧に割り当てられる領域は狭いことがあります。

ウィンドウ全体の幅で分岐してしまうと、狭いパネル内でも横並びのレイアウトを選びかねません。この場合に見たいのは `LayoutBuilder` が受け取る制約の方です。

この考え方は [Flutter の adaptive design のベストプラクティス](https://docs.flutter.dev/ui/adaptive-responsive/best-practices) とも一致します。分割表示やリサイズを考えると、端末名より実際に使える領域を基準にする方が扱いやすいです。

「タブレット対応して」とだけ頼んだときにも、この区別を前提に作業してもらえるなら助かります。大画面でフォームが横いっぱいに伸びないよう、最大幅を制限する指示も入っています。

### 幅が変わったあと、状態は残る？

Skill 内の breakpoint は例なので、値は既存の design token やコンポーネントに合わせたいです。

それより気になるのは、List から Grid に切り替えたときの状態です。選択中の項目やスクロール位置が消えてしまうと、見た目はきれいでも使いづらいです。

幅を広げて終わりにせず、狭く戻したときにも操作を続けられるか。このあたりは画面ごとの仕様として補いたいところです。

## Widget test は、生成後の直し方も気になる

[`flutter-add-widget-test`](https://github.com/flutter/agent-plugins/blob/main/skills/flutter-add-widget-test/SKILL.md) は、テストの配置から実行・修正までをチェックリストにしています。

流れは、対象 Widget を構築し、初期状態を確認し、操作を行い、再描画後の状態を検証するものです。必要に応じた `MaterialApp` などのラップや、長いリストの要素を操作する前のスクロールにも触れています。

基本的な手順ですが、初期表示だけを確認して終わらず、操作後の assertion とテスト実行まで入っています。フォームなら「送信前にエラーがない」「不正な入力でエラーが出る」など、確認したい仕様を渡しておけば、この流れに乗せられそうです。

### `pumpAndSettle` を増やせばよいわけではない

この Skill は通常の状態変更に `pump()`、アニメーションなどの完了待ちに `pumpAndSettle()` を使う手順を示しています。

ただ、`pumpAndSettle()` はフレームが予約されなくなるまで待つため、終了しないアニメーションがあると timeout します。たとえば、くるくる回るローディング表示を出したままの画面です。[公式 API ドキュメント](https://api.flutter.dev/flutter/flutter_test/WidgetTester/pumpAndSettle.html)

同ドキュメントでは、必要なフレームを把握して `pump` する方が、開始タイミングのずれなどの regression を検出しやすいとも説明されています。

Loading 中の表示を確認するテストと、遷移完了後を確認するテストでは、待ち方も違います。失敗したからとりあえず `pumpAndSettle()` や待ち時間を足す、という修正にはしたくないです。

### Assertion を変えて通してよいのか

Skill には失敗結果を見て Widget のロジックや assertion を調整し、再実行する流れもあります。ただ、assertion を変えて通すだけでは、意図した仕様を守ったことにはなりません。

たとえば、エラーメッセージが表示されるべきなのに表示されず、テストが落ちた場合。assertion を消せば通りますが、直してほしいのはそこではありません。

テストを追加する手順は任せたいですが、失敗したときに期待値を変えるなら、その理由も見たいです。通信や状態管理の差し替えは、既存の fake やテスト用 wrapper に合わせてもらう。このくらいはプロジェクト側で決めておいた方がよさそうです。

## アーキテクチャの Skill は MVVM + ChangeNotifier

[`flutter-apply-architecture-best-practices`](https://github.com/flutter/agent-plugins/blob/main/skills/flutter-apply-architecture-best-practices/SKILL.md) を読むと、抽象的な責務分離の説明だけではありません。

UI は MVVM とし、ViewModel は `ChangeNotifier` / `Listenable` で状態を公開する方針です。データ取得は Services と Repositories に分け、ViewModel には constructor から依存を渡します。

新機能の手順にも、immutable なモデル、Service、Repository、ViewModel、View、依存の登録、テストという順序があります。`freezed` / `built_value` や、DI の候補への言及もあります。

状態管理や依存ライブラリまで指定があるため、既存アプリへ入れるなら、現在の構成と合うかを先に確認したい部分です。

### Riverpod / BLoC のプロジェクトではどう考えるか

たとえば、既に Riverpod の Notifier や BLoC で画面状態を管理しているプロジェクトへ、この Skill の ViewModel 手順をそのまま適用すると、別系統の状態管理が増える可能性があります。

View とロジックの分離を進める場合でも、状態管理や DI まで置き換える必要があるかは別です。既存のモデル定義で足りていれば、新しいコード生成ライブラリを増やす理由もありません。

取り込むなら、責務分離の考え方と、状態管理・DI の具体的な指定を分けて検討できます。この Skill に Riverpod / BLoC 向けの置き換え手順が用意されているわけではないので、既存設計との対応はプロジェクト側で決める部分です。

### 単純な CRUD に Use Case は足さない

この Skill は、複雑な処理や複数 ViewModel で共有するロジックがある場合に Use Case を追加し、単純な CRUD では省く分岐も持っています。

この分岐に従えば、単純な CRUD で Repository のメソッドを呼ぶだけの Use Case を機械的に増やすのを避けられます。層を追加する条件まで書かれているので、既存コードと比較するときの判断材料になります。

## Skills もコードと一緒にレビューしたい

Skills をファイルで共有すれば、毎回のプロンプトを短くするだけでなく、AI に渡す設計方針をチームで確認できます。

レイアウトの制約をどう扱うか、テストをどこまで実行するか、状態管理を何にするか。生成されたコードに違和感があったとき、影響した可能性のある指示を調べられます。実際にその Skill を参照したかは、エージェントの実行記録でも確認する必要があります。

作業手順は Skills、プロジェクト共通の規約は Rules に置き、画面ごとの仕様は依頼するときに渡す。この分け方なら、同じ説明をあちこちに書かずに済みます。[公式の各機能の解説](https://docs.flutter.dev/ai/tools)

ただし、既存の Rules と矛盾する Skill を入れて「既存設計を優先して」と書くだけで解決するとは限りません。状態管理のような重要な箇所は、そもそも採用する Skill の内容を合わせる方が追いやすいです。

更新時も同じで、推奨 API やライブラリ、検証手順が変わっていたら生成コードにも影響しそうです。名前や description が変わると、Skill が選ばれる場面も変わりえます。

独自に変更するなら、もとにした revision と変更理由くらいは残しておきたいです。「公式の更新を取り込んだら状態管理が変わった」とならないように、指示の差分も見る。依存ライブラリを更新するときと同じ感覚です。

## あとがき

幅の扱いや Widget test の基本手順は、対象の Widget やテストに範囲を絞って検討しやすい内容です。アーキテクチャの Skill は状態管理や依存関係まで指定するので、既存コードとの比較が必要になります。

公式だから丸ごと入れる、ではなく、中身を読んで使いたいところを選ぶ。以前の [Claude Code Cookbook](/blog/claude-code-cookbook) と同じで、結局は自分たちの開発に合うかどうかですね。

おしまい
