---
title: "[Android] Ktlint を Git Hooks に入れてみた"
date: "2020-01-24"
description: "Ktlintを使ってGit Hooksでコードスタイルを自動チェックする方法について、HuskyやGradle pluginでの設定方法を解説"
tags: ["Android", "Kotlin", "Ktlint", "Git Hooks", "Development Tools"]
image: "/images/blog/ktlint-git-hooks.png"
---

わさびーふです。

## はじめに

このブログ自体を Hugo で作っているんですけど、先日、それらの Lint に同僚が Git Hooks で設定してくれていて、「やっぱり Ktlint でも ESLint でも Lint は Git Hooks でやるのが便利だなぁ」と思ったので記事にしました。

内容は以下の通りです。

- Ktlint とは
- Git Hooks とは
- Husky で Git Hooks を設定する
- Gradle plugin で Git Hooks を設定する

## Ktlint とは

[https://github.com/pinterest/ktlint](https://github.com/pinterest/ktlint)

Ktlint とは、Kotlin 向けに Lint と Format 機能を備えたツールです。

例えば、自分の書いた Kotlin コードが [公式のコーディング規約](https://kotlinlang.org/docs/reference/coding-conventions.html) に則っているかをチェックし、修正することができます。

以下は、Ktlint でチェックできるスタイルの一例です。

```kotlin
// 良い例
fun greet(name: String) {
    println("Hello, $name!")
}

// 悪い例
fun greet(name:String){
    println("Hello, $name!")
}
```

## Git Hooks とは

[https://githooks.com/](https://githooks.com/)

git の様々なタイミングで任意のスクリプトなどを実行できる仕組みです。 自分の `.git/hooks` 以下の覗いてみてくだい。

特に何もしていない場合には、そこには `pre-push.sample` や `pre-commit.sample` があるかと思います。 例えば、 `pre-push` というファイルを作り、そこに動作させたいスクリプトを書くと git push 前に動作させることができます。

## Husky で Git Hooks を設定する

[https://github.com/typicode/husky](https://github.com/typicode/husky)

husky は npm で管理されているので、npm install を行います。

```bash
% npm install husky --save-dev
```

設定は簡単で、 `package.json` の husky.hooks.pre-push/pre-commit に追加するだけです。

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "./gradlew ktlintCheck"
    }
  }
}
```

```bash
% git commit -m "commit comment" 
husky > pre-commit (node v13.7.0)
Configuration on demand is an incubating feature.

> Configure project :app
...
...
BUILD SUCCESSFUL in 16s
```

## Gradle plugin で Git Hooks を設定する

Gradle でやりたい場合は、すたぜろさんが作っていたのを使いましょう。

[https://github.com/STAR-ZERO/gradle-githook](https://github.com/STAR-ZERO/gradle-githook)

## 最後に

Git Hooks にさえ登録できれば手段については、チームメンバーと相談してみてください。 割と私は Android プロジェクトでも package.json や Gemfile を置いたりするので、チームによって使いやすいツールは様々かもしれません。

おしまい