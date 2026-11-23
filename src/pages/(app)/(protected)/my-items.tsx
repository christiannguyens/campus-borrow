/**
 * My items — the items I've posted, each with the requests other students
 * have sent for it. Served at /my-items.
 *
 * Buttons are only enabled when the step is allowed:
 *   Approve       → request is pending AND the item is still available
 *   Decline       → request is pending
 *   Mark returned → request is approved (the item is out on loan)
 * The server actions check the same rules again, so the buttons are just
 * a convenience, not the security.
 */

import { useState } from 'react'
import { useAuth, useQuery, useUserLookup } from 'deepspace'
import { MapPin, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, EmptyState, useToast } from '@/components/ui'
import { ErrorBox, LoadingCards, Page } from '@/components/borrowing/PageStates'
import { StatusBadge } from '@/components/borrowing/StatusBadge'
import { callAction, type ActionName, type BorrowRequest, type Item } from '@/lib/borrowing'

export default function MyItemsPage() {
  const { userId } = useAuth()
  const { getName } = useUserLookup()
  const navigate = useNavigate()
  const toast = useToast()

  const items = useQuery<Item>('items', { orderBy: 'createdAt', orderDir: 'desc' })
  const requests = useQuery<BorrowRequest>('requests', { orderBy: 'createdAt', orderDir: 'desc' })

  // Which button is waiting for the server, e.g. "approveRequest:abc123".
  const [busy, setBusy] = useState<string | null>(null)

  const myItems = items.records.filter((item) => item.createdBy === userId)
  const incoming = requests.records.filter((r) => r.data.lenderId === userId)

  async function run(action: ActionName, requestId: string, successMessage: string) {
    setBusy(`${action}:${requestId}`)
    const result = await callAction(action, { requestId })
    setBusy(null)
    if (result.success) toast.success(successMessage)
    else toast.error("That didn't work", result.error)
  }

  const loading = items.status === 'loading' || requests.status === 'loading'
  const error = items.status === 'error' ? items.error : requests.status === 'error' ? requests.error : null

  return (
    <Page title="My items" subtitle="Things you've posted, and who wants to borrow them.">
      {loading ? (
        <LoadingCards />
      ) : error !== null ? (
        <ErrorBox message={error} />
      ) : myItems.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="You haven't posted anything yet"
          description="Post an item and requests from other students will show up here."
          action={{ label: 'Post an item', onClick: () => navigate('/post-item') }}
        />
      ) : (
        <ul className="space-y-4">
          {myItems.map((item) => {
            const itemRequests = incoming.filter((r) => r.data.itemId === item.recordId)
            const isAvailable = item.data.status === 'available'
            return (
              <li
                key={item.recordId}
                data-testid="my-item-card"
                data-item-id={item.recordId}
                className="rounded-lg border border-border bg-card p-4 wrap-anywhere"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.data.name}</h2>
                  <StatusBadge status={item.data.status} testId="item-status" />
                  <Badge variant="secondary">{item.data.category}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  {item.data.pickupLocation}
                </p>

                <h3 className="mt-4 text-sm font-medium">Requests</h3>
                {itemRequests.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                    {itemRequests.map((req) => {
                      const id = req.recordId
                      const isPending = req.data.status === 'pending'
                      return (
                        <li
                          key={id}
                          data-testid="incoming-request"
                          data-request-id={id}
                          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {getName(req.data.borrowerId) ?? 'A student'}
                            </span>
                            <StatusBadge status={req.data.status} />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={!isPending || !isAvailable}
                              loading={busy === `approveRequest:${id}`}
                              onClick={() => run('approveRequest', id, 'Request approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isPending}
                              loading={busy === `declineRequest:${id}`}
                              onClick={() => run('declineRequest', id, 'Request declined')}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={req.data.status !== 'approved'}
                              loading={busy === `markReturned:${id}`}
                              onClick={() => run('markReturned', id, 'Marked as returned')}
                            >
                              Mark returned
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
