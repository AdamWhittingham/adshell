import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PaneView, PullRequest, Snapshot, StatusChange, Workstream } from '../types'

const PANE = 'workstreams'
const TRIAGE_PANE = 'workstreams-triage'
// Only the manager session in the primary checkout opens the pane by itself; workstream sessions run in worktrees
const MAIN_SESSION_CWD = '/Users/adam/code/cronofy'
const WORKSTREAMS_DIR =
  '/Users/adam/Library/Mobile Documents/iCloud~md~obsidian/Documents/Work/20 - Product/workstreams'
const CLOSED_STATUSES = ['done', 'abandoned']
const REFRESH_MS = 2 * 60 * 1000
const STALE_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

const snapshot = atom(
  { plugin: 'workstreams-pane', key: 'snapshot' } as const,
  { workstreams: [], refreshedAt: 0 } as Snapshot,
  { shape: 'snapshot-2' },
)

const lastChange = atom(
  { plugin: 'workstreams-pane', key: 'lastChange' } as const,
  null as StatusChange | null,
  { shape: 'last-change-1' },
)

const view = atom(
  { plugin: 'workstreams-pane', key: 'view' } as const,
  'open' as PaneView,
  { shape: 'view-1' },
)

let previousPrs: Map<string, PullRequest> | undefined
let refreshing = false
let refreshTimerStarted = false

const frontmatterField = (text: string, field: string): string => {
  const match = text.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'))
  return match?.[1]?.trim() ?? ''
}

const lastActivity = (text: string): string => {
  const dates = [frontmatterField(text, 'updated'), frontmatterField(text, 'started')]
  for (const match of text.matchAll(/^- (\d{4}-\d{2}-\d{2}) /gm)) dates.push(match[1] ?? '')
  return dates.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort().pop() ?? ''
}

const checksSummary = (rollup: Array<Record<string, unknown>> | null): PullRequest['checks'] => {
  if (!rollup || rollup.length === 0) return 'none'
  const results = rollup.map(check => String(check.conclusion ?? check.state ?? '').toUpperCase())
  if (results.some(result => ['FAILURE', 'ERROR', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED'].includes(result))) {
    return 'fail'
  }
  if (results.some(result => ['', 'PENDING', 'EXPECTED', 'IN_PROGRESS', 'QUEUED'].includes(result))) return 'pending'
  return 'pass'
}

const PR_FIELDS = 'number,url,state,isDraft,reviewDecision,statusCheckRollup'

const toPullRequest = (raw: Record<string, unknown>): PullRequest => {
  const url = String(raw.url)
  const review = String(raw.reviewDecision ?? '')
  return {
    url,
    repo: url.split('/')[4] ?? '',
    number: Number(raw.number),
    state: (['OPEN', 'MERGED', 'CLOSED'].includes(String(raw.state)) ? raw.state : 'UNKNOWN') as PullRequest['state'],
    isDraft: Boolean(raw.isDraft),
    review: (['APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(review) ? review : 'NONE') as PullRequest['review'],
    checks: checksSummary(raw.statusCheckRollup as Array<Record<string, unknown>> | null),
  }
}

const runGh = async ($: EngineInterface, args: string[]): Promise<unknown> => {
  const result = await $.process.run(['gh', ...args], { timeoutMs: 30_000 })
  if (result.exitCode !== 0) throw new Error(result.stderr.trim() || `gh exited ${result.exitCode}`)
  return JSON.parse(result.stdout)
}

const pullRequestsFor = async ($: EngineInterface, text: string): Promise<PullRequest[]> => {
  const urls = [...frontmatterField(text, 'pr').matchAll(/https:\/\/github\.com\/[^\s)\]]+\/pull\/\d+/g)].map(m => m[0])
  if (urls.length > 0) {
    return Promise.all(
      urls.map(async url => toPullRequest((await runGh($, ['pr', 'view', url, '--json', PR_FIELDS])) as Record<string, unknown>)),
    )
  }

  const branch = frontmatterField(text, 'branch')
  const repo = frontmatterField(text, 'repo')
  if (!branch || !repo) return []
  const found = (await runGh($, [
    'pr', 'list', '--repo', `cronofy/${repo}`, '--head', branch, '--state', 'all', '--limit', '1', '--json', PR_FIELDS,
  ])) as Array<Record<string, unknown>>
  return found.map(toPullRequest)
}

const loadWorkstream = async ($: EngineInterface, name: string, now: number): Promise<Workstream | undefined> => {
  const text = await $.fs.read(`${WORKSTREAMS_DIR}/${name}`)
  const status = frontmatterField(text, 'status')
  if (!status || CLOSED_STATUSES.includes(status)) return undefined

  const activity = lastActivity(text)
  const idleDays = activity ? Math.floor((now - Date.parse(`${activity}T00:00:00`)) / DAY_MS) : 0
  const openTasks = [...text.matchAll(/^\s*- \[ \] (.+)$/gm)].map(m => (m[1] ?? '').trim())
  const prs = await pullRequestsFor($, text).catch(() => [])
  const parent = frontmatterField(text, 'parent').match(/\[\[([^\]|]+)/)?.[1]?.trim() ?? ''

  return {
    file: name,
    title: name.replace(/^\d{4}-\d{2}-\d{2} - /, '').replace(/\.md$/, ''),
    status,
    parent,
    isGroup: frontmatterField(text, 'type') === 'group',
    lastActivity: activity,
    idleDays,
    openTasks,
    prs,
  }
}

const describeChange = (before: PullRequest, after: PullRequest): string | undefined => {
  const label = `${after.repo}#${after.number}`
  if (before.state !== 'MERGED' && after.state === 'MERGED') return `${label} merged`
  if (before.state === 'OPEN' && after.state === 'CLOSED') return `${label} closed`
  if (before.review !== after.review && after.review === 'APPROVED') return `${label} approved`
  if (before.review !== after.review && after.review === 'CHANGES_REQUESTED') return `${label}: changes requested`
  if (before.checks !== after.checks && after.checks === 'fail') return `${label}: checks failed`
  if (before.isDraft && !after.isDraft && after.state === 'OPEN') return `${label} ready for review`
  return undefined
}

const refresh = async ($: EngineInterface): Promise<void> => {
  if (refreshing) return
  refreshing = true
  try {
    const now = Date.now()
    const entries = await $.fs.list(WORKSTREAMS_DIR)
    const names = entries.filter(entry => entry.kind === 'file' && entry.name.endsWith('.md')).map(entry => entry.name)
    const loaded = await Promise.all(names.map(name => loadWorkstream($, name, now).catch(() => undefined)))
    const workstreams = loaded.filter((one): one is Workstream => one !== undefined)

    const currentPrs = new Map(workstreams.flatMap(one => one.prs.map(pr => [pr.url, pr] as const)))
    if (previousPrs) {
      for (const [url, after] of currentPrs) {
        const before = previousPrs.get(url)
        const change = before && describeChange(before, after)
        if (change) $.ui.toast(change)
      }
    }
    previousPrs = currentPrs

    await update($, snapshot, () => ({ workstreams, refreshedAt: now }))
  } catch (error) {
    await update($, snapshot, current => ({ ...current, error: String(error) }))
  } finally {
    refreshing = false
  }
}

const awaitingReview = (pr: PullRequest): boolean =>
  pr.state === 'OPEN' && !pr.isDraft && (pr.review === 'REVIEW_REQUIRED' || pr.review === 'NONE')

const prColor = (pr: PullRequest): string => {
  if (pr.state === 'MERGED') return 'merged'
  if (pr.state === 'CLOSED') return 'inactive'
  if (pr.review === 'CHANGES_REQUESTED' || pr.checks === 'fail') return 'error'
  if (pr.review === 'APPROVED') return 'success'
  if (awaitingReview(pr)) return 'warning'
  return 'text'
}

const prLabel = (pr: PullRequest): string => {
  if (pr.state === 'MERGED') return 'merged'
  if (pr.state === 'CLOSED') return 'closed'
  const parts = [pr.isDraft ? 'draft' : 'open']
  if (pr.review === 'APPROVED') parts.push('approved')
  if (pr.review === 'CHANGES_REQUESTED') parts.push('changes requested')
  if (awaitingReview(pr)) parts.push('awaiting review')
  if (pr.checks !== 'none') parts.push(`checks ${pr.checks}`)
  return parts.join(', ')
}

const OPEN_STATUSES = ['active', 'in-review', 'blocked']
const ARCHIVE_DIR = `${WORKSTREAMS_DIR}/archive`

const today = (): string => {
  const now = new Date()
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const rewriteNote = (text: string, status: string, line: string): string => {
  const date = today()
  const updated = text
    .replace(/^status:.*$/m, `status: ${status}`)
    .replace(/^updated:.*$/m, `updated: ${date}`)
  return `${updated.replace(/\s*$/, '')}\n- ${date} — ${line}\n`
}

const moveNote = async ($: EngineInterface, from: string, toDir: string): Promise<void> => {
  const result = await $.process.run(['mv', '-n', from, `${toDir}/`])
  if (result.exitCode !== 0) throw new Error(result.stderr.trim() || 'mv failed')
}

const setStatus = async ($: EngineInterface, one: Workstream, to: 'active' | 'paused' | 'done'): Promise<void> => {
  const path = `${WORKSTREAMS_DIR}/${one.file}`
  const text = await $.fs.read(path)
  const from = frontmatterField(text, 'status')
  const label = to === 'done' ? 'closed' : to === 'paused' ? 'paused' : 'opened'
  await $.fs.write(path, rewriteNote(text, to, `Status set to ${to} (was ${from}) from the workstreams pane.`))

  const archived = to === 'done'
  if (archived) await moveNote($, path, ARCHIVE_DIR)

  await update($, lastChange, () => ({ file: one.file, title: one.title, from, to, archived }))
  $.ui.toast(`${one.title} ${label}`)
  await refresh($)
}

const undoLastChange = async ($: EngineInterface): Promise<void> => {
  const change = await read($, lastChange)
  if (!change) return

  if (change.archived) await moveNote($, `${ARCHIVE_DIR}/${change.file}`, WORKSTREAMS_DIR)
  const path = `${WORKSTREAMS_DIR}/${change.file}`
  const text = await $.fs.read(path)
  await $.fs.write(path, rewriteNote(text, change.from, `Status change undone; back to ${change.from}.`))

  await update($, lastChange, () => null)
  $.ui.toast(`${change.title} back to ${change.from}`)
  await refresh($)
}

const runSafely = ($: EngineInterface, work: () => Promise<void>): void => {
  work().catch(error => $.ui.toast(`Workstreams: ${String(error)}`))
}

const startRefreshing = ($: EngineInterface): void => {
  void refresh($)
  if (refreshTimerStarted) return
  refreshTimerStarted = true
  $.clock.every(REFRESH_MS, () => void refresh($))
}

const STATUS_ORDER = ['in-review', 'active', 'blocked', 'waiting', 'monitoring', 'paused']
const statusRank = (status: string): number => {
  const rank = STATUS_ORDER.indexOf(status)
  return rank === -1 ? STATUS_ORDER.length : rank
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'workstreams-pane',
      description: 'Show open workstreams, their PRs and stale work in a pane',
    })
    await $.command.register({
      name: 'workstreams-triage',
      description: 'Open, pause or close workstreams from a pane',
    })
    if (e.cwd === MAIN_SESSION_CWD) {
      void $.ui.open({ id: PANE, title: 'Workstreams', columns: 56 })
      startRefreshing($)
    }

    return next(e)
  })

  on('command.run', { command: 'workstreams-pane' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Workstreams', columns: 56 })
    startRefreshing($)

    return { text: 'Workstreams pane opened and refreshing.' }
  })

  on('command.run', { command: 'workstreams-triage' }, async $ => {
    await $.ui.open({ id: TRIAGE_PANE, title: 'Triage', columns: 64, focus: true })
    void refresh($)

    return { text: 'Workstreams triage pane opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: TRIAGE_PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const { workstreams } = await read($, snapshot)
    const change = await read($, lastChange)

    const byIdle = (a: Workstream, b: Workstream): number => b.idleDays - a.idleDays
    const open = workstreams.filter(one => OPEN_STATUSES.includes(one.status)).sort(byIdle)
    const paused = workstreams.filter(one => !OPEN_STATUSES.includes(one.status)).sort(byIdle)

    const row = (one: Workstream) => (
      <Box flexDirection="column" marginTop={1}>
        <Text wrap="truncate-end">
          {one.parent ? `[${one.parent.replace(/^\d{4}-\d{2}-\d{2} - /, "")}] ` : ""}{one.title} <Text dimColor>{one.status}, {one.idleDays}d idle, {one.openTasks.length} open</Text>
        </Text>
        {one.openTasks[0] && (
          <Text dimColor wrap="truncate-end">
            {'  '}next: {one.openTasks[0]}
          </Text>
        )}
        <Box flexDirection="row" gap={1}>
          <Button
            key={`open:${one.file}`}
            label="Open"
            variant={OPEN_STATUSES.includes(one.status) ? 'primary' : undefined}
            onPress={() => {
              if (!OPEN_STATUSES.includes(one.status)) runSafely($, () => setStatus($, one, 'active'))
            }}
          />
          <Button
            key={`pause:${one.file}`}
            label="Pause"
            variant={one.status === 'paused' ? 'primary' : undefined}
            onPress={() => {
              if (one.status !== 'paused') runSafely($, () => setStatus($, one, 'paused'))
            }}
          />
          <Button
            key={`close:${one.file}`}
            label="Close"
            dimColor
            onPress={() => runSafely($, () => setStatus($, one, 'done'))}
          />
        </Box>
      </Box>
    )

    return (
      <Box flexDirection="column">
        <Text dimColor>Open sets paused work to active; Close marks it done and archives it.</Text>
        {change && (
          <Box flexDirection="row" gap={1}>
            <Text wrap="truncate-end">
              Last: {change.title} {change.from} → {change.to}
            </Text>
            <Button key="undo" label="Undo" onPress={() => runSafely($, () => undoLastChange($))} />
          </Box>
        )}
        <Box marginTop={1}><Text color="claude">Open ({open.length})</Text></Box>
        {open.map(row)}
        <Box marginTop={1}><Text color="claude">Paused and other ({paused.length})</Text></Box>
        {paused.map(row)}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const { workstreams, refreshedAt, error } = await read($, snapshot)
    const current = await read($, view)

    const work = workstreams.filter(one => !one.isGroup)
    const inProgress = work.filter(one => OPEN_STATUSES.includes(one.status))
    const visible = current === 'open' ? inProgress : work
    const hidden = work.length - visible.length

    const sorted = [...visible].sort(
      (a, b) => statusRank(a.status) - statusRank(b.status) || a.title.localeCompare(b.title),
    )
    const groups = workstreams.filter(one => one.isGroup).sort((a, b) => a.title.localeCompare(b.title))
    const groupNames = new Set(groups.map(one => one.file.replace(/\.md$/, '')))
    const threadsOf = (group: Workstream): Workstream[] =>
      sorted.filter(one => one.parent === group.file.replace(/\.md$/, ''))
    const topLevel = sorted.filter(one => !groupNames.has(one.parent))
    const stale = [...work]
      .filter(one => one.idleDays >= STALE_DAYS)
      .sort((a, b) => b.idleDays - a.idleDays)
    const time = refreshedAt ? new Date(refreshedAt).toTimeString().slice(0, 5) : 'never'

    const card = (one: Workstream, indent: string) => (
      <Box flexDirection="column" marginTop={1}>
        <Text weight="bold" wrap="truncate-end">
          {indent}{one.title} <Text dimColor>{one.status}</Text>
        </Text>
        {one.prs.map(pr => (
          <Text color={prColor(pr)} wrap="truncate-end">
            {indent}{'  '}<Link href={pr.url}>{pr.repo}#{pr.number}</Link> {prLabel(pr)}
          </Text>
        ))}
        {one.prs.length === 0 && <Text dimColor>{indent}{'  '}no PR</Text>}
        {one.openTasks[0] && (
          <Text dimColor wrap="truncate-end">
            {indent}{'  '}next: {one.openTasks[0]}
          </Text>
        )}
      </Box>
    )

    const group = (one: Workstream) => {
      const threads = threadsOf(one)
      if (threads.length === 0) return null
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text weight="bold" color="claude" wrap="truncate-end">
            ▾ {one.title} <Text dimColor>{threads.length} threads</Text>
          </Text>
          {threads.map(thread => card(thread, '  '))}
        </Box>
      )
    }

    const setView = (to: PaneView): void => {
      if (to !== current) runSafely($, async () => void (await update($, view, () => to)))
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text dimColor>Updated {time}</Text>
          <Button onPress={() => void refresh($)}>Refresh</Button>
        </Box>
        <Box flexDirection="row" gap={1}>
          <Button
            key="view:open"
            label={`Open (${inProgress.length})`}
            variant={current === 'open' ? 'primary' : undefined}
            onPress={() => setView('open')}
          />
          <Button
            key="view:all"
            label={`Not done (${work.length})`}
            variant={current === 'all' ? 'primary' : undefined}
            onPress={() => setView('all')}
          />
          <Button
            key="view:stale"
            label={`Not touched (${stale.length})`}
            variant={current === 'stale' ? 'primary' : undefined}
            onPress={() => setView('stale')}
          />
        </Box>
        <Text dimColor wrap="truncate-end">
          {current === 'stale'
            ? `Not done and not touched for ${STALE_DAYS}+ days, longest first`
            : `${inProgress.length} in progress (active, in review, blocked)`}
          {current === 'open' && hidden > 0 ? `; ${hidden} paused or other hidden` : ''}
        </Text>
        {error && <Text color="error" wrap="truncate-end">{error}</Text>}
        {refreshedAt === 0 && <Text dimColor>Loading workstreams…</Text>}

        {current !== 'stale' && groups.map(group)}
        {current !== 'stale' && topLevel.map(one => card(one, ''))}

        {current === 'stale' && stale.length === 0 && (
          <Box marginTop={1}><Text dimColor>Nothing stale.</Text></Box>
        )}
        {current === 'stale' && stale.map(one => (
          <Box flexDirection="column" marginTop={1}>
            <Text weight="bold" wrap="truncate-end">
              {one.title} <Text dimColor>{one.status}, {one.idleDays}d, {one.openTasks.length} open</Text>
            </Text>
            {one.openTasks.slice(0, 3).map(task => (
              <Text dimColor wrap="truncate-end">
                {'  '}- {task}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
