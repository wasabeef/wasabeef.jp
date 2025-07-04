---
title: "Claude Code の --dangerously-skip-permissions を安全に使う Hooks 設定"
description: "Claude Code の PreToolUse フックと deny-check.sh で、権限スキップ時でも危険なコマンドをブロックする方法"
date: "2025-07-04"
tags: ["Claude", "セキュリティ", "開発効率化"]
image: "https://wasabeef.jp/images/posts/cc.webp"
---

こんにちは、わさびーふです。

今回は Claude Code の `--dangerously-skip-permissions` オプションを使いながらも、[hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) 機能と `deny-check.sh` スクリプトで安全性を確保する方法を紹介します。

## 問題：権限チェックのジレンマ

Claude Code には通常、安全のための権限チェック機能がありますが、開発効率を重視して `--dangerously-skip-permissions` を使うことがあります。

しかし、これには以下のリスクがあります。

- システム設定を変更する `git config` コマンドの実行
- パッケージの自動インストール（`npm install -g`、`brew install` など）
- 権限変更（`chmod 777`）や強制削除（`rm -rf`）の実行
- GitHub の API を使った破壊的操作

## 解決策：PreToolUse フックと deny-check.sh

`--dangerously-skip-permissions` を使っても、`.claude/settings.json` と `.claude/scripts/deny-check.sh` を組み合わせることで、重要なリスクを回避できます。

![デモ](/images/blog/claude-code-secure-bash/deny-check.jpg)

### settings.json の設定

```json
{
  "permissions": {
    "deny": [
      "Bash(git config *)",
      "Bash(brew install *)",
      "Bash(chmod 777 *)",
      "Bash(rm -rf /*)",
      "Bash(gh repo delete:*)"
      // ... 他の危険なコマンド
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/scripts/deny-check.sh"
          }
        ]
      }
    ]
  }
}
```

Bash コマンド実行前に `deny-check.sh` が呼ばれます。

## deny-check.sh の仕組み

`deny-check.sh` は、実行しようとしているコマンドが `settings.json` の `deny` にマッチするかをチェックするスクリプトです。

実装は以下のスクリプトを参照してください。

## 設定方法

### deny-check.sh の配置と権限設定

以下の内容で `~/.claude/scripts/deny-check.sh` を作成します。

```bash
#!/bin/bash

# JSON 入力を読み取り、コマンドとツール名を抽出
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command' 2>/dev/null || echo "")
tool_name=$(echo "$input" | jq -r '.tool_name' 2>/dev/null || echo "")

# Bash コマンドのみをチェック
if [ "$tool_name" != "Bash" ]; then
  exit 0
fi

# settings.json から拒否パターンを読み取り
settings_file="$HOME/.claude/settings.json"

# Bash コマンドの全拒否パターンを取得
deny_patterns=$(jq -r '.permissions.deny[] | select(startswith("Bash(")) | gsub("^Bash\\("; "") | gsub("\\)$"; "")' "$settings_file" 2>/dev/null)

# コマンドが拒否パターンにマッチするかチェックする関数
matches_deny_pattern() {
  local cmd="$1"
  local pattern="$2"

  # 先頭・末尾の空白を削除
  cmd="${cmd#"${cmd%%[![:space:]]*}"}" # 先頭の空白を削除
  cmd="${cmd%"${cmd##*[![:space:]]}"}" # 末尾の空白を削除

  # glob パターンマッチング（ワイルドカード対応）
  [[ "$cmd" == $pattern ]]
}

# まずコマンド全体をチェック
while IFS= read -r pattern; do
  # 空行をスキップ
  [ -z "$pattern" ] && continue

  # コマンド全体がパターンにマッチするかチェック
  if matches_deny_pattern "$command" "$pattern"; then
    echo "Error: コマンドが拒否されました: '$command' (パターン: '$pattern')" >&2
    exit 2
  fi
done <<<"$deny_patterns"

# コマンドを論理演算子で分割し、各部分もチェック
# セミコロン、&& と || で分割（パイプ | と単一 & は分割しない）
temp_command="${command//;/$'\n'}"
temp_command="${temp_command//&&/$'\n'}"
temp_command="${temp_command//\|\|/$'\n'}"

IFS=$'\n'
for cmd_part in $temp_command; do
  # 空の部分をスキップ
  [ -z "$(echo "$cmd_part" | tr -d '[:space:]')" ] && continue

  # 各拒否パターンに対してチェック
  while IFS= read -r pattern; do
    # 空行をスキップ
    [ -z "$pattern" ] && continue

    # このコマンド部分がパターンにマッチするかチェック
    if matches_deny_pattern "$cmd_part" "$pattern"; then
      echo "Error: コマンドが拒否されました: '$cmd_part' (パターン: '$pattern')" >&2
      exit 2
    fi
  done <<<"$deny_patterns"
done

# コマンドを許可
exit 0
```

```bash
# スクリプトに実行権限を付与
chmod +x ~/.claude/scripts/deny-check.sh
```

拒否パターンの例：

```bash
# ワイルドカード例
"Bash(git config *)"     # git config で始まるすべて
"Bash(rm -rf /*)"        # rm -rf / で始まるすべて
"Bash(brew install *)"   # brew install で始まるすべて

# 完全一致例
"Bash(:(){ :|:& };:)"    # フォークボム
```

※注意点：

- `permissions.deny` と `hooks.PreToolUse` の両方を設定する必要があります
- [hooks ドキュメント](https://docs.anthropic.com/en/docs/claude-code/hooks) では絶対パスの使用を推奨（`~` を使った記法も有効）

## 実際に使ってみた結果

この設定により、以下の効果が得られます。

- 権限チェックをスキップしても安全性を維持
- 危険なコマンドのみを選択的にブロック
- 開発効率とセキュリティのバランスを実現

## 注意事項

- 必要なコマンドまでブロックしないよう、deny リストは慎重に設定

### --dangerously-skip-permissions の使い方

```bash
# 通常の起動（権限チェックあり）
claude

# 権限チェックをスキップ（高速だがリスクあり）
claude --dangerously-skip-permissions

# 今回の設定があれば安全に使える
claude --dangerously-skip-permissions  # deny-check.sh が守ってくれる
```

## まとめ

地味に権限チェックのダイアログが面倒くさかったので楽になりました。

フックと deny-check.sh の組み合わせで、開発速度を犠牲にせずに危険なコマンドだけをブロックできるようになりました。

おしまい
