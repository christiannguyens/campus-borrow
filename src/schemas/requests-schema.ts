/**
 * Requests — a borrower asking a lender for one item.
 *
 * Two people care about a request: the borrower and the lender. DeepSpace's
 * schema rules can let BOTH of them read it (see `participants` below), but
 * they can't say "only the lender may approve". A rule that lets the lender
 * edit a request would let the borrower edit it too, and approve themselves.
 *
 * So students cannot create or change requests directly. Every write goes
 * through a server action in src/actions/borrowing.ts, which checks who is
 * calling before it writes anything.
 */

import type { CollectionSchema } from 'deepspace/schema'

// pending  → waiting for the lender
// approved → lender said yes; the borrower has (or will pick up) the item
// declined → lender said no
// returned → lender confirmed the item came back
export const REQUEST_STATUSES = ['pending', 'approved', 'declined', 'returned']

export const requestsSchema: CollectionSchema = {
  name: 'requests',
  columns: [
    { name: 'itemId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'borrowerId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'lenderId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    // [borrowerId, lenderId]. The `'collaborator'` read rule below checks this list.
    { name: 'participants', storage: 'text', interpretation: { kind: 'json' }, immutable: true },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: REQUEST_STATUSES },
      default: 'pending',
    },
  ],
  // Tells the `'collaborator'` rule which column holds the list of user IDs.
  collaboratorsField: 'participants',
  permissions: {
    // Signed-out visitors: nothing.
    '*': { read: false, create: false, update: false, delete: false },

    // Read-only accounts: same visibility as members, no writes.
    viewer: { read: 'collaborator', create: false, update: false, delete: false },

    // Every signed-in student.
    member: {
      // You can see a request only if you created it (the borrower) or you are
      // in `participants` (the lender). Nobody else ever receives it.
      read: 'collaborator',
      // No direct writes. Requesting, approving, declining and returning all
      // go through server actions, which check who is allowed to do each step.
      create: false,
      update: false,
      delete: false,
    },

    // The app owner can see and fix everything (for support and cleanup).
    admin: { read: true, create: false, update: true, delete: true },
  },
}
