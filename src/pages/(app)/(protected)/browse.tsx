/**
 * Browse — every available item, with a category filter and name search.
 * Served at /browse. Lists update live: when someone posts or borrows an
 * item, this page changes without a refresh.
 */

import { useState } from 'react'
import { useAuth, useQuery } from 'deepspace'
import { MapPin, PackageSearch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@/components/ui'
import { ErrorBox, LoadingCards, Page } from '@/components/borrowing/PageStates'
import { callAction, type BorrowRequest, type Item } from '@/lib/borrowing'
import { ITEM_CATEGORIES } from '@/schemas/items-schema'

const ALL = 'all'

export default function BrowsePage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  // Live queries: both re-render automatically when data changes.
  const items = useQuery<Item>('items', { orderBy: 'createdAt', orderDir: 'desc' })
  // The server only sends requests I'm part of (see requests-schema.ts).
  const requests = useQuery<BorrowRequest>('requests')

  const [category, setCategory] = useState(ALL)
  const [search, setSearch] = useState('')
  const [sendingFor, setSendingFor] = useState<string | null>(null)

  // Items I already have an open request for, so the button can say "Requested".
  const alreadyRequested = new Set(
    requests.records
      .filter((r) => r.data.borrowerId === userId)
      .filter((r) => r.data.status === 'pending' || r.data.status === 'approved')
      .map((r) => r.data.itemId),
  )

  const searchText = search.trim().toLowerCase()
  const visibleItems = items.records
    .filter((item) => item.data.status === 'available')
    .filter((item) => category === ALL || item.data.category === category)
    .filter((item) => item.data.name.toLowerCase().includes(searchText))

  async function requestItem(itemId: string) {
    setSendingFor(itemId)
    const result = await callAction('requestItem', { itemId })
    setSendingFor(null)
    if (result.success) {
      toast.success('Request sent', 'You can follow it on My requests.')
    } else {
      toast.error("Couldn't send request", result.error)
    }
  }

  return (
    <Page title="Browse items" subtitle="Borrow what you need from students on campus.">
      {/* Filters: stacked on phones, side by side on wider screens */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            aria-label="Search items by name"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="sm:w-56">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {ITEM_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {items.status === 'loading' ? (
        <LoadingCards />
      ) : items.status === 'error' ? (
        <ErrorBox message={items.error} />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={<PackageSearch />}
          title={searchText || category !== ALL ? 'No items match' : 'No items yet'}
          description={
            searchText || category !== ALL
              ? 'Try a different search or category.'
              : 'Be the first to lend something to your classmates.'
          }
          action={{ label: 'Post an item', onClick: () => navigate('/post-item') }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibleItems.map((item) => {
            const isMine = item.createdBy === userId
            const requested = alreadyRequested.has(item.recordId)
            return (
              <li
                key={item.recordId}
                data-testid="item-card"
                data-item-id={item.recordId}
                className="flex flex-col rounded-lg border border-border bg-card p-4 wrap-anywhere"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{item.data.name}</h2>
                  <Badge variant="secondary">{item.data.category}</Badge>
                </div>
                {item.data.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.data.description}
                  </p>
                )}
                <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  {item.data.pickupLocation}
                </p>

                <div className="mt-4 flex flex-1 items-end">
                  {isMine ? (
                    <span className="text-sm text-muted-foreground">Your item</span>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={requested}
                      loading={sendingFor === item.recordId}
                      onClick={() => requestItem(item.recordId)}
                    >
                      {requested ? 'Requested' : 'Request'}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
