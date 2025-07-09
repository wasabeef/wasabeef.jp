---
title: "Claude Code の Hooks で日本語を自動整形する設定"
description: "Claude Code の PostToolUse フックを使って、日本語と半角英数字の間に自動でスペースを挿入する方法を紹介"
date: "2025-07-09"
tags: ["Claude", "日本語", "開発効率化"]
image: "https://wasabeef.jp/images/posts/cc.webp"
---

こんにちは、わさびーふです。

今回は Claude Code の Hooks を使って、日本語と英数字の間に自動でスペースを挿入する設定を作ったので紹介しようと思います。

これは好き嫌いあると思うので、このやり方を元に整形できるっていうことを共有する意味合いのブログになります。

## 背景

日本語の文章を書いていると「日本語Claudeコード」みたいにスペースがない文章になりがちです。

- スペースがない：「Claude3.7でRustコードを生成」
- スペースがある：「Claude3.7 で Rust コードを生成」

CLAUDE.md にルールを書いても、完全には守ってくれず、Markdownlint やプロンプトで最後に仕上げをしていましたが、地味に毎回スペースを入れるようにいうのが面倒くさかったので、Claude Code の Hooks で自動化しました。

## Step 1: Hooks の仕組みを理解する

Claude Code の [Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) には 4 種類あります：

- PreToolUse: ツール実行前に実行
- PostToolUse: ツール実行後に実行
- Notification: ユーザー確認が必要な時に実行
- Stop: タスク完了時に実行

今回は `PostToolUse` を使って、ファイル編集後に自動でフォーマットを適用します。

## Step 2: settings.json を設定する

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/scripts/ja-space-format.sh"
          }
        ]
      }
    ]
  }
}
```

この設定により、`Edit`、`Write`、`MultiEdit` ツールが実行された後に、自動的に `ja-space-format.sh` が実行されます。

## Step 3: スペース挿入スクリプトを作成する

`~/.claude/scripts/ja-space-format.sh` を以下の内容で作成します。

```bash
#!/bin/bash
set -euo pipefail

# 日本語と半角英数字の間に半角スペースを挿入

# ファイルパス取得（引数または JSON 入力）
if [ -n "${1:-}" ]; then
  file_path="$1"
else
  if [ -n "${CLAUDE_TOOL_INPUT:-}" ]; then
    input_json="$CLAUDE_TOOL_INPUT"
  else
    input_json=$(cat)
  fi
  file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty')
fi

# 基本チェック
[ -z "$file_path" ] && exit 0
[ ! -f "$file_path" ] && exit 0
[ ! -r "$file_path" ] && exit 0
[ ! -w "$file_path" ] && exit 0

# 日本語文字と英数字の境界にスペース挿入
sed -i '' -E \
  -e 's/([ぁ-ゟ])([a-zA-Z0-9])/\1 \2/g' \
  -e 's/([ァ-ヿ])([a-zA-Z0-9])/\1 \2/g' \
  -e 's/([一-鿿㐀-䶿])([a-zA-Z0-9])/\1 \2/g' \
  -e 's/([a-zA-Z0-9])([ぁ-ゟ])/\1 \2/g' \
  -e 's/([a-zA-Z0-9])([ァ-ヿ])/\1 \2/g' \
  -e 's/([a-zA-Z0-9])([一-鿿㐀-䶿])/\1 \2/g' \
  "$file_path"
```

## Step 4: 実行権限を付与する

```bash
chmod +x ~/.claude/scripts/ja-space-format.sh
```

## 実装で工夫した点

### Hook からの JSON 処理

Claude Code の Hook には、ツールの実行情報が JSON 形式で渡されます：

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.md",
    "old_string": "古い内容",
    "new_string": "新しい内容"
  }
}
```

スクリプトでは `jq` を使ってこの JSON からファイルパスを抽出しています。

### 日本語文字の範囲

sed の正規表現で次の文字範囲を指定しています：

- ひらがな: `[ぁ-ゟ]`
- カタカナ: `[ァ-ヿ]`
- 漢字: `[一-龯]`

## 実際に使ってみた結果

この設定を使い始めてから、少しだけストレスが減りました。

※ Hooks のその他の活用方法については、「[Claude Code の --dangerously-skip-permissions を安全に使う Hooks 設定](/blog/claude-code-secure-bash)」も参考にしてください。

おしまい
