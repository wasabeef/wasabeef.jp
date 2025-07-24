---
title: "Flutter を MVVM で実装する"
description: "この記事は Flutter Architecture Blueprints の解説記事です。今回は Flutter アプリを MVVM で実装する上でどういう形にしていったかを解説していきたいと思います。"
date: "2020-08-28"
tags: ["Flutter", "MVVM", "Architecture"]
image: "https://cdn-images-1.medium.com/max/800/1*CJbujz_HOZNwk6uRClZMQA.jpeg"
---

**（この記事は 2020/08/28 時点での記事になります。設計のトレンドは日々変わりますので最新のトレンドを確認してください。）**

## はじめに

この記事は [Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) の解説記事です。  
今回は Flutter アプリを MVVM で実装する上でどういう形にしていったかを解説していきたいと思います。Android エンジニアにとって脳内変換出来そうなキーワードも使っていきます。

実はアーキテクチャを解説するのはあまり好きではなく、この形が合理的だと言っても、そのエンジニアの経験と趣味思考の違いで話が合わなくなることがあると思っていて、それが押しつけになっていることがあります。なので**これが完璧だと捉えないでください**。私も勉強中の身です。

![Flutter MVVM](https://cdn-images-1.medium.com/max/800/1*CJbujz_HOZNwk6uRClZMQA.jpeg)

## MVVM

まずは MVVM の説明をしていきます。  
_※知ってる人は読み飛ばしてください_

[Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) の [README](https://github.com/wasabeef/flutter-architecture-blueprints#documentation) にも貼ってあるこの図を見てください。

![Flutter Architecture Blueprints](https://cdn-images-1.medium.com/max/800/1*Uj5dnm3RTQ89uidDpcObHw.jpeg)
_[Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints)_

MVVM は [Model–View–ViewModel](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) のことです。

UI の実装において、例えばテキストを入力し、バリーデーション、データを保持し、ボタンをタップして、サーバに送信するようなコードを View に全て追加していくと UI が複雑になっていった時には更にコードが肥大化してしまい、それは UI とプレゼンテーションロジックとビジネスロジックの密結合になっているのでメンテナンスが大変ですし、テストを書くが困難に思えます。

そこで必要になってくる概念が**関心の分離 (SoC)** です。  
簡単に説明すると全てのアーキテクチャ共通して言えることですが、何をさせたいのか？その役割によって分離した構成要素とすることです。

![MVVM](https://cdn-images-1.medium.com/max/800/1*RAKozoRmhVzRIV-DE3o0Yw.png)
_MVVM_

MVVM の構成要素の基本的な考えは  
**View** は UI (Widget) を描画（出力）し、ユーザからの入力データを受け取ります。  
**ViewModel** は View から入力された状態（データ）を適切に変換して Model として持ちます。また、Model の状態（データ）を View 渡して画面の更新を促します。  
**Model** は状態（データ）を保持し、それがどう変換されて画面に描画されるかは知りません。  
であり View、ViewModel、Model の 3 つです。

なので厳密にいうとこの [README](https://github.com/wasabeef/flutter-architecture-blueprints#documentation) にあるアーキテクチャの図は MVVM だけではなく [Repository pattern](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design) も含まれています。  
Repository pattern はデータソースへのアクセスを抽象化するためのデザインパターンです。ViewModel が持つことになりますが、ViewModel 側からすると Repository とデータの形式だけを取り決めるだけで、入手先がサーバからなのか、ローカルの DB なのか、オンメモリなのかなどは知りません。

ここまでが、MVVM + Repository pattern の簡単な説明です。

---

[Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) ではこのアーキテクチャを実現するために以下のものを軸に使っています。私の主観を含めて書いていきます。

[**Riverpod**](https://pub.dev/packages/riverpod)：新しい Provider です。DI や 状態管理するためのライブラリです。Provider と作者が一緒なので、今後はこちらになっていくものだと思います。まだバーションが 1.0.0 に達しておらず Breaking Changes があったりしますが、Provider から Riverpod に移行する時のコストことを考えると今後 Riverpod に Breaking Changes があったとしても少しずつコスト払ってると考えると楽なのでプロダクトでも導入しています。Android の Dagger と同じようなことができます。

[**Flutter Hooks**](https://pub.dev/packages/flutter_hooks)：View 側で使っています。Provider からインスタンスをもらう時のコードが冗長だなって思っていたので導入していましたが、Riverpod 0.7.0 のほうで ConsumerWidget という HookWidget と同等のものができたことにより Flutter Hooks を導入する理由が少し減りました。ただ Flutter の FutureBuilder を使ったことある人はわかるかもしれませんが、正直いって扱いづらいです。その FutureBuilder/AsyncMemoizer がuseFuture/useMemoized メソッドを使うことで簡素にかけるので Flutter Hooks を導入したままです。懸念は [Flutter チームとこの作者がまだ色々と議論していた](https://github.com/flutter/flutter/issues/51752)ので、今後外す可能性もなくはないです。React Hooks と同じようなことができます。

[**ChangeNotifier**](https://flutter.dev/docs/development/data-and-backend/state-mgmt/simple#changenotifier)：値が変更されたことを通知することができる Observable です。ViewModel は ChangeNotifier を継承することを想定しています。これを決定する時に ChangeNotifier にするか StateNotifier にするか考えました。StateNotifier のほうが高機能でパフォーマンスも高いみたいです。ただ ChangeNotifier にした理由を一言で表すと「そんなに複雑なことをしないです。」例えば、今の [Flutter Architecture Blueprints](https://github.com/wasabeef/flutter-architecture-blueprints) みたいな作りをして ViewModel 周りが複雑になってきたなと感じた場合に、それが ChangeNotifier だと無理だけど StateNotifier ならいけるという理由にはならないと思いました。その複雑さは ChangeNotifier や StateNotifier の話ではなくアーキテクチャの問題になってくるのではないかと思います。View に通知ができれば正直どっちでもいいです。また、ViewModel が Model を複数持つような時に StateNotifier だと 1 つのクラスしか持てないので、それらを纏めるためのクラスを作ることになると思います。そこをクラスでネストする必要はないかなと思ったので、StateNotifier は ViewModel というよりは Model のほうで使った方がよさそうです。StateNotifier の State は View 側からは ReadOnly にしっかりされていますが ChangeNotifier でそう言うふうに作ればいいかなとも思いますし、ChangeNotifier だと無駄にリビルドされてしまうのではという問題は Flutter Hooks の useMemoized メソッドを使ってリビルドを防止していますし、ChangeNotifier 自体のパフォーマンス自体は、先日、[LinkedList に変わっていた](https://github.com/flutter/flutter/pull/62330)ので、そのうち良くなっていくことでしょう。あくまこれは現状の意見で、今後 ViewModel で StateNotifier を使わないと言ってるわけではなく、実はこんな利点もあるって誰かが教えてくれたら明日になったら使ってるかもしれません。

さて、ここからは Flutter のコードを載せながら解説していきます。

まず Riverpod を使う上で一番最初にやる大事なことは [ProviderScope](https://pub.dev/documentation/flutter_riverpod/latest/flutter_riverpod/ProviderScope-class.html) で App を囲むことです。

```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(
    ProviderScope(
      child: App(),
    ),
  );
}
```

### ViewModel

ViewModel は MVVM で核となる一番大事な部分です。  
ChangeNotifier を継承しています。

```dart
// home_view_model.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'news_repository.dart';
import 'article.dart';

// Provider
final homeViewModelProvider = ChangeNotifierProvider<HomeViewModel>(
  (ref) => HomeViewModel(ref.read(newsRepositoryProvider))
);

class HomeViewModel extends ChangeNotifier {
  HomeViewModel(this._newsRepository);

  final NewsRepository _newsRepository;

  // Backing property
  List<Article> _news = [];
  // Read only
  List<Article> get news => _news;

  Future<void> fetchNews() {
    return _newsRepository
        .getNews()
        .then((value) {
          _news = value;
        })
        .catchError((error) => handleError(error))
        .whenComplete(notifyListeners);
  }
}
```

**9–10 行目**：**ChangeNotifierProvider** は Riverpod のクラスです。HomeViewModel は ChangeNotifier を継承しているので ChangeNotifierProvider を使用することで HomeViewModel を生成し、後述する View 側で読み取ることができます。Android の Dagger でいうところの @Provides です。Riverpod は Lazy initialization なので、使用時に初期化されます。また、テスト時には overrideWithProvider/overrideWithValue メソッドを使うことで HomeViewModel の生成をモックに差し替えたりできます。Lazy initialization だと困る場合には main.dart の ProviderScope の App() を生成する付近で、Riverpod からインスタンス生成の処理を走らせておくといいみたいです。

**12 行目**：HomeViewModel は ChangeNotifier を継承しています。扱うデータは news というデータです。いわゆる Observable です。データが更新されたことを通知したい場合は notifyListeners メソッドを呼ぶことで View 側に通知することができます。_※実際のコードは AppChangeNotifier というエラーハンドリング用を含めたものを継承していますが、説明が複雑になるので割愛します。_

**13–14 行目**：HomeViewModel のコンストラクタです。NewsRepository クラスを受け取ります。

**18,20 行目**：Kotlin でいうバッキングプロパティです。news を外からでも ReadOnly で許可しています。

**22–30 行目**：NewsRepository の getNews というメソッドを使って news データを取ってきています。成功すると 26 行目で \_news に格納しています。失敗時には 28 行目の catchError でエラーハンドリングをすることとなります。また 29 行目の whenComplete は成功でも失敗でも最後によばれるので、失敗時は通知する必要ない場合には notifyListeners _の_位置を then 内にしてもいいと思います。

### View

主に Flutter Hooks が登場します。  
Flutter Hooks の HookWidget を継承しています。

```dart
// home_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'home_view_model.dart';

class HomePage extends HookWidget {
  @override
  Widget build(BuildContext context) {
    // Provider から error を取得
    final error = useProvider(appErrorProvider);

    return Scaffold(
      body: HookBuilder(
        builder: (context) {
          // HomeViewModel を取得
          final homeViewModel = context.read(homeViewModelProvider);
          // Future の実行と useMemoized でキャッシュ
          final future = useFuture(useMemoized(
            () => homeViewModel.fetchNews(),
            [homeViewModel.news.toString()],
          ));

          // UI の構築
          return ListView.builder(
            itemCount: homeViewModel.news.length,
            itemBuilder: (context, index) {
              final article = homeViewModel.news[index];
              return ListTile(
                title: Text(article.title),
                subtitle: Text(article.description),
              );
            },
          );
        },
      ),
    );
  }
}
```

**12 行目**：Flutter Hooks の HooksWidget を継承しています。これを継承しないと、useProvider などのメソッドはランタイムでエラーが発生します。

![`useContext` can only be called from the build method of HookWidget](https://cdn-images-1.medium.com/max/800/1*VZtaHualTZH4rxqsrki1mw.png)
_`useContext` can only be called from the build method of HookWidget_

Flutter Hooks を使わずに Riverpod ≥0.7.0 だけでやる場合には HookWidget を ConsumerWidget に変えて useProvider から watch にすることで同様のことが可能です。

**15 行目**：useProvider を使ってグローバル変数で定義した ChangeNotifierProvider からインスタンスをもらっています。この場合、error の値が更新されたことを受け取った場合には、この**ウィジェット全体がリビルド**されます。

**38 行目**：HookBuilder も Flutter Hooks のクラスです。このビルダーの中で useProvider で生成して、その値が変更された場合には、**この中だけでリビルド**が起こります。  
Flutter Hooks を使わずに Riverpod ≥0.7.0 だけでやる場合には Consumer で同様のことが可能です。

**40 行目**：12 行目と同様ですが、HookWidget か HookBuilder 内でないと useProvider などのメソッドは読んでもランタイムでエラーになるので注意してください。そして context.read で HomeViewModel をインスタンス化しました。もし、HomeViewModel が複数の Model を持っていて、特定の更新の時だけに絞りたい場合は、以下のように絞ることもできます。

```dart
// home_page2.dart
// 特定のプロパティの変更だけを監視する場合
final news = useProvider(homeViewModelProvider.select((value) => value.news));
```

**41 行目**：useFuture は FutureBuilder と同じ動作をします。それを簡潔にかけるようになりました。  
**43 行目**：useMemoized は AsyncMemoizer と似たよう動作で、配列で渡している Keys の値が同じならば fetchNews() 部分をキャッシュを返してリビルドしません。ここでは news データを toString したものをキーに含めています。

### Repository

[Freezed](https://pub.dev/packages/freezed) を使って Model を自動生成で作っています。ChangeNotifier で Flutter Architecture Blueprints みたいな作りをしていると copyWith を使うイメージがあまりありません。でも toString や hashCode も実装してくれるので便利です。

```dart
// article.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'article.freezed.dart';
part 'article.g.dart';

@freezed
class Article with _$Article {
  const factory Article({
    required String title,
    required String description,
    required String url,
    required String urlToImage,
    required DateTime publishedAt,
    required String content,
  }) = _Article;

  factory Article.fromJson(Map<String, dynamic> json) =>
      _$ArticleFromJson(json);
}
```

**4 行目**：[Freezed](https://pub.dev/packages/freezed) の自動生成ファイルです。  
**6 行目**：[Freezed](https://pub.dev/packages/freezed) が内部で使っている [json_serializable](https://pub.dev/packages/json_serializable) の生成ファイルです。  
**8 行目**：Freezed の生成に必要なアノテーションです。  
**9 行目**：with \_$Article をつけることで Freezed で生成されたクラスを mixin します。  
**21–22 行目**：json_serializable で生成されたメソッドを使って使いやすくします。

### Repository

NewsRepository と NewsRepositoryImpl がいます。Impl とかつけると Java っぽさ出てますね。Repository は不要そうに見えますが MVVM と Repository pattern 実現する上で、ViewModel がどこからデータを取得・更新するのかを意識させないためにビジネスロジックとデータ操作を分離することを目的としています。例えば、ネットワークの状況によってサーバから取得するか、ローカルキャッシュを使うかの決定は Repository で行ったりします。

```dart
// news_repository.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'article.dart';
import 'news_data_source.dart';

abstract class NewsRepository {
  Future<List<Article>> getNews();
}

class NewsRepositoryImpl implements NewsRepository {
  NewsRepositoryImpl(this._dataSource);

  final NewsDataSource _dataSource;

  @override
  Future<List<Article>> getNews() async {
    return _dataSource.getNews();
  }
}

// Provider
final newsRepositoryProvider = Provider<NewsRepository>(
  (ref) => NewsRepositoryImpl(ref.read(newsDataSourceProvider)),
);
```

**一番下の ファイル**：Riverpod の Provider<NewsRepository> は abstract class のほうです、クラスの型を NewsRepository とすることで、テスト時に MockNewsRepository といったクラスと作って差し替えやすいようにします。

### DataSource

Repository と同じく NewsDataSource と NewsDataSourceImpl で分かれています。DataSource は実際にサーバの API を叩いたり、ローカルから取得したりする処理を書きます。 基本的に取得先毎に DataSource を作ることが一般的だと思います。

```dart
// news_data_source.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'article.dart';

abstract class NewsDataSource {
  Future<List<Article>> getNews();
}

class NewsDataSourceImpl implements NewsDataSource {
  NewsDataSourceImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<Article>> getNews() async {
    final response = await _dio.get('/top-headlines');
    final articles = response.data['articles'] as List;
    return articles.map((e) => Article.fromJson(e)).toList();
  }
}

// Provider
final newsDataSourceProvider = Provider<NewsDataSource>(
  (ref) => NewsDataSourceImpl(ref.read(dioProvider)),
);
```

**一番下の ファイル**：Repository と同様に Riverpod の Provider<NewsDataSource> は abstract class のほうです、クラスの型を NewsDataSource とします。  
Dio の使い方については後日の別の記事で紹介します。

**あとがき**

アーキテクチャは雰囲気でやればいいです。( -ω-) \_🍵  
次からはチラシの裏みたいな記事にします。
