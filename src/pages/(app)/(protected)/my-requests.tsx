/**
 * My requests — everything I've asked to borrow, with its live status.
 * Served at /my-requests. When the lender approves, declines or marks the
 * item returned, the badge here changes on its own.
 */

import { useAuth, useQuery, useUserLookup } from 'deepspace'
import { Inbox, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui'
import { ErrorBox, LoadingCards, Page } from '@/components/borrowing/PageStates'
import { StatusBadge } from '@/components/borrowing/StatusBadge'
import type { BorrowRequest, Item, RequestStatus } from '@/lib/borrowing'

/** One plain sentence explaining each status to the borrower. */
const STATUS_HELP: Record<RequestStatus, string> = {
  pending: 'Waiting for the lender to respond.',
  approved: 'Approved! Pick it up at the location below.',
  declined: 'The lender declined this request.',
  returned: 'You returned this item. Thanks!',
}

export default function MyRequestsPage() {
  const { userId } = useAuth()
  const { getName } = useUserLookup()
  const navigate = useNavigate()

  const requests = useQuery<BorrowRequest>('requests', { orderBy: 'createdAt', orderDir: 'desc' })
  const items = useQuery<Item>('items')

  const mine = requests.records.filter((r) => r.data.borrowerId === userId)
  const findItem = (itemId: string) => items.records.find((i) => i.recordId === itemId)

  const loading = requests.status === 'loading' || items.status === 'loading'
  const error = requests.status === 'error' ? requests.error : items.status === 'error' ? items.error : null

  return (
    <Page title="My requests" subtitle="Items you've asked to borrow. Statuses update live.">
      {loading ? (
        <LoadingCards />
      ) : error !== null ? (
        <ErrorBox message={error} />
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No requests yet"
          description="Find something you need and send the owner a request."
          action={{ label: 'Browse items', onClick: () => navigate('/browse') }}
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((req) => {
            const item = findItem(req.data.itemId)
            return (
              <li
                key={req.recordId}
                data-testid="my-request"
                data-request-id={req.recordId}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item?.data.name ?? 'Item no longer listed'}</h2>
                  <StatusBadge status={req.data.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  From {getName(req.data.lenderId) ?? 'another student'} · {STATUS_HELP[req.data.status]}
                </p>
                {item && req.data.status === 'approved' && (
                  <p className="mt-2 flex items-center gap-1 text-sm">
                    <MapPin className="size-4" aria-hidden />
                    {item.data.pickupLocation}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
