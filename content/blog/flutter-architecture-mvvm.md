---
title: "#0 Flutter の設計を決める"
date: "2020-08-19"
description: "Flutter Architecture Blueprintsの実装解説シリーズ第0回。なぜMVVMを選んだのか、その理由と今後の展望について"
tags: ["Flutter", "Architecture", "MVVM"]
image: "/images/blog/flutter-architecture-mvvm.jpg"
---

Flutter Architecture Blueprints の実装解説

9月に突然リニューアルすることになったわさびーふです。

## はじめに

このブログでは [Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) の実装解説を何回かに分けて投稿していく予定です。内容は Flutter 初中級者向きとなっています。  
できるだけ難しい説明はせずに、これだけ知っていればアプリが作れるくらいの記事にしたいと思っています。

今後のざっくり予定記事  
# 1 MVVM で実現するための構成要素(ライブラリ)の説明と使い方とか  
# 2 ネットワーク通信を実装する上で使ったもの  
# 3 ローカルにデータを保存する上で使ったもの  
# 4 海外対応、ローカライズで使ったもの  
# 5 Dark テーマ、Light テーマなど  
# 6 API 周りのテスト  
# 7 UI のテスト  
# 8 CI とか  
# 番外 Flutter で使われているの Skia とは一体なんなのか、何が優れているのか

![Flutter Architecture](https://cdn-images-1.medium.com/max/800/1*FLuU7MDbD6ldMum-2r41xg.jpeg)

## #0 Flutter の設計を決める

[Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) では設計を MVVM にしています。

AndroidX 時代の今 Kotlin で Android アプリを作ろうとした場合には MVVM が[推奨アーキテクチャ](https://developer.android.com/jetpack/docs/guide?hl=ja)とされています。それを簡単に実現するためのライブラリ郡が Android には [Android Architecture Components](https://developer.android.com/topic/libraries/architecture) として提供されているほどです。

そして、今回の [Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) を MVVM にした理由は **Android エンジニアが Flutter アプリ開発を理解しやすいようにする**ことです。

なので、プロダクトを Flutter で開発する場合には Flutter に慣れておらず Android エンジニアが開発メンバーとして大半を占めている場合は MVVM にするかもしれませんし、そうでない場合は他のアーキテクチャを選択することもあると思います。

もちろん言語やフレームワークと相性の合うアーキテクチャがある一方で、アーキテクチャ論争はよく言われるエンジニアの宗教論争と似たような側面もあるので、その時代と周りの人たちと話し合った結果であればどのアーキテクチャを選んでもいいと思っています。

Google が Android を MVVM ではなくRedux とかを推奨アーキテクチャにしていたら、また結果は変わっていたかもしれません。

## MVVM

![MVVM Architecture](https://cdn-images-1.medium.com/max/800/1*cD4qZ7lr8lCRTMImAeb8eg.jpeg)

[Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) は上記の図のように実装しています。  
Android アプリを古くは MVC 、数年前に Flux 、最近では MVVM や Mobx-ish などで実装したことがありますが、個人的には MVVM は初学者からベテランまで幅広く扱いやすいアーキテクチャだと思っています。データの流れは単一方向のほうが好みと思っていない限りは本当に素晴らしいアーキテクチャです。

MVVM の本質は UI をビジネスロジックなどから分離することと、UI の状態をモデルで制御し、UI とデータを直接紐付けないことです。

詳細は次回の記事で書きますのでここでは触りだけですが、シングルトン・DI・ServiceLocator 相当の機能として [Riverpod](https://riverpod.dev/) を使っています。ViewModel は Observable としての機能を持たせるために [ChangeNotifier](https://pub.dev/documentation/observable/latest/observable/ChangeNotifier-class.html) にしています、[StateNotifier](https://pub.dev/packages/state_notifier) などを使わなかった理由などはまた次回に記事に。

## [The Elm Architecture (Model-View-Update)](https://guide.elm-lang.jp/architecture/)

MVVM で開発して画面数が増えてきた時に気づいたことがあります。その本質である UI をロジックから分離して他のところで再利用するということが実際にはほとんどないこと。  
Flutter のリアクティブフレームワークのようなウィジェットの再構築が常に行われるようなのと ViewModel の同期を保つことが複雑になりえることがあるなと思ったので、近いうちに [The Elm Architecture (Model-View-Update)](https://guide.elm-lang.jp/architecture/)でシンプルに実装してみるかもしれません。

## あとがき

これ書くだけでも割と疲れたので、この記事だけで連載が終わったらごめんなさい(｡-人-｡)
