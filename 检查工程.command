#!/bin/zsh
set -e
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "${0:A:h}/template"
if ! command -v node >/dev/null 2>&1; then
  print "请先安装 Node.js 20 或更新版本，再双击本文件。"
  read "?按回车退出"
  exit 1
fi
node scripts/local-workbench.cjs verify
