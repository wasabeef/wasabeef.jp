---
title: "Flutter + Melos + Neovim 開発を効率化する melos.nvim を作りました。"
description: "Melos スクリプトを Neovim から簡単に実行できるプラグインを開発しました。Telescope と連携してスクリプト管理を効率化します。"
date: 2024-06-22
tags: ["Neovim", "Flutter", "Development Tools"]
image: "https://github.com/wasabeef/melos.nvim/raw/main/demo.gif"
---

こんにちは、わさびーふです。

今回は Flutter + Melos + Neovim 開発で使える Neovim プラグイン「[melos.nvim](https://github.com/wasabeef/melos.nvim)」を作ったので紹介しようと思います。

※注意点として、この記事は **Flutter + Neovim + [Melos](https://melos.invertase.dev/)** の組み合わせで開発している方向けの内容になります。これらのツールを使っていない場合は、あまり参考にならないかもしれません。

この記事では以下の内容について説明します。

- melos.nvim とは何か
- 作成のきっかけと解決したい問題
- 実際の使い方と機能
- インストール方法

## melos.nvim とは

melos.nvim は、Dart/Flutter の monorepo 管理ツールである [Melos](https://melos.invertase.dev/) のスクリプトを Neovim から直接実行できるプラグインです。

Telescope.nvim と連携することで、`melos.yaml` に定義されたスクリプトを一覧表示し、選択して実行することができます。

実際の動作は以下の動画で確認できます。

![melos.nvim デモ](/images/blog/melos-nvim-introduction/melos.nvim.gif)

## 作成のきっかけ

### 問題

Flutter の大規模プロジェクトで [Melos](https://melos.invertase.dev/) を使った monorepo 開発をしていると、以下のような問題がありました。

- `melos.yaml` に定義されたスクリプトが多数あり、どんなスクリプトがあるか覚えきれない
- ターミナルとエディタを行き来するのが面倒
- スクリプト名を手動で入力する際のタイプミス

### 解決方法

これらの問題を解決するため、Neovim 内で [Melos](https://melos.invertase.dev/) スクリプトを管理できるプラグインを開発しました。

### 主な機能

#### 1. スクリプト一覧表示

`:MelosRun` コマンドで Telescope を使ったスクリプト選択画面が表示されます。

```bash
:MelosRun
```

#### 2. フローティングターミナルでの実行

選択したスクリプトは自動でフローティングターミナルで実行され、リアルタイムで出力を確認できます。

#### 3. 設定ファイルの編集

`:MelosEdit` コマンドで `melos.yaml` を素早く編集できます。

```bash
:MelosEdit
```

#### 4. プロジェクトルートを開く

`:MelosOpen` コマンドでプロジェクトのルートディレクトリを開けます。

```bash
:MelosOpen
```

### 技術的な実装

#### 使用技術

- **言語**: Lua
- **依存関係**: Neovim 0.7+, Telescope.nvim, yq

#### YAML パースの工夫

`yq` コマンドラインツールを使って `melos.yaml` を解析し、定義されたスクリプトを抽出しています。

```lua
-- melos.yaml からスクリプト情報を取得
local scripts = parse_melos_yaml()
```

※注意点として、`yq` が事前にインストールされている必要があります。

## インストール方法

### lazy.nvim を使用する場合

```lua
{
  "wasabeef/melos.nvim",
  dependencies = { "nvim-telescope/telescope.nvim" },
  config = function()
    require("melos").setup()
  end,
}
```

### packer.nvim を使用する場合

```lua
use {
  "wasabeef/melos.nvim",
  requires = { "nvim-telescope/telescope.nvim" },
  config = function()
    require("melos").setup()
  end,
}
```

### Step 1: 基本的な設定

プラグインをインストール後、以下の設定で使用できます。

```lua
require("melos").setup({
  -- カスタム設定があればここに記載
})
```

### Step 2: キーマップの設定

便利に使うためのキーマップ設定例です。

```lua
vim.keymap.set("n", "<leader>mr", ":MelosRun<CR>")
vim.keymap.set("n", "<leader>me", ":MelosEdit<CR>")
vim.keymap.set("n", "<leader>mo", ":MelosOpen<CR>")
```

## メリット・デメリット

### メリット

- Neovim から離れることなくスクリプト実行が可能
- Telescope の fuzzy finder でスクリプトを素早く見つけられる
- フローティングターミナルでの出力表示が見やすい
- `melos.yaml` の編集も同じ環境で完結

### デメリット

- Melos を使っていないプロジェクトでは意味がない

## まとめ

地味に打つの面倒くさかったので楽になりました。
おしまい

GitHub: https://github.com/wasabeef/melos.nvim


