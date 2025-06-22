---
title: "2023年から pnpm + commitlint + git-cz でコミットメッセージを Conventional Commits に統一する"
date: "2023-01-01"
description: "pnpm、husky、commitlint、commitizenを使ってConventional Commitsに準拠したコミットメッセージを強制する方法"
tags: ["Git", "pnpm", "commitlint", "Development Tools", "Conventional Commits"]
image: "/images/blog/conventional-commits-pnpm-commitlint.jpg"
---

## pnpm + husky + commitlint + commitizen

memo

1. pnpm 有効化

```bash
$ corepack enable pnpm
$ pnpm install
```

2. commitlint のインストール

```bash
pnpm add -D @commitlint/config-conventional @commitlint/cli
```

3. create commitlint.config.js

4. husky のインストール

```bash
# Install husky
pnpm add -D husky

# Active hooks
pnpm dlx husky-init 
pnpm install

# Add hook
pnpm husky add .husky/commit-msg 'pnpm commitlint --edit $1'
```