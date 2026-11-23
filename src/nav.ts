/**
 * Navigation Config
 *
 * Add one entry per nav item. Routes are handled by generouted
 * (file-based routing in src/pages/), this just controls what
 * appears in the navigation bar.
 */

import type { Role } from './constants'

export interface NavItem {
  path: string
  label: string
  roles?: Role[]
  devOnly?: boolean
}

export const nav: NavItem[] = [
  { path: '/browse', label: 'Browse' },
  { path: '/post-item', label: 'Post item' },
  { path: '/my-items', label: 'My items' },
  { path: '/my-requests', label: 'My requests' },
  // /settings still exists as a page; it's just not linked (the account menu covers sign-out).
  // The /api-status debug page still exists — add
  // `{ path: '/api-status', label: 'API Status', devOnly: true }` to surface it.
  // ── Features add nav items below this line ──
]
