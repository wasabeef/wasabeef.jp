# wasabeef.jp

Daichi Furiya のポートフォリオサイト。Next.js 15 と Tailwind CSS で構築された静的サイトです。

## 🚀 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: shadcn/ui
- **パッケージマネージャー**: Bun
- **デプロイ**: Cloudflare Pages
- **コンテンツ管理**: Markdown (Gray Matter)
- **シンタックスハイライト**: Prism.js

## 📁 プロジェクト構成

```
├── app/                    # Next.js App Router
│   ├── blog/              # ブログページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # トップページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── blog-card.tsx     # ブログカードコンポーネント
│   ├── markdown-renderer.tsx # Markdown描画
│   └── share-buttons.tsx # シェア機能
├── content/              # コンテンツファイル
│   └── blog/            # ブログ記事 (Markdown)
├── lib/                 # ユーティリティ関数
│   ├── blog.ts         # ブログ関連の処理
│   ├── config.ts       # サイト設定
│   └── utils.ts        # 共通ユーティリティ
└── public/             # 静的ファイル
```

## 🛠️ 開発

### 前提条件

- Node.js 18 以上
- Bun

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/wasabeef/wasabeef.jp.git
cd wasabeef.jp

# 依存関係のインストール
bun install

# 開発サーバーの起動
bun dev
```

開発サーバーは http://localhost:3000 で起動します。

### ビルド

```bash
# 本番用ビルド
bun build

# 静的ファイルの確認
bun start
```

## 📝 ブログ記事の追加

1. `content/blog/` ディレクトリに新しい Markdown ファイルを作成
2. フロントマターを設定:

```yaml
---
title: "記事のタイトル"
description: "記事の説明"
date: 2024-01-01
tags: ["Tag1", "Tag2", "Tag3"]
image: "https://example.com/image.jpg"
---
記事の内容をここに書く...
```

## 🚀 デプロイ

このサイトは Cloudflare Pages にデプロイされています。

### Cloudflare Pages 設定

```bash
# ビルドコマンド
bun run build

# 出力ディレクトリ
out
```
