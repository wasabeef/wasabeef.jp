---
title: "Android のアプリ開発でも Visual Regression Testing を始めましょう"
description: "Android アプリ開発での Visual Regression Testing の実装方法について、Firebase Test Lab と reg-suit を組み合わせた手法を解説します。"
date: "2020-01-07"
tags: ["Android", "Testing", "Visual Regression"]
image: "https://cdn-images-1.medium.com/max/800/0*cwJlsNMFTwpF5Ay7.jpg"
---

新年明けましておめでとうございます。わさびーふです。

今年からプロダクト開発を技術でより良くするために私たちのチームで取り組んでいる Tips や Tools などの紹介をしていきたいと思います。

## はじめに

Android アプリ開発界隈では、Web 方面に比べると Visual Regression Testing の話題が少ないように感じています。Web 方面では、数年前から [Storybook](https://storybook.js.org/) と [reg-viz/reg-suit](https://reg-viz.github.io/reg-suit/) を組み合わせて UI 変更時の品質担保やレビューの負担軽減などを取り組んでいるようだったので、私たちのチームでは Web/iOS/Android で、お互いに良い仕組みなどをどんどん取り入れて行こうと考えています。

参考： [Storybook と reg-suit で気軽にはじめる Visual Regression Testing](https://blog.wadackel.me/2018/storybook-chrome-screenshot-with-reg-viz/)

*この記事の内容としては以下の通りになります。*

- Visual Regression Testing とは？
- reg-suit とは？
- Firebase Test Lab と reg-suit を組み合わせ使うには？
  - Step1. Instrumentation Test で画面のスクリーンショットを撮る
  - Step2. Firebase Test Lab plugin for fastlane を使ってローカルにスクリーンショット画像を取得する
  - Step3. CI 上で reg-suit を実行する

## Visual Regression Testing とは？

Visual Regression Testing は日本語でいうと視覚的回帰テスト、画像回帰テストなどになると思います。  
概念自体は複雑に捉えずに簡単に説明すると、人間が主に UI 関するコードの変更を行った際に `変更前と変更後の2枚の写真をピクセル比較するテスト` で、開発現場では Github で Pull-request が作られたタイミングで自動的にテストを行うことで回帰が発生しているかどうかを確認します。

例えば Android アプリ開発に Visual Regression Testing を行うことで、このような見逃しがちな変更時にもプルリクエストのレビュー時などで簡単に視覚的に気づくことができます。

- 左右のマージンを `24dp` から `16dp` に変更した。
- themes.xml の colorPrimary の RGB 値を `#051327` から `#040F1F` に変更した。
- TextView に設定している `Hello World!` から `Hello, World!` strings.xml を変更した。

などなど…

![変更前と変更後の 2 枚の写真を ImageMagick の compare コマンドで差分を抽出した画像](https://cdn-images-1.medium.com/max/800/0*Qtzg-4fyPYfaUbNX.jpg)
*※ 変更前と変更後の 2 枚の写真を ImageMagick の compare コマンドで差分を抽出した画像*

### Visual Regression Testing は End-to-End Testing ではない

あくまで、ここで説明するものは、**変更前と変更後の2枚の写真をピクセル比較するテスト**です。  
「いいねボタンを押して、サーバに正常に通信が行われたかどうか？」「音声・動画が正常に再生されているか」などの機能に回帰が起こっているかどうかを判断するのは難しいと思います。  
どういうコンポーネント単位でスクリーンショットを撮るか、どのタイミングで撮れば確認したい状態の画面になっているか、などはこれらの実装の設計次第になります。

また、View のアニメーションや画面間の Transition などはアニメーション中のフレームを全部同じ FPS で撮らない限り難しいです。

## reg-suit とは？

![reg-suit](https://cdn-images-1.medium.com/max/800/0*cwJlsNMFTwpF5Ay7.jpg)

Visual Regression Testing のために開発されたツールです。  
変更前と変更後の差分を検知して、 **かなり**わかりやすい形で HTML のレポートを（AWS S3、Google Cloud Storage などに）出力してくれます。 また、 **比較に使用する画像自体は自分で用意する**必要があります。  
reg-suit はただのコマンドラインツールでもあるので、ローカル環境でも動作することができます。

![reg-suit の画像で提供している機能の一部](https://cdn-images-1.medium.com/max/800/1*0_IrBFmE-tVGYt2C8vRV1g.gif)
*※reg-suit の画像で提供している機能の一部*

## Firebase Test Lab と reg-suit を組み合わせ使うには？

Firebase Test Lab と reg-suit を組み合わせ使うには理由があります。

前述の通り reg-suit 自体には画像自体を生成する機能はないため、ネイティブでは何かしらのライブラリや自前でスクリーンショットを撮る仕組みを用意しなければなりません。Instrumentation Test を実行し、そのテストランナー上でスクリーンショットを撮る必要があります。  
エミュレータを実行して、その上で撮ることももちろんできますが、Firebase Test Lab で行うことで、テストケース毎の Logcat の解析や動画も確認、パフォーマンスモニタリングも同時に行うことができます。

※ Web のほうでは Storybook の各ストーリーをスクリーンショット撮るために [reg-viz/storycap](https://github.com/reg-viz/storycap) が提供されています。

### Step1. Instrumentation Test で画面のスクリーンショットを撮る

スクリーンショットを撮るためのライブラリはいくつか公開されています。やっていること自体はどれもほとんど同じなので、使いやすいものを使って良いと思います。私たちのチームでは使いやすいように自前で実装していますが、そのうち公開したいと思います。  
※実装自体はあんまり難しくはないです。

**注意点**

1. Firebase Test Lab では `/sdcard/screenshots` に保存された画像を全て GCS に保存してくれるので、保存する場合はこの PATH にしましょう。
2. Bitmap を扱うので、メモリリークに注意する。  
   （テスト時の AndroidManifest.xml に**だけ** `largeHeap` を有効にしたり）  
   （Bitmap#Compress 時に`format=JPEG`, `quality=90` にしたり）

**Firebase 公式**  
Firebase の公式ドキュメントでも、この記事のように aar をダウンロードという形で提供しているので、あまり良い気はしませんがシンプルではあります。  
※`/sdcard/screenshots` に保存されます。  
[Firebase Test Lab インストゥルメンテーション テストのスクリーンショットを作成する](https://firebase.google.com/docs/test-lab/android/test-screenshots)

```kotlin
// Firebase Test Lab Screenshot Library の使用例
import com.google.android.libraries.cloudtesting.screenshots.ScreenShotter

@Test
fun testTakeScreenshot() {
    // アプリの UI をセットアップ
    
    // スクリーンショットを撮る
    ScreenShotter.takeScreenshot("main_screen", activity)
}
```

**Google 製**  
保存時の PATH 指定はできず `/sdcard/Pictures` に保存されてたのでやめました。  
[androidx.test.runner.screenshot](https://developer.android.com/reference/androidx/test/runner/screenshot/package-summary)

**Facebook 製**  
width の指定などもできて高機能ですが、数ヶ月前に試した時は動作しませんでした。  
[facebook/screenshot-tests-for-android](https://github.com/facebook/screenshot-tests-for-android)

**jraska/Falcon**  
スクリーンショットを撮ることにだけに特化しているので一番シンプルな作りで、結局私たちはこれを参考にしました。  
[https://github.com/jraska/Falcon](https://github.com/jraska/Falcon)

### Step2. Firebase Test Lab plugin for fastlane を使ってローカルにスクリーンショット画像を取得する

Firebase Test Lab をどうやって動作させるかについては、以前に記事を書いたのでこちらを参考にしてください。  
[Firebase Test Lab を CI に組み込みませんか](https://cats-234205.web.app/2020/firebase-testlab-with-ci/)

**注意点**

1. **type** を `instrumentation` を設定する。(**必須**)
2. **devices** は複数指定せずに、1 台からやってみる。
3. **timeout** をテストケース数によるがいったん長めに設定してみる。
4. **download_dir** のローカル保存先を指定する。(**必須**)

以下は私の環境でのサンプルですが、これを実行することにより、fastlane を実行した端末の `.results` にスクリーンショットが保存されていることを確認できます。

```ruby
# Fastfile
lane :visual_test do
  firebase_test_lab_android(
    project_id: "your-firebase-project-id",
    gcloud_service_key_file: "path/to/service-account.json",
    type: "instrumentation",
    app_apk: "app/build/outputs/apk/debug/app-debug.apk",
    android_test_apk: "app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
    devices: [
      {
        model: "Pixel2",
        version: "28",
        locale: "ja_JP",
        orientation: "portrait"
      }
    ],
    timeout: "30m",
    download_dir: ".results"
  )
end
```

### Step3. CI 上で reg-suit を実行する

reg-suit では画像の保存先に、 [AWS S3](https://aws.amazon.com/jp/s3/) や [Google Cloud Storage](https://cloud.google.com/storage/) を指定することができます。  
また、Github や Slack への通知機能などへの通知ができます。

この記事では reg-suit の設定を要点を絞って説明しているため、詳しくは以下を確認してください。 参考： [https://github.com/reg-viz/reg-suit](https://github.com/reg-viz/reg-suit)

まずは reg-suit の設定ファイルを作成

```bash
$ npm install -g reg-suit
$ reg-suit init
```

以下を実現するために、init 時にプラグインを 3 つ追加しています。

1. git hash 単位で比較する。
2. GitHub の Pull-request 時にコメントを追加する。
3. HTML レポートの出力先を Google Cloud Storage にする。

GitHub に通知するには reg-suit の GitHub Apps を設定する必要があります。

GitHub Apps： [https://github.com/apps/reg-suit](https://github.com/apps/reg-suit)

***※ json 上のコメントは説明するために敢えて記載しているので消してください。***

```json
{
  "core": {
    "workingDir": ".reg",
    "actualDir": ".results/screenshots", // Firebase Test Lab から取得した画像が格納されている場所
    "thresholdRate": 0,
    "ximgdiff": {
      "invocationType": "client"
    }
  },
  "plugins": {
    "reg-keygen-git-hash-plugin": {
      "expectedKey": "HEAD~", // 比較元を直前の commit hash にする
      "actualKey": "HEAD"
    },
    "reg-notify-github-plugin": {
      "clientId": "your-github-app-client-id"
    },
    "reg-publish-gcs-plugin": {
      "bucketName": "your-gcs-bucket-name"
    }
  }
}
```

**CI 上で reg-suit run を実行する**  
以下の設定は CircleCI の YAML ですが、どの CI を使っても同じようなやり方になるかと思います。  
私たちのチームでは `reg-suit run` を実行する前に ImageMagick を使ったりしていますが、みなさんの環境で必要なければ入れなくても大丈夫です。

※ ローカル環境でも実行できるので、CI 上で実行する前にローカルで `reg-suit run` を走らせてみるのが良いと思います。

```yaml
version: 2.1

jobs:
  visual-regression-test:
    docker:
      - image: circleci/android:api-29-node
    steps:
      - checkout
      
      # Firebase Test Lab でスクリーンショットを取得
      - run:
          name: Run Firebase Test Lab
          command: bundle exec fastlane visual_test
      
      # reg-suit の実行
      - run:
          name: Install reg-suit
          command: npm install -g reg-suit
      
      - run:
          name: Run reg-suit
          command: reg-suit run
          environment:
            REG_NOTICE_CLIENT_ID: $REG_GITHUB_CLIENT_ID
            GOOGLE_APPLICATION_CREDENTIALS: $GCS_SERVICE_ACCOUNT_KEY_PATH

workflows:
  visual-test:
    jobs:
      - visual-regression-test:
          filters:
            branches:
              ignore: main
```

成功した場合は、以下のようにコメントが追加されます

![GitHub PR コメント](https://cdn-images-1.medium.com/max/800/0*B9HSMWqgDLPnFTnG.jpg)

## 雑記

今年はブログをそこそこ書いていく所存です。  
そして、今年から GitHub Sponsors の申請が承認されたので、何卒何卒… m(⁎⁍̴̆Ɛ⁍̴̆⁎)m

次からはチラ裏くらいの記事をしていきたい、おしまい