/**
 * Borrowing actions — the only way a request is created or changes status.
 *
 * IMPORTANT: server actions run with schema permissions turned OFF. The
 * `tools.*` calls below can read and write any row. So every action first
 * checks WHO is calling (`userId`, verified by the server from the login token)
 * and only then writes. Those checks are the security here; don't remove them.
 *
 * Called from the browser with:
 *   POST /api/actions/<actionName>   body: { itemId } or { requestId }
 */

import type { ActionHandler, ActionResult, ActionTools } from 'deepspace/worker'
import type { Env } from '../../worker'

type ItemData = {
  name: string
  status: 'available' | 'borrowed'
}

type RequestData = {
  itemId: string
  borrowerId: string
  lenderId: string
  status: 'pending' | 'approved' | 'declined' | 'returned'
}

/** Read a string param like `itemId` from the request body, or null if missing. */
function readId(params: Record<string, unknown>, key: string): string | null {
  const value = params[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Load a request and make sure the caller is its lender.
 * Returns the request, or an error result to send straight back.
 */
async function loadRequestAsLender(
  tools: ActionTools,
  requestId: string,
  userId: string,
): Promise<{ request: RequestData } | { error: ActionResult }> {
  const found = await tools.get<RequestData>('requests', requestId)
  if (!found.success) return { error: { success: false, error: 'Request not found' } }

  const request = found.data.record.data
  if (request.lenderId !== userId) {
    return { error: { success: false, error: 'Only the lender can do this' } }
  }
  return { request }
}

/** Borrower asks to borrow an item. */
const requestItem: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const itemId = readId(params, 'itemId')
  if (!itemId) return { success: false, error: 'itemId is required' }

  const found = await tools.get<ItemData>('items', itemId)
  if (!found.success) return { success: false, error: 'Item not found' }

  const item = found.data.record
  // The lender is whoever posted the item. We look it up here instead of
  // trusting the browser, so nobody can send a request to the wrong person.
  const lenderId = item.createdBy

  if (lenderId === userId) return { success: false, error: "You can't borrow your own item" }
  if (item.data.status !== 'available') return { success: false, error: 'This item is not available right now' }

  // Don't allow a second open request from the same student for the same item.
  const mine = await tools.query<RequestData>('requests', {
    where: { itemId, borrowerId: userId },
  })
  if (!mine.success) return mine
  const stillOpen = mine.data.records.some(
    (r) => r.data.status === 'pending' || r.data.status === 'approved',
  )
  if (stillOpen) return { success: false, error: 'You already have an open request for this item' }

  return tools.create('requests', {
    itemId,
    borrowerId: userId,
    lenderId,
    participants: [userId, lenderId],
    status: 'pending',
  })
}

/** Lender says yes. The item becomes "borrowed". */
const approveRequest: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const requestId = readId(params, 'requestId')
  if (!requestId) return { success: false, error: 'requestId is required' }

  const loaded = await loadRequestAsLender(tools, requestId, userId)
  if ('error' in loaded) return loaded.error
  const { request } = loaded

  if (request.status !== 'pending') return { success: false, error: 'Only pending requests can be approved' }

  const item = await tools.get<ItemData>('items', request.itemId)
  if (!item.success) return { success: false, error: 'Item not found' }
  if (item.data.record.data.status !== 'available') {
    return { success: false, error: 'This item is already lent out' }
  }

  const updated = await tools.update('requests', requestId, { status: 'approved' })
  if (!updated.success) return updated
  return tools.update('items', request.itemId, { status: 'borrowed' })
}

/** Lender says no. The item stays available. */
const declineRequest: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const requestId = readId(params, 'requestId')
  if (!requestId) return { success: false, error: 'requestId is required' }

  const loaded = await loadRequestAsLender(tools, requestId, userId)
  if ('error' in loaded) return loaded.error

  if (loaded.request.status !== 'pending') {
    return { success: false, error: 'Only pending requests can be declined' }
  }
  return tools.update('requests', requestId, { status: 'declined' })
}

/** Lender confirms the item came back. The item becomes "available" again. */
const markReturned: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const requestId = readId(params, 'requestId')
  if (!requestId) return { success: false, error: 'requestId is required' }

  const loaded = await loadRequestAsLender(tools, requestId, userId)
  if ('error' in loaded) return loaded.error
  const { request } = loaded

  if (request.status !== 'approved') {
    return { success: false, error: 'Only approved (lent out) requests can be marked returned' }
  }

  const updated = await tools.update('requests', requestId, { status: 'returned' })
  if (!updated.success) return updated
  return tools.update('items', request.itemId, { status: 'available' })
}

export const borrowingActions = {
  requestItem,
  approveRequest,
  declineRequest,
  markReturned,
}
