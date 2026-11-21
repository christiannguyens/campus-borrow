/**
 * The page frame and "loading" / "error" placeholders every borrowing page shares.
 */

import type { ReactNode } from 'react'

/** Page wrapper: same width, padding and heading style on every page. */
export function Page({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

/** Grey placeholder cards shown while data is loading. */
export function LoadingCards() {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid gap-4 sm:grid-cols-2">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="h-36 animate-pulse rounded-lg border border-border bg-muted/40" />
      ))}
    </div>
  )
}

/** Red box shown when data can't be loaded. */
export function ErrorBox({ message }: { message?: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
    >
      <p className="font-medium">Couldn't load this page.</p>
      <p className="mt-1 text-muted-foreground">
        {message ?? 'Please check your connection and refresh.'}
      </p>
    </div>
  )
}
