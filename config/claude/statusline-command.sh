#!/usr/bin/env bash
# Claude Code status line: project, git branch, model and context bar.

input=$(cat)
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // .workspace.current_dir // .cwd')
model=$(echo "$input" | jq -r '.model.display_name // empty')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

project="${project_dir##*/}"

left=$(printf '\033[34m%s\033[0m' "$project")

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd')
if git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null \
    || git -C "$cwd" --no-optional-locks rev-parse --short HEAD 2>/dev/null)
  git -C "$cwd" --no-optional-locks diff --quiet 2>/dev/null \
    && git -C "$cwd" --no-optional-locks diff --cached --quiet 2>/dev/null \
    || branch="$branch*"
  left+=$(printf ' \033[90m%s\033[0m' "$branch")
fi

if [ -n "$model" ]; then
  left+=$(printf ' \033[35m%s\033[0m' "$model")
fi

# Context remaining as a draining bar: green > 50% left, yellow > 20%, red below.
if [ -n "$used" ]; then
  width=10
  remaining=$(awk -v u="$used" 'BEGIN { l = 100 - u; if (l < 0) l = 0; if (l > 100) l = 100; printf "%d", l + 0.5 }')
  filled=$(( (remaining * width + 50) / 100 ))
  if [ "$remaining" -gt 50 ]; then colour=32
  elif [ "$remaining" -gt 20 ]; then colour=33
  else colour=31
  fi
  bar=''
  for ((i = 0; i < width; i++)); do
    if [ "$i" -lt "$filled" ]; then bar+='█'; else bar+='░'; fi
  done
  pct="${remaining}%"
  left+=$(printf ' \033[%sm%s\033[0m \033[90m%s\033[0m' "$colour" "$bar" "$pct")
fi

printf '%s\n' "$left"
