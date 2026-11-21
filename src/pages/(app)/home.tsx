/**
 * Home — a short welcome that points students to the two main things to do.
 * Served at /home (the logo in the nav links here).
 */

import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui'

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16 text-center text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Campus Borrow</h1>
      <p className="max-w-md text-muted-foreground">
        Borrow what you need from other students, and lend what you're not using.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/browse" className={buttonVariants()}>
          Browse items
        </Link>
        <Link to="/post-item" className={buttonVariants({ variant: 'outline' })}>
          Post an item
        </Link>
      </div>
    </div>
  )
}
