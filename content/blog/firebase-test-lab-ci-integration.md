---
title: "Firebase Test Lab を CI に組み込みませんか"
description: "Firebase Test Lab を Fastlane を使って CI に組み込む方法を解説します。Android アプリ開発において、複数のデバイスとOSバージョンでのテストを自動化し、開発プロセスの心理的安全性を高める取り組みについて紹介します。"
date: "2019-11-30"
tags: ["Android", "Firebase", "Testing", "CI/CD", "Fastlane"]
image: "https://cdn-images-1.medium.com/max/800/1*C1qiZCDWSG70fyozPRfwAA.png"
---

こんにちは、わさびーふです。  
たまにはブログ書いてみようと思います。  
この記事は、[Qiita Android Advent Calendar 2019](https://qiita.com/advent-calendar/2019/android) の1日目です。

![Logo of Firebase Test Lab](https://cdn-images-1.medium.com/max/800/1*C1qiZCDWSG70fyozPRfwAA.png)

## はじめに

この記事では Android アプリを Firebase Test Lab 上でテストさせるために、Fastlane を使って CI に組み込むことを解説しようと思います。  
内容としては以下の通りになります。

・Firebase Test Lab とは？  
・Firebase Test Lab の実行料金について💰  
・まずは手動で Firebase Test Lab を動かす  
・CI に組み込むための Plugin 紹介と設定について  
・次回以降、紹介したいこと  
・まとめ

## Firebase Test Lab とは？

> Firebase Test Lab は、アプリのテストを行うためのクラウドベースのインフラストラクチャです。1 回のオペレーションで、さまざまなデバイス、さまざまなデバイス構成で Android アプリや iOS アプリをテストし、Firebase コンソールで結果（ログ、動画、スクリーンショットなど）を確認できます。

[https://firebase.google.com/docs/test-lab/?hl=ja](https://firebase.google.com/docs/test-lab/?hl=ja)

皆さんが開発しているプロダクトなどの minSdkVersion は何を設定していますか？例えばそれが 21 とすると、21 〜 29 まで 9 つものバージョン差異が生じており、普段の開発で自分のパソコンに 9 つもの端末を繋げて実行確認するのは大変です。また、開発プロセスに QA のチーム、時間を設けていたとしてもそれまで発見できるバグなどが 1 つでもあれば発見したいものです。  
我々は、それに対する方法論の一つとして Firebase Test Lab を開発のプロセス（CI）上に組み込もうと考えました。

![Screenshot of Firebase Test Lab results](https://cdn-images-1.medium.com/max/800/1*y-QnHSyf8Vw1E1ca3KU8Wg.png)

## Firebase Test Lab の実行料金について💰

CI に組み込むともなると有料プランの検討もしないといけないので、金額の説明もしておきたいと思います。

![Firebase pricing table](https://cdn-images-1.medium.com/max/800/1*SaKVKMHdN7pEkoUZIAvQqQ.png)

[https://firebase.google.com/pricing](https://firebase.google.com/pricing)

Spark Plan 及び Flame Plan では1日に利用できる回数が決まっています。そのため、チーム開発をしていて、Pull request に組み込むことを想定し、1日10回以上は動く場合は、Blaze Plan を検討して見てください。

ただ、私が言えることは Firebase Test Lab はプロダクト開発の心理的安全性を高められることを考えると安いのではないかと捉えています。

## まずは手動で Firebase Test Lab を動かす

**Firebase console を使う場合**

**Step 1. コンソールから apk ファイルをアップロードするだけです**

[https://console.firebase.google.com/](https://console.firebase.google.com/)

わかりやすい UI になってるので細かくは説明しませんが、Firebase プロジェクトを選択して、apk をアップロードするだけでテストが開始されます。※2番目の画像にある通り、最初は最大でも $0.42 の料金になります。

![Firebase console step 1](https://cdn-images-1.medium.com/max/400/1*ZdS4YEDYtRJPwDB4_MPHeg.png)
![Firebase console step 2](https://cdn-images-1.medium.com/max/600/1*bsIiyCGYhwcXIJ84XMCEDA.png)
![Firebase console step 3](https://cdn-images-1.medium.com/max/400/1*Js5NUJBbgd9WmgU2q0YF5Q.png)

![Firebase console test matrix](https://cdn-images-1.medium.com/max/800/1*cT4Qu1_17xAqIuWNBYdx9A.png)
![Firebase console test results](https://cdn-images-1.medium.com/max/600/1*_4uVqL7DmrScbElb1ZgH5A.png)

**Google Cloud SDK を使う場合**

**Step 1. 最初に Google Cloud SDK をインストールし、初期化をしてください**

[Quickstarts | Cloud SDK | Google Cloud](https://cloud.google.com/sdk/docs/quickstarts)

**Step 2. Google Cloud SDK を使うことでコマンドでも簡単に実行できます。**

参考：[https://firebase.google.com/docs/test-lab/android/command-line](https://firebase.google.com/docs/test-lab/android/command-line)

```bash
# gcloud firebase test android run \
  --type robo \
  --app app-debug-unaligned.apk \
  --device model=Nexus6,version=24,locale=en,orientation=portrait \
  --timeout 90s
```

Step 3. Firebase Test Lab で指定することが可能なデバイス一覧は、以下のコマンドで確認ができます。

```bash
gcloud beta firebase test android models list
```

※ 2019/12/1 現在

![Device list](https://cdn-images-1.medium.com/max/800/1*2XRVEbtndwJ7f9v388GlZQ.png)

## CI に組み込むための Plugin 紹介と設定について

Firebase Test Lab を CI から動かすためにはどうすればいいかと考えたときに、Android アプリ開発で頻繁に利用されている [Crashlytics](https://firebase.google.com/docs/crashlytics) や [App Distribution](https://firebase.google.com/docs/app-distribution) では [Fastlane](https://fastlane.tools/) が使われていることから Fastlane の Plugin を自作し、組み込めるようにしました。

[cats-oss/fastlane-plugin-firebase_test_lab_android](https://github.com/cats-oss/fastlane-plugin-firebase_test_lab_android)

この **Firebase Test Lab plugin for Fastlane** を使うことで簡単に組み込むことが可能で、そのテスト結果を Slack 及び Github へ通知することができます。

※ この記事では Fastlane の詳細な利用方法などは説明しません。

![Slack notification](https://cdn-images-1.medium.com/max/800/1*_eVTJEaUQ-JTTwoflWlfKw.png)

![GitHub PR comment](https://cdn-images-1.medium.com/max/800/1*_kMk8KuYkXwByUrs76y9VA.png)

**Step 1. Firebase Test Lab plugin for Fastlane のインストール**

もし、Fastlane の導入していない場合は、以下を参考にしてください

[Setup — fastlane docs](https://docs.fastlane.tools/getting-started/android/setup/)

この **Firebase Test Lab plugin for Fastlane** を導入するのは簡単で、以下の fastlane コマンドを実行することで、Gemfile、 Gemfile.lock 及び Pluginfile が更新されます。

```bash
fastlane add_plugin firebase_test_lab_android
```

**Step 2. Fastfile を編集し、Plugin の設定を変更**

Fastfile に以下の内容をコピペしてみてください。

```ruby
default_platform(:android)

platform :android do
  desc "Runs tests on Firebase Test Lab"
  lane :test do
    # Build the debug APK
    gradle(task: "assembleDebug")
    
    # Run tests on Firebase Test Lab
    firebase_test_lab_android(
      project_id: "your-firebase-project-id",
      gcloud_service_key_file: "path/to/service-account-key.json",
      type: "robo",
      app_apk: "app/build/outputs/apk/debug/app-debug.apk",
      timeout: "10m",
      download_dir: "firebase_test_results",
      devices: [
        {
          model: "Pixel2",
          version: "27",
          locale: "ja_JP",
          orientation: "portrait"
        }
      ]
    )
  end
end
```

設定を少し抜粋して説明します。

**project_id**： Firebase のプロジェクト ID を指定

**gcloud_service_key_file**： project_id で指定したプロジェクトの権限をもったサービスアカウントの JSON を指定（後述）

**type**：最初の一歩としては robo の指定をして試すのがいいと思います。※robo テストは Firebase Test Lab が自動でコードを解析し、UIのテストケース作成・実行してくれます。

**devices**：とりあえず gist と同じでも構いません。プロジェクトにあったデバイスを設定して見てください。

**app_apk**：テスト対象の apk を指定してください。この lane が実行される前に、apk ファイルがビルドしてある必要があります。

**timeout**：テストの実行時間です、短すぎず長すぎずがいいと思います。

**download_dir**：Firebase Test Lab の結果をローカルのマシンにダウンロードしたい場合には指定をしてください。我々はその結果を使い、UI の レグレッションテストを行っています。

**extra_options**：**Firebase Test Lab plugin for Fastlane** が引数として定義されておらず、gcloud のオプションで使いたいものがある場合には、これで指定が可能です。

例えば、robo テストで、WebView や 他サービスのログインボタンなどを[除外したい場合](https://cloud.google.com/sdk/gcloud/reference/firebase/test/android/run#--robo-directives)などに指定してください。

```ruby
extra_options: "--robo-directives ignore:image_button_sign_in_twitter=,ignore:image_button_sign_in_instagram="
```

**Step 2–2. [サービスアカウント](https://cloud.google.com/iam/docs/creating-managing-service-accounts?hl=ja)**

Google Cloud の API を使うためには[サービスアカウント](https://cloud.google.com/iam/docs/creating-managing-service-accounts?hl=ja)を作成しなければなりません。もし周りに GCP 関連のアカウント管理を行っている人がいれば相談してみてください。

Firebase 用のサービスアカウントは [Firebase console](https://console.firebase.google.com/u/0/project/_/settings/serviceaccounts?hl=ja) から簡単に作ることもできます。

プロジェクト設定 ＞ サービスアカウント ＞ 「新しい秘密鍵の生成」

これにより JSON ファイルがダウンロードされるので、先ほどの ***gcloud_service_key_file*** として指定ができます。

![Service account settings](https://cdn-images-1.medium.com/max/800/1*KWjQXk_A49HVORZ-UQM4Ww.png)
![Generate new private key](https://cdn-images-1.medium.com/max/600/1*wgiRElaGRRLvZWvs8LVzdA.png)

**Step 3. CI から実行してみる**

[CircleCI](https://circleci.com/) も [bitrise](https://www.bitrise.io/) も Fastlane が簡単に実行できるように Integration されているので、基本的には以下のように先ほどの Fastfile に設定した lane を使うだけで実行ができると思います。

```bash
# fastlane [lane名] 
fastlane test
```

参考程度に我々のプロジェクトでは、どのようなデバイスでテストを行っているかもお伝えします。

**Github へ Push 時**  
我々のプロジェクトでは Github へ Push するたびに Firebase Test Lab が実行されています。ただ、その場合には実行デバイスは 1 つとしていますが、この際は、**instrumentation** テストを実行しています。

```json
{ 
   "model":"Pixel2",
   "version":"27",
   "locale":"ja_JP",
   "orientation":"portrait"
}
```

**Master branch に Merge 時**  
また、master に取り込まれた際には、minSdkVersion から最新の API Level まで 8 つのデバイスを **robo** テストで行い、それぞれ 10 分間実行するようにしています。

```json
{ 
   "model":"shamu",
   "version":"22",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"NexusLowRes",
   "version":"23",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"NexusLowRes",
   "version":"24",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"NexusLowRes",
   "version":"25",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"NexusLowRes",
   "version":"26",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"Nexus6P",
   "version":"27",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"NexusLowRes",
   "version":"28",
   "locale":"ja_JP",
   "orientation":"portrait"
},
{ 
   "model":"blueline",
   "version":"29",
   "locale":"ja_JP",
   "orientation":"portrait"
}
```

![Multiple device test results](https://cdn-images-1.medium.com/max/800/1*41Z9j5eu1RJ-18wKatuooA.png)

クラッシュすることもあります。その度に、logcat を確認し、どういう問題が起こったか把握しています。

## 次回以降、紹介したいこと

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">最近 Android アプリ開発の CI 周りのことで、チームで取り組んでること<br>● Firebase Test Lab<br>● Visual Regression Test (スクショの差分チェック)<br>● UI 操作動画の自動録画<br>● JaCoCo カバレッジレポートチェック</p>&mdash; wasabeef (@wasabeef_jp) <a href="https://twitter.com/wasabeef_jp/status/1199218445503488001?ref_src=twsrc%5Etfw">November 26, 2019</a></blockquote>

先日、Twitter で我々のチームでは、取り組みの一部をツイートしてみたら普段よりは反響があったので、これらをどうやって組み込んだかの紹介をして行けたらいいなと思っています。

これらについては、すべて Firebase Test Lab を動作させた結果を使っています。

## まとめ

現在携わっているプロジェクトでは今もなお試行錯誤しながら Firebase Test Lab 開発プロセスを組み込んだ開発を行っています。  
テストを行った全ての端末が失敗することあったり、一部の API Level だけで落ちることもあったりと、少しは事前に潰せているバグもあります。

また、AWS にも同様のシステム（[AWS Device Farm](https://aws.amazon.com/jp/device-farm/)）が存在します。Firebase Test Lab では非対応となっている Appium が対応されているなど、魅力的な一面もあります。

我々のチーム（[CATS Productivity Team](https://github.com/cats-oss)）ではこういった取り組みを推進していっています。

おしまい