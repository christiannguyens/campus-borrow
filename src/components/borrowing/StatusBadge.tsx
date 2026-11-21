/**
 * Small colored label for an item or request status, e.g. "Pending" or "Borrowed".
 */

import { Badge, type BadgeProps } from '@/components/ui'

const STYLES: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  // Item statuses
  available: { label: 'Available', variant: 'success' },
  borrowed: { label: 'Borrowed', variant: 'warning' },
  // Request statuses
  pending: { label: 'Pending', variant: 'info' },
  approved: { label: 'Approved', variant: 'success' },
  declined: { label: 'Declined', variant: 'secondary' },
  returned: { label: 'Returned', variant: 'outline' },
}

export function StatusBadge({ status, testId = 'status-badge' }: { status: string; testId?: string }) {
  const style = STYLES[status] ?? { label: status, variant: 'outline' }
  return (
    <Badge variant={style.variant} data-testid={testId} data-status={status}>
      {style.label}
    </Badge>
  )
}
