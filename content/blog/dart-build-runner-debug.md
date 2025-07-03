---
title: "Dart - build_runner を使った自作 package/plugin のデバッグ方法"
date: "2020-08-22"
description: "build_runnerコマンドで自動生成を行う際の、IntelliJでのデバッグ設定方法について詳しく解説"
tags: ["Dart", "Flutter", "build_runner"]
image: "/images/blog/dart-build-runner-debug.jpg"
---

わさびーふです。

![Cover image by Harley-Davidson on Unsplash](https://cdn-images-1.medium.com/max/800/1*fw4vR06sTaG2_OpTK4suEA.jpeg)

[json_serializable](https://github.com/google/json_serializable.dart) などを使った時に以下のコマンド叩くと思います。

```bash
$ flutter packages pub run build_runner build
```

Flutter アプリ (project_type: app) のデバッグをする時は、例えば Intellij などが Fluter Run Configuration を自動生成してくれるので、そんなに困ることはありませんが、build_runner コマンドで source_gen などを package/plugin を開発時にコード自動生成する過程でデバッグしたい時があります。いわゆる Flutter というよりかは Dart 側のデバッグ方法です。

[Stack Overflow](https://stackoverflow.com/questions/58628425/how-run-flutter-packages-pub-run-build-runner-build-with-debug-mode-in-intelli) で該当の記事を見つけたのですが、少し情報が不足していたので説明していきます。

よく見かけるこのようなディレクトリ構成で package を作ってるとします。パッケージとそのサンプルプロジェクトです。

```
my_generator
├── build.yaml     ※ build_runner を使う設定ファイル
├── example        ※ サンプルプロジェクト（build_runner を実行する側）
├── lib            ※ サンプルプロジェクト（build_runner を実行する側）
│ └── builder.dart ※ build_runner で実行されるビルダー
├── pubspec.lock
└── pubspec.yaml
```

Intellij の設定で説明していきます。VSCode の人は置き換えてください。

① **flutter packages pub run build_runner build** のコマンドは example 内で実行しようとしているので 自動生成されている **example/.dart_tool/build/build.dart** のパスを確認します。

![build.dart screen](https://cdn-images-1.medium.com/max/800/1*iYE5O1rfH4dsIOirRh232g.png)

② 上部にある **ADD CONFIGURATIONS** から設定していきます。

![Add Configuration screen](https://cdn-images-1.medium.com/max/800/1*6KSe4czzicniWv5tsHP2Lw.png)

③ **Dart Command Line App** を選択します。

![Add New Configuration](https://cdn-images-1.medium.com/max/800/1*K9s_zIieHWLOmmGVV1sZgg.png)

④ Run Configurations の設定を以下の通りにしていきます。  
Name：**buid.dart**  
Dart file： **example/.dart_tool/build/build.dart のパス**  
Program arguments: **build**  
Working directory：**example** **のパス**

※ チーム開発で共有するために Git 上で管理したい場合には Store as project file にチェックが必要です。

![Run/Debug Configurations screen](https://cdn-images-1.medium.com/max/1200/1*07Llwb-bJfClWpKduM04Jg.jpeg)

これで Intellij からでも以下のコマンドが叩かれることになります。

```bash
$ flutter packages pub run build_runner build
```

**※ 前回のデバッグビルドから何かしらファイルが変更されていないと再度ブレイクポイントに止まらないので注意してください。**

.idea/runConfigurations/build_dart.xml の設定内容も載せておきます。

```xml
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="build.dart" type="DartCommandLineRunConfigurationType" factoryName="Dart Command Line Application">
    <option name="arguments" value="build" />
    <option name="filePath" value="$PROJECT_DIR$/example/.dart_tool/build/generated/example/build.dart" />
    <option name="workingDirectory" value="$PROJECT_DIR$/example" />
    <method v="2" />
  </configuration>
</component>
```

## あとがき

連載は次回(｡-人-｡)
