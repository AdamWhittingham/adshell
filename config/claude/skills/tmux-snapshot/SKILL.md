---
name: tmux-snapshot
description: Save or restore the user's tmux sessions, windows and panes, including the Claude Code session running in each pane, with ~/.adshell/bin/tmux-snapshot. Use when the user is about to reboot or restart their machine or tmux ("snapshot my sessions", "save my tmux", "I need to reboot"), or after a reboot ("restore my sessions", "bring my tmux back").
---

# tmux snapshot

`tmux-snapshot` (in `~/.adshell/bin`) saves every tmux session, window and pane (name, layout, working directory, the command running in it) and the Claude Code session id of each Claude pane. Snapshots are JSON files in `~/.local/state/tmux-snapshot/`, with `latest.json` pointing at the newest.

| Command | What it does |
| --- | --- |
| `tmux-snapshot save` | Save a snapshot and print a summary |
| `tmux-snapshot show [FILE]` | Summarise a snapshot (default: the latest) |
| `tmux-snapshot list` | List the saved snapshots |
| `tmux-snapshot restore [FILE] [--run]` | Recreate the sessions that are not running |

## Autosave

Snapshots are saved automatically, so a manual save is only a final check:
- tmux hooks in `~/.tmux-config/tmux.conf` run `tmux-snapshot autosave` when a session or window is created, split or renamed.
- A `SessionStart` hook in `~/.claude/settings.json` runs it when a Claude session starts in tmux, which records the new session id.

`autosave` waits 5 seconds and saves once for a burst of events. It skips a save when nothing has changed, and keeps the newest 200 snapshots. Closing a window or session does not save, so that a shutdown does not save a half-closed state; a closed window stays in the snapshot until the next change or manual save.

Each snapshot records its tmux server. With no FILE, `restore` uses the newest snapshot from a server that is no longer running, so autosaves from the new server after a reboot do not replace the state to restore.

## Before a reboot

1. Run `tmux-snapshot save` and show the user the summary, so they can check every Claude pane has a session id.
2. Tell the user that Claude sessions which are busy should finish or be interrupted first: a resumed session continues from its last saved message.

## After a reboot

Restore usually runs outside tmux, so tell the user to run it themselves in a terminal (`tmux-snapshot restore`, then `tmux attach -t cronofy`). If you are already running inside tmux, you can run it; it skips any session whose name is already running (including the one you are in), so say which ones it skipped.

On restore:
- Each Claude pane runs `claude -r <session id>` in its original directory.
- Other panes get their command typed at the prompt but not run (for example `make logs`), so the user chooses what to start. `--run` runs them all.
- A directory that no longer exists (a removed worktree) falls back to the window's first pane directory, or `~`.

`-L <socket>` uses a separate tmux server (and a separate snapshot folder), for testing without touching the user's sessions. When testing, replace the Claude panes in a copy of the snapshot first (`jq '(.sessions[].windows[].panes[] | select(.claude)) |= (del(.claude) + {command: "echo would resume"})'`), so the test does not resume live Claude sessions a second time.
