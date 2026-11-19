#!/bin/zsh
set -e
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "${0:A:h}"
node template/scripts/install-local-skill.cjs
read "?完成。按回车退出"
