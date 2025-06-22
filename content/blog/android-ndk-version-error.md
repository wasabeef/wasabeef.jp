---
title: "Android でビルド時に No version of NDK matched the requested… というエラーが出る場合の理由と対処"
date: "2020-11-11"
description: "Android Gradle PluginのバージョンアップでCI環境で発生するNDKバージョンエラーの原因と解決方法を解説"
tags: ["Android", "NDK", "Build Error"]
image: "/images/blog/android-ndk-version-error.png"
---

わさびーふです。

Android Gradle plugin のバージョンアップした時などに手元の PC では 発生しないのに CircleCI や GitHub Actions 上で発生するこのエラーです。

Flutter でアプリを作っていたとしても、Android のビルド時に発生します。

![Error on Github Actions](https://cdn-images-1.medium.com/max/800/1*wgllwRGWoq8IzOUxGRv4ag.png)

> No version of NDK matched the requested version 2***.0.6***3669. Versions available locally: 2***.3.6528***47

このエラーです。ざっくり説明していくと

**「2***.0.6***3669** を NDK のバージョンとして指定しているが、ビルド環境では **2***.3.6528***47** じゃないとだめだよ」

といった内容です。

NDK の指定もしていないし、NDK を使うようなコードも書いてなかったとしてもこれは発生します。

## 理由

今回は Android Gradle Plugin 4.0.0 を使っていました。

```gradle
buildscript {
    ext.kotlin_version = '1.4.10'
    repositories {
        google()
        jcenter()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:4.0.0' // ★
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

Android Gradle Plugin のバージョンによって NDK のデフォルトが指定されているので、自分で build.gradle に設定していない限りは、以下の図に対応したバージョンのインストールが必要となります。  
ここには書いていないマイナーバージョンによってデフォルトが違います。

[Install and configure the NDK and CMake | Android Developers](https://developer.android.com/studio/projects/install-ndk#default-ndk-per-agp)

![NDK Default Versions](https://cdn-images-1.medium.com/max/800/1*IMTOfXQE34v6RVQlNEKvdA.png)

*※歴史的には Android Gradle Plugin 3.5 から NDK side by side として仕組みが変わり複数のバージョンをインストールできるようになりました。*

手元の PC で Android SDK Manager でインストール済みの NDK を確認してみると、**2***.0.6***3669 (21.0.6113669)** がインストール済みだったので発生していませんが。。

![Android SDK Manager](https://cdn-images-1.medium.com/max/800/1*6i-47LcMkETDimtvO7RzGg.png)

GitHub Actions の ubuntu-latest (Ubuntu 18.04.5 LTS) では以下のリンクからインストール済みの環境を確認すると **21.3.6528147** がインストールされていることがわかりました。

[actions/virtual-environments](https://github.com/actions/virtual-environments/blob/main/images/linux/Ubuntu1804-README.md)

![GitHub Actions Environment](https://cdn-images-1.medium.com/max/800/1*5rKa8ah8MTYQFSW03YrQ-g.png)

エラーに書いてあった Versions available locally: 2***.3.6528***47 と一致しますね。  
*※ 実際には GitHub Actions はここに書かれたバージョン以外もインストールされていることがあります。*

## 対処

対処方法は以下の二通りです。

**Android Gradle Plugin のバージョンをそのビルド環境で用意されている NDK に合わせる**

GitHub Actions はこれでいけました。

```gradle
buildscript {
    ext.kotlin_version = '1.4.10'
    repositories {
        google()
        jcenter()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:4.1.0' // ★
        ...
    }
}
```

**デフォルト設定に任せるのではなく、build.gradle に設定を書く**

NDK に Android Gradle Plugin を合わせるのは本末転倒な気もしますし、こういった環境依存のバージョンを指定するのもいい気分ではないですが、以下のように設定することもできます。

```gradle
android {
    ndkVersion "21.3.6528147" // 執筆時点のバージョン
}
```

## あとがき

スタートアップに投資できるくらいのお金持ちになりたい