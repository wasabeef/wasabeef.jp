---
title: "Flutter で Null Safety を有効にする"
date: "2020-08-03"
description: "FlutterでNull Safetyを有効にする方法について、Beta版での設定手順とマイグレーションツールの使い方を解説"
tags: ["Flutter", "Dart", "Null Safety"]
image: "/images/blog/flutter-null-safety.png"
---

わさびーふです。  
Flutter で 現段階(2020/11/20)の Beta 機能である Null Safety を使う場合の設定を載せておきます。

![Flutter Null Safety](https://cdn-images-1.medium.com/max/800/1*68k6w8FfHgrT_H8OTVM1rw.png)

## 1. Flutter と dart を Beta channel にする

```bash
$ flutter channel beta
```

## 2. pubspec.yaml の sdk を **2.12.x–x** 以上を指定する

```yaml
environment:
  sdk: ">=2.12.0-0 <3.0.0"
```

## 3. pub get する

```bash
flutter pub get
```

## 4. マイグレーション、手直し

以下のコマンドを実行することでマイグレーションツールがブラウザで起動することができます。

```bash
dart migrate
```

![Migration tool](https://cdn-images-1.medium.com/max/800/1*8Hezq8pO6n8YNhzhcbdoeg.png)

## 注意点

他のパッケージに依存している場合はそれら依存関係の準備ができていることを確認してください。

```bash
flutter pub outdated --mode=null-safety
```

## 参考資料

<iframe src="https://www.youtube.com/embed/iYhOU9AuaFs?start=1&feature=oembed" width="700" height="393" frameborder="0" scrolling="no"></iframe>

[Sound null safety | Dart](https://dart.dev/null-safety)  
[Understanding null safety | Dart](https://dart.dev/null-safety/understanding-null-safety)  
[Announcing Dart null safety beta](https://medium.com/dartlang/announcing-dart-null-safety-beta-87610fee6730)

おしまい。