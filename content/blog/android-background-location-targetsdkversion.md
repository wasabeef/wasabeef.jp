---
title: "[Android] targetSdkVersion (29, 30)別によるバックグラウンド位置情報取得の挙動差"
date: "2020-07-15"
description: "Android 10以降でのバックグラウンド位置情報取得における、targetSdkVersionごとの挙動の違いについて解説"
tags: ["Android", "Location", "Permission", "Android 10", "Android 11"]
image: "/images/blog/android-background-location.jpg"
---

Wasabeef のメモ書きです。下記のドキュメントを参考にしています。

参考：[Android 11 での位置情報に関する更新](https://developer.android.com/preview/privacy/location)

![Android Location](https://cdn-images-1.medium.com/max/800/1*LWMOOYCi0R0_y2Z1QTMphQ.jpeg)

前提知識として、Android 10 以降では位置情報アクセスへの権限はフォアグラウンドとバックグラウンドで分かれています。  
フォアグラウンド権限を取得後にバックグラウンド権限を取得する段階的なパターンの実装が必要となっています。

**フォアグラウンド**  
・ACCESS_COARSE_LOCATION (ネットワーク情報から)  
・ACCESS_FINE_LOCATION (GPS 情報から)  
※ この二つは同時に許可リクエストすることは可能です。

**バックグラウンド**  
・ACCESS_BACKGROUND_LOCATION

Android 9 以前ではバックグラウンド権限は暗黙的に行われているため、Android 10 以降の挙動を以下の通りで確認していきます。

**・Android 11 / targetSdkVersion 30  
・Android 11 / targetSdkVersion 29  
・Android 10/ targetSdkVersion 29, 30** (挙動同じ)

## Android 11 / targetSdkVersion 30

フォアグラウンドとバックグラウンドを同時に requestPermissions すると例外が発生するので段階的に取得するよう促す。

![Android 11 targetSdk 30](https://cdn-images-1.medium.com/max/800/1*HBFBTKUFn18bDCZOwhp-HQ.jpeg)

## Android 11 / targetSdkVersion 29

左の図のようにフォアグラウンド権限とバックグラウンド権限を同時に requestPermission しても例外は発生しないが、同時に権限を取得できるわけではないので Android 11 では段階的にリクエストする必要があります。

![Android 11 targetSdk 29](https://cdn-images-1.medium.com/max/1200/1*B3NHn-l56dSjwVlDuvotbg.jpeg)

## Android 10 / targetSdkVersion 29, 30

targetSdkVersion の違いでは挙動は変わりません。  
Android 10 まではフォアグラウンド権限とバックグラウンド権限を同時にリクエストすることは可能で、「常に許可 (Allow all the time) 」を選択するだけで、バックグラウンドでの位置情報取得が可能になりますが、Android 11 対応を考慮すると段階的に取得するような処理が必要となります。

![Android 10](https://cdn-images-1.medium.com/max/1200/1*mWQ5eonV5qamEirud3-8hw.jpeg)

雑にまとめるとこういう感じでした。