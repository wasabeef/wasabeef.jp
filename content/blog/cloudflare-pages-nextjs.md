---
title: Next.js を Cloudflare Pages にデプロイする
description: Next.js アプリケーションを Cloudflare Pages にデプロイする方法を解説します
date: 2024-06-22
tags: [nextjs, cloudflare, deployment]
image: /blog/cloudflare-pages.jpg
---

# Next.js を Cloudflare Pages にデプロイする

今日は、Next.js アプリケーションを Cloudflare Pages にデプロイする方法について解説します。

## なぜ Cloudflare Pages？

Cloudflare Pages は以下の特徴があります：

- **高速なグローバル CDN**
- **無料の SSL 証明書**
- **GitHub との簡単な連携**
- **自動デプロイ**

## セットアップ手順

### 1. Next.js の設定

`next.config.mjs` に以下を追加：

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

### 2. Cloudflare Pages の設定

ビルド設定：
- **ビルドコマンド**: `bun run build`
- **ビルド出力ディレクトリ**: `out`
- **環境変数**: `NODE_VERSION=20`

### 3. デプロイ

GitHub にプッシュすると自動的にデプロイが開始されます。

## まとめ

Cloudflare Pages は Next.js の静的サイトを簡単にホスティングできる優れたプラットフォームです。