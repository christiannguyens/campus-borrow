/**
 * Shared helpers for the borrowing pages: the shape of our records, and one
 * function to call the server actions in src/actions/borrowing.ts.
 */

import { getAuthToken } from 'deepspace'

/** An item as stored in the `items` collection (see src/schemas/items-schema.ts). */
export type Item = {
  name: string
  description: string
  category: string
  pickupLocation: string
  status: 'available' | 'borrowed'
}

/** What the Post item form sends. `status` is set by the server, not the form. */
export type NewItem = Omit<Item, 'status'>

export type RequestStatus = 'pending' | 'approved' | 'declined' | 'returned'

/** A request as stored in the `requests` collection (see src/schemas/requests-schema.ts). */
export type BorrowRequest = {
  itemId: string
  borrowerId: string
  lenderId: string
  status: RequestStatus
}

export type ActionName = 'requestItem' | 'approveRequest' | 'declineRequest' | 'markReturned'

/** Every action answers with either `{ success: true }` or `{ success: false, error }`. */
export type ActionOutcome = { success: true } | { success: false; error: string }

/**
 * Call one of our server actions, e.g. `callAction('requestItem', { itemId })`.
 * Never throws: problems come back as `{ success: false, error }` with a
 * message that's safe to show the student.
 */
export async function callAction(
  name: ActionName,
  params: Record<string, string>,
): Promise<ActionOutcome> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'Please sign in again and retry.' }

    const res = await fetch(`/api/actions/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    })
    if (res.status === 401) return { success: false, error: 'Please sign in again and retry.' }

    const body = (await res.json()) as { success?: boolean; error?: string }
    if (body.success) return { success: true }
    // Our actions already write friendly messages ("You can't borrow your own item").
    return { success: false, error: body.error ?? 'Something went wrong. Please try again.' }
  } catch {
    return { success: false, error: "Couldn't reach the server. Check your connection and try again." }
  }
}
