/**
 * Borrowing flow, end to end, with three real signed-in students:
 *   A = lender, B = borrower, C = an unrelated student.
 *
 * It checks the permission rules two ways:
 *   - through the UI (what a student actually sees and clicks), and
 *   - by calling the server directly as that student, to prove the SERVER
 *     refuses the action, not just that the button is hidden.
 *
 * Needs 3 test accounts on this machine:
 *   npx deepspace test accounts create --email <name>@deepspace.test --name "<Name>" --password-stdin
 * Run:
 *   npx deepspace test run e2e --grep borrowing
 */

import type { Page } from '@playwright/test'
import { test, expect, loadAllTestAccounts } from 'deepspace/testing'

// Skip (with instructions) instead of failing when the account pool is too small.
const accounts = loadAllTestAccounts().length
test.skip(
  accounts < 3,
  `Needs 3 usable test accounts, found ${accounts}. Create them with ` +
    '`npx deepspace test accounts create --email <name>@deepspace.test --name "<name>" --password-stdin`.',
)

// Realtime + three browsers: give the whole story room to run.
test.setTimeout(120_000)
const LIVE = { timeout: 15_000 }

/**
 * Send a POST from inside this student's browser, signed in as them.
 * Gets their login token the same way the app does, then calls `path`.
 */
async function postAs(page: Page, path: string, body: unknown) {
  return page.evaluate(
    async ({ path, body }) => {
      const tokenRes = await fetch('/api/auth/token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const { token } = (await tokenRes.json()) as { token: string }
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      return { status: res.status, json: await res.json() }
    },
    { path, body },
  )
}

/** Call one of our server actions (src/actions/borrowing.ts) as this student. */
function actionAs(page: Page, name: string, params: Record<string, string>) {
  return postAs(page, `/api/actions/${name}`, params)
}

/**
 * Run a built-in record tool (records_update, records_query, ...) as this
 * student. These run with the student's OWN permissions, exactly like a
 * write from the app's pages, so they're a direct test of the schema rules.
 */
function recordToolAs(page: Page, tool: string, input: Record<string, unknown>) {
  return postAs(page, `/_deepspace/agent/browser/tools/${tool}`, { input })
}

test('borrowing flow: post, request, approve, return — with permission checks', async ({ users }) => {
  const [a, b, c] = await users(3)
  const itemName = `Test calculator ${Date.now()}`

  // ── 1. A posts an item, and B sees it ─────────────────────────────────────
  await a.page.goto('/post-item')
  await a.page.getByLabel('Name').fill(itemName)
  await a.page.getByLabel('Category').click()
  await a.page.getByRole('option', { name: 'Electronics' }).click()
  await a.page.getByLabel('Pickup location').fill('Library front desk')
  await a.page.getByRole('button', { name: 'Post item' }).click()
  await expect(a.page).toHaveURL(/\/my-items$/, LIVE)

  const aItemCard = a.page.getByTestId('my-item-card').filter({ hasText: itemName })
  await expect(aItemCard).toBeVisible(LIVE)
  const itemId = (await aItemCard.getAttribute('data-item-id'))!
  expect(itemId).toBeTruthy()

  await b.page.goto('/browse')
  const bItemCard = b.page.getByTestId('item-card').filter({ hasText: itemName })
  await expect(bItemCard).toBeVisible(LIVE)

  // ── 2. B can't edit A's item ──────────────────────────────────────────────
  // Control: A CAN edit their own item through the same route, so a refusal
  // for B below really is a permission decision, not a broken request.
  const ownerEdit = await recordToolAs(a.page, 'records_update', {
    collection: 'items',
    recordId: itemId,
    data: { description: 'Edited by the owner' },
  })
  expect(ownerEdit.status).toBe(200)

  const strangerEdit = await recordToolAs(b.page, 'records_update', {
    collection: 'items',
    recordId: itemId,
    data: { name: 'Hacked by B' },
  })
  expect(strangerEdit.status).toBe(422) // the server ran the write and refused it
  expect(strangerEdit.json.code).toBe('tool_failed')
  await expect(bItemCard).toContainText(itemName) // name unchanged
  await expect(b.page.getByText('Hacked by B')).toHaveCount(0)

  // ── 3. A can't request their own item ─────────────────────────────────────
  await a.page.goto('/browse')
  const aBrowseCard = a.page.getByTestId('item-card').filter({ hasText: itemName })
  await expect(aBrowseCard).toBeVisible(LIVE)
  await expect(aBrowseCard.getByRole('button', { name: 'Request' })).toHaveCount(0)
  await expect(aBrowseCard).toContainText('Your item')

  const selfRequest = await actionAs(a.page, 'requestItem', { itemId })
  expect(selfRequest.json).toMatchObject({ success: false, error: "You can't borrow your own item" })

  // ── 4. B requests it, and both see "pending" ──────────────────────────────
  await a.page.goto('/my-items') // A watches this page; it should update live
  await expect(aItemCard).toBeVisible(LIVE)

  await bItemCard.getByRole('button', { name: 'Request' }).click()
  await expect(b.page.getByText('Request sent')).toBeVisible(LIVE)

  await b.page.goto('/my-requests')
  const bRequestCard = b.page.getByTestId('my-request').filter({ hasText: itemName })
  await expect(bRequestCard.getByTestId('status-badge')).toHaveAttribute('data-status', 'pending', LIVE)
  const requestId = (await bRequestCard.getAttribute('data-request-id'))!
  expect(requestId).toBeTruthy()

  const aRequestRow = aItemCard.getByTestId('incoming-request')
  await expect(aRequestRow.getByTestId('status-badge')).toHaveAttribute('data-status', 'pending', LIVE)

  // ── 5. A third student can't see the request ──────────────────────────────
  await c.page.goto('/my-requests')
  await expect(c.page.getByRole('heading', { name: 'My requests' })).toBeVisible(LIVE)
  await expect(c.page.getByText(itemName)).toHaveCount(0)

  // Control: the borrower's own query finds the request...
  const borrowerQuery = await recordToolAs(b.page, 'records_query', {
    collection: 'requests',
    where: { itemId },
  })
  expect(borrowerQuery.status).toBe(200)
  expect(JSON.stringify(borrowerQuery.json)).toContain(requestId)
  // ...but the same query from C comes back without it.
  const strangerQuery = await recordToolAs(c.page, 'records_query', {
    collection: 'requests',
    where: { itemId },
  })
  expect(JSON.stringify(strangerQuery.json)).not.toContain(requestId)

  // ── 6. B can't approve their own request ──────────────────────────────────
  const selfApprove = await actionAs(b.page, 'approveRequest', { requestId })
  expect(selfApprove.json).toMatchObject({ success: false, error: 'Only the lender can do this' })
  await expect(bRequestCard.getByTestId('status-badge')).toHaveAttribute('data-status', 'pending')

  // ── 7. A approves → item shows borrowed (B sees "approved" live) ──────────
  await aRequestRow.getByRole('button', { name: 'Approve' }).click()
  await expect(aItemCard.getByTestId('item-status')).toHaveAttribute('data-status', 'borrowed', LIVE)
  await expect(bRequestCard.getByTestId('status-badge')).toHaveAttribute('data-status', 'approved', LIVE)
  // Now only "Mark returned" is allowed.
  await expect(aRequestRow.getByRole('button', { name: 'Approve' })).toBeDisabled()
  await expect(aRequestRow.getByRole('button', { name: 'Decline' })).toBeDisabled()

  // ── 8. A marks it returned → item is available again ──────────────────────
  await aRequestRow.getByRole('button', { name: 'Mark returned' }).click()
  await expect(aItemCard.getByTestId('item-status')).toHaveAttribute('data-status', 'available', LIVE)
  await expect(bRequestCard.getByTestId('status-badge')).toHaveAttribute('data-status', 'returned', LIVE)

  await b.page.goto('/browse')
  await expect(b.page.getByTestId('item-card').filter({ hasText: itemName })).toBeVisible(LIVE)

  // Tidy up: A deletes the test item (owners may delete their own items).
  const cleanup = await recordToolAs(a.page, 'records_delete', { collection: 'items', recordId: itemId })
  expect(cleanup.status).toBe(200)
})
