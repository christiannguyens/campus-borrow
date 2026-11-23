/**
 * Landing page at / — the first thing a visitor sees at the live URL.
 *
 * This is a STATIC page: it lives at the top level of src/pages/ (not under
 * (app)/), so it loads no sign-in session and opens no live connection, and
 * it's prerendered to plain HTML at build time. Keep it renderable without a
 * browser: no window/document during render. `<Seo>` comes first and reads
 * src/seo.ts.
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div
        data-testid="static-landing"
        className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      >
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Campus Borrow
        </h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          A marketplace where students lend and borrow items on campus. Post something you're not
          using, request what you need, and the lender approves or declines. Status updates appear
          live for both people.
        </p>

        <div className="mb-8 w-full max-w-md rounded-lg border border-border bg-card p-5 text-left">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            How to try it (you'll need two accounts)
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Sign in and post an item.</li>
            <li>In another browser or a private window, sign in with a second account and request it.</li>
            <li>Back in the first account, open My items, approve the request, then mark it returned.</li>
          </ol>
        </div>

        <Link
          to="/browse"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the app
        </Link>
      </div>
    </>
  )
}
