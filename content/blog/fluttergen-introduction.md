---
title: "コード自動生成の FlutterGen を作りました。"
description: "Flutter 向けに画像リソースなどのコードを自動生成するためのツールです。"
date: 2020-09-07
tags: ["flutter", "dart", "development-tools", "open-source"]
image: "https://cdn-images-1.medium.com/max/800/1*HhHR21Cy-ziyWKkmmH7jQw.jpeg"
---

[わさぎゅー](https://www.8044.jp/brand/)になりました。

さて、今回は初めて [pub.dev](https://pub.dev/) に Flutter 向けの Package を [lcdsmao](https://twitter.com/lcdsmao) さんと一緒に作ったのでその紹介です。

![FlutterGen's Logo](https://cdn-images-1.medium.com/max/800/1*HhHR21Cy-ziyWKkmmH7jQw.jpeg)

Android (AAPT) には R.java というものがあります。
主に画像や文字列などのリソースをプロジェクトの所定の場所 ( `res/`) に置くと、そのリソースへ安全にアクセス出来るようにするための R.java が**自動生成**されます。
なので Android においてリソースを文字列 ( `"res/drawable/logo.png"`) で指定するようなことはありません。

Xcode には自動生成される機能がないので、このアイデアを元に Swift では [R.swift](https://github.com/mac-cain13/R.swift) や [SwiftGen](https://github.com/SwiftGen/SwiftGen) といったサードパーティのツールがあります。

Flutter でも Xcode と同様で自動生成される機能はなく、 pubspec.yaml の assets に指定したリソースを文字列で指定しないといけません。これらの手間とリスクをなるべくなくせるように [**FlutterGen**](https://github.com/FlutterGen/flutter_gen) を作りました。

[FlutterGen/flutter_gen](https://github.com/FlutterGen/flutter_gen)
*The Flutter code generator for your assets, fonts, colors, ... - Get rid of all String-based APIs. Inspired by…*

pubspec.yaml で画像などのリソース設定に関する詳細は[公式ドキュメント](https://flutter.dev/docs/development/ui/assets-and-images)を参照してください。

[FlutterGen](https://github.com/FlutterGen/flutter_gen) を使っていない場合には下記のようなエラーが起こるかもしれません。

pubspec.yaml にこのように設定したとします。

```yaml
flutter:
  assets:
    - assets/images/
```

使う側では Image class に PATH 文字列を指定することになります。

```dart
Image(image: AssetImage('assets/images/profile.jpeg'))
```

もしタイポしていた場合は気づきにくいと思います。実際に上記の例だと、拡張子が間違っているので実行時にエラーになります。

```
The following assertion was thrown resolving an image codec:
Unable to load asset: assets/images/profile.jpeg
```

それを以下のようにタイプセーフに指定できるのであればエラーを防ぐことができると思います。

```dart
Assets.images.profile.image(
  width: 120,
  height: 120,
)
```

それを出来るようにしたのが [**FlutterGen**](https://github.com/FlutterGen/flutter_gen) です。
既に同様の目的をもった Plugin がありましたが、[**FlutterGen**](https://github.com/FlutterGen/flutter_gen) をお勧めするポイントも説明していきます。

README に使い方などは書いてあるのですが、ここでは日本語でわかりやすく伝えていきたいと思います。

## インストール

Homebrew、Dart Command-line と build_runner 実行の 3パターン用意してあります。

**1. Homebrew として使う**
一番馴染みがある方法だと思います。
後述する build_runner を使った方法とは違い、[json_serializable](https://pub.dev/packages/json_serializable) や [freezed](https://pub.dev/packages/freezed) とは独立して実行が可能なので、**生成処理が速い**です。
また、Flutter プロジェクトをマルチモジュールのように分けている場合などに、pubspec.yaml の指定ができるので使い勝手がいいと思います。

```bash
$ brew install FlutterGen/tap/fluttergen
$ fluttergen -h
$ fluttergen
```

**2. Dart Command-line として使う**
[FlutterGen](https://github.com/FlutterGen/flutter_gen) は Flutter SDK に依存せずに作ってあるので、Dart のコマンドとして使うことができます。Homebrew と同じく、**生成処理が速い**です。

```bash
$ dart pub global activate flutter_gen
$ fluttergen -h
$ fluttergen
```

**3. build_runner に依存して使う**
build_runner は `pubspec.yaml` の位置が固定のプロジェクトルートになっています。また、build_runner を実行すると [json_serializable](https://pub.dev/packages/json_serializable) や [freezed](https://pub.dev/packages/freezed) も一緒に実行されるために時間がかかります。ただ、一般的な Flutter プロジェクトだとこれで問題なく、 json_serializable などと同様にシンプルに使えます。

まずは `pubspec.yaml`に **build_runner** と **flutter_gen_runner** を追加してください。

```yaml
dev_dependencies:
  build_runner: ^1.10.3
  flutter_gen_runner: ^1.0.3
```

flutter pub get コマンドで Package をダウンロードしたら build_runner を次のように実行してください。

```bash
$ flutter packages pub run build_runner build
```

## 設定

まずは pubspec.yaml の全体像はこういう感じです。

```yaml
# pubspec.yaml
# ...

flutter_gen:
  output: lib/gen/ # Optional (default: lib/gen/)
  lineLength: 80 # Optional (default: 80)

  integrations:
    flutter_svg: true

flutter:
  uses-material-design: true
  assets:
    - assets/images/

  fonts:
    - family: Raleway
      fonts:
        - asset: assets/fonts/Raleway-Regular.ttf
        - asset: assets/fonts/Raleway-Italic.ttf
          style: italic
```

Flutter apps 標準の `**flutter**` に加えて `**flutter_gen**`の設定を使います。

`**flutter_gen**` の設定には `**output**` と `**lineLength**` を指定することができます。

`**output**` : 自動生成されるコードの出力先を指定することができます。
他の Plugin は `lib`直下固定の生成になってることが多いです。

`**lineLength**` : 自動生成されるコードの Line length（コードの横幅）を指定することができます。 80 から変更することのほうが少ないと思いますが、変更している場合には自動生成されるコードも合わせておかないと `**flutter format**` コマンドで `-l 100`など指定している場合は差分がでてしまいます。
他の Plugin は指定することが出来ないものが多いです。

## アセット（画像など）

[FlutterGen](https://github.com/FlutterGen/flutter_gen) の話ではないですが Flutter は[公式ドキュメントによると](https://flutter.dev/docs/development/ui/assets-and-images) assets/image/ と指定した場合はそれ以下のサブディレクトリ内を再帰的に検索しにいかないので注意が必要です。

pubspec.yaml の `flutter: `に以下のように assets を設定するサンプルがあるとします。
assets は画像だけではなく、json など指定することができます。

```yaml
flutter:
  assets:
    - assets/images/
    - assets/images/chip3/chip.jpg
    - assets/images/chip4/chip.jpg
    - assets/images/icons/paint.svg
    - assets/json/fruits.json
    - pictures/ocean_view.jpg
```

`**"assets/images/chip.png"**` の指定に対して [FlutterGen](https://github.com/FlutterGen/flutter_gen) は `**Assets.images.chip**` までクラス・変数が生成されます。

対象のファイルが Flutter の対応画像フォーマットの場合は Image class として使えるように生成されます。

`**Assets.images.chip**` : の指定では [AssetImage class](https://api.flutter.dev/flutter/painting/AssetImage-class.html) として使えます。
下記のコードのように Image class に渡すことで描画することができます。

`**Assets.images.chip.image(...)**` : は [Image class](https://api.flutter.dev/flutter/widgets/Image-class.html) をとして使えます。
そのまま描画することができます。また `width` `height` `fit` など Image class が持つパラメータを一緒に渡せます。

`**Assets.images.chip.path**` : の指定ではそのまま String として使えます。

```dart
Widget build(BuildContext context) {
  return Image(image: Assets.images.chip);
}

Widget build(BuildContext context) {
  return Assets.images.chip.image(
    width: 120,
    height: 120,
    fit: BoxFit.scaleDown,
  );
Widget build(BuildContext context) {
  // Assets.images.chip.path = 'assets/images/chip3/chip3.jpg'
  return Image.asset(Assets.images.chip.path);
}
```

Flutter が対応していない画像やその他のファイルは Image class などにならずにそのまま String 変数として生成されます。
SVG ファイルは [flutter_svg](https://pub.dev/packages/flutter_svg) などにそのまま String 変数を渡すことができます。JSON も同様です。

```dart
Widget build(BuildContext context) {
  return SvgPicture.asset(Assets.images.icons.paint);
}
```

[FlutterGen](https://github.com/FlutterGen/flutter_gen) は assets で指定されている階層をクラスと変数で表現することを重視しています。
当初はディレクトリの情報を削って `**assets/images/chip3/chip.jpg**` を `**Assets.chip**` として生成するように考えていました。そうするとディレクトリが違うが同じファイル名の `**assets/images/chip4/chip.jpg**` のような場合だと生成する変数名が被ってしまいます。
また、それを回避するために `Assets.ASSETS_IMAGES_CHIP3_CHIP` と生成してみると IDE で Assets. まで打った後の補完で表示されるときに画像もそれ以外も全て一覧化され、少しばかり見辛いと思いました。
他の Plugin ではこのどちらかになっていることが多いです。

[FlutterGen](https://github.com/FlutterGen/flutter_gen) では以下のように**階層をそのまま表現して生成する方針**をとっています。一番最初の **assets** か **asset** というディレクトリ名は冗長となるので省略しています。

```
assets/images/chip/chip.jpg   => Assets.images.chip3.chip
assets/images/chip4/chip.jpg  => Assets.images.chip4.chip
assets/json/fruits.json       => Assets.json.fruits
assets/images/icons/paint.svg => Assets.images.icons.paint
pictures/ocean_view.jpg       => Assets.pictures.oceanView
```

## インテグレーション

もう一つ紹介しておきたい機能はインテグレーションです。
Flutter では SVG のサポートが Flutter SDK には含まれていません。
SVG を表示したい場合には有名なところでいうと [flutter_svg](https://pub.dev/packages/flutter_svg) を使うことが多いかと思います。そして [flutter_svg](https://pub.dev/packages/flutter_svg) への SVG ファイルパスの指定も文字列で行わないといけません。

```dart
Widget build(BuildContext context) {
  return SvgPicture.asset("assets/images/icons/paint.svg");
}
```

[FlutterGen](https://github.com/FlutterGen/flutter_gen) では今後の拡張も考えて integrations 設定を用意しています。以下のように設定することで SVG ファイルの場合には flutter_svg の `SvgPicture` を出力することができます。

```yaml
flutter_gen:
  integrations:
    flutter_svg: true
```

これで使う側もタイプセーフになりました。

```dart
Widget build(BuildContext context) {
  return Assets.images.icons.paint.svg(
    width: 120,
    height: 120
  );
}
```

## フォント

[FlutterGen](https://github.com/FlutterGen/flutter_gen) はフォントにも対応しています。
フォントも TextStyle に pubspec.yaml の family に指定した文字列を使わないといけません。

```dart
Text(
  'Hi there, I\'m FlutterGen',
  style: TextStyle(
    fontFamily: 'Raleway',
  ),
)
```

[FlutterGen](https://github.com/FlutterGen/flutter_gen) では`**FontFamily.raleway**` のように自動生成されるので TextStyle に指定することができます。

```dart
Text(
  'Hi there, I\'m FlutterGen',
  style: TextStyle(
    fontFamily: FontFamily.raleway,
    fontFamilyFallback: const [FontFamily.roboto],
  ),
)
```

## カラー

[FlutterGen](https://github.com/FlutterGen/flutter_gen) はカラーにも対応しています。実際使う機会がほとんどないとは思いますが、Android の colors.xml を Flutter に移行用途などのための機能です。
これは `flutter` ではなく `**flutter_gen**` に以下のように設定します。
XML に対応しています。

```yaml
flutter_gen:
  colors:
    inputs:
      - assets/color/colors.xml
```

XML は Android と一緒ですが、拡張機能として `type="material"` を指定することもできます。これは指定された HEX を元に計算して [MaterialColor class](https://api.flutter.dev/flutter/material/MaterialColor-class.html) を生成します。

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="milk_tea">#F5CB84</color>
    <color name="cinnamon" type="material">#955E1C</color>
</resources>
```

```dart
Text(
  'Hi there, I\'m FlutterGen',
  style: TextStyle(
    color: ColorName.denim,
  ),
)
```

[FlutterGen](https://github.com/FlutterGen/flutter_gen) では`**ColorName.milkTea**` のように生成されるのでこれも TextStyle に指定することができます。

```dart
Text(
  'Hi there, I\'m FlutterGen',
  style: TextStyle(
    color: ColorName.milkTea,
  ),
)
```

[FlutterGen](https://github.com/FlutterGen/flutter_gen) の現状の機能は以上です。

生成されたコードのサンプルなどは [FlutterGen](https://github.com/FlutterGen/flutter_gen) の [README](https://github.com/FlutterGen/flutter_gen) を載せてあるので見にいってください。

## 今後について

[FlutterGen](https://github.com/FlutterGen/flutter_gen) は個人のリポジトリに置かずに [FlutterGen](https://github.com/FlutterGen/) という Github Organization の元に作りました。こちらのほうが SwiftGen のようにコントリビュートしやすいかもしれないと思ったからです。

もし興味がある方はコントリビュータになってみませんか？
今後については 以下の様な機能が実現可能か、必要かなどを考えています。

・インテグレーションを増やす（アイデアがあれば）
・ローカライズの自動生成、intl よりもっと簡単に
・Platform channels コードの自動生成
・R.java のようにコマンドを実行することなく完全に自動生成（watch）

Intellij Idea や VSCode への拡張機能として提供するか悩みましたが、build_runner でコマンド実行に慣れているエンジニアの方が多いと思いますので優先度は高くありません。コアコントリビュータが増えたりしたら嬉しい限りです。

## あとがき

同じ会社の [lcdsmao](https://twitter.com/lcdsmao) はまだ 2 年目で末恐ろしく学ぶことが多い (;￣3￣)