export type PullRequest = {
  url: string
  repo: string
  number: number
  state: 'OPEN' | 'MERGED' | 'CLOSED' | 'UNKNOWN'
  isDraft: boolean
  review: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | 'NONE'
  checks: 'pass' | 'fail' | 'pending' | 'none'
}

export type Workstream = {
  file: string
  title: string
  status: string
  parent: string
  isGroup: boolean
  lastActivity: string
  idleDays: number
  openTasks: string[]
  prs: PullRequest[]
}

export type Snapshot = {
  workstreams: Workstream[]
  refreshedAt: number
  error?: string
}

export type StatusChange = {
  file: string
  title: string
  from: string
  to: string
  archived: boolean
}

export type PaneView = 'open' | 'all' | 'stale'

declare module 'claude-code' {
  interface PluginState {
    'workstreams-pane': {
      snapshot: Shaped<Snapshot>
      lastChange: Shaped<StatusChange | null>
      view: Shaped<PaneView>
    }
  }
}
