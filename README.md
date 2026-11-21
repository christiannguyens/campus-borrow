# Campus Borrow

Campus Borrow is a marketplace where students lend and borrow items on campus. A signed-in student posts an item with a name, description, category and pickup location. Other students browse the available items, filter by category and search by name, then send a request. The lender approves or declines it, and later marks the item returned. Both people see each status change live, without refreshing.

## Live demo

https://campus-borrow-christian.app.space

## How to try it

1. Sign in, open **Post item**, and post something.
2. In another browser or a private window, sign in with a second account. Open **Browse**, find the item, and click **Request**.
3. Back in the first account, open **My items**. The request appears there with **Approve** and **Decline** buttons.
4. Click **Approve**. The item shows as **Borrowed**, and the second account's **My requests** page shows **Approved** with the pickup location.
5. Click **Mark returned**. The item is **Available** again and shows back up on **Browse**.

Keep both windows open: each change shows up in the other one without refreshing.

## DeepSpace features used

- **Auth.** All the borrowing pages live under `src/pages/(app)/(protected)/`, which asks signed-out visitors to sign in. The signed-in user's ID decides whose items and requests you see, and every server action checks it.
- **Collections with permissions.** There are two collections, `items` and `requests`, each with rules the server enforces:
  - `items`: any signed-in student can read and post. Only the student who posted an item can edit or delete it. Students can't set `status` directly.
  - `requests`: only the borrower and the lender can read a request. Students can't create or change requests directly.
- **Live queries.** Every list uses `useQuery`, which stays up to date over a live connection. That's how status changes reach the other person without a refresh.
- **Server actions.** Four actions handle every request change: `requestItem`, `approveRequest`, `declineRequest` and `markReturned`. Each one checks who's calling before it saves anything.

## Deliberately left out

- **Payments.** Borrowing between students is free. Payments would add checkout, refunds and disputes without making request → approve → return work any better.
- **Chat.** The pickup location and live statuses are enough to hand an item over. Private chat would need its own permissions and moderation, which is a second product.
- **Ratings.** Ratings only mean something after many completed loans. They're a trust feature for later, not part of the loop.
- **AI features.** Posting is four fields, and finding an item is a name search plus a category filter. Nothing in the loop needs AI. (The DeepSpace scaffold still registers its standard agent-tool endpoints. They run with the caller's own permissions, and the end-to-end test uses one to attempt forbidden writes. The app has no AI chat or AI-driven behavior.)

## Key files

| File | What it does |
|---|---|
| `src/schemas/items-schema.ts` | `items` columns, categories and permissions |
| `src/schemas/requests-schema.ts` | `requests` columns and permissions (only the borrower and lender can read) |
| `src/schemas.ts` | Registers the collections |
| `src/actions/borrowing.ts` | The four server actions and their checks |
| `src/lib/borrowing.ts` | Shared types, plus `callAction()` for calling the actions from the browser |
| `src/pages/(app)/(protected)/browse.tsx` | Browse available items, with search and category filter |
| `src/pages/(app)/(protected)/post-item.tsx` | Post item form with required-field checks |
| `src/pages/(app)/(protected)/my-items.tsx` | Your items and incoming requests (Approve / Decline / Mark returned) |
| `src/pages/(app)/(protected)/my-requests.tsx` | Requests you've made, with live status |
| `src/nav.ts` | Navigation links |
| `src/schemas/schemas.test.ts` | Runs DeepSpace's schema checker on both collections |
| `tests/borrowing.spec.ts` | Three-user browser test of the full loop and the permission rules |

## Security note

Schema permissions can't express "only the lender may approve." The one rule that lets both the borrower and the lender into a request (`'collaborator'`) would also let either of them edit every field, so a borrower could approve their own request. Instead, students can read requests but can't write them, and every change goes through a server action.

Server actions run with schema permissions turned **off**. That makes the checks in `src/actions/borrowing.ts` the real protection:

- the lender comes from the item itself, not from the browser;
- only the lender can approve, decline or mark returned;
- each step only works from the right status.

If you remove one of those checks, nothing else catches the mistake.

## Known limitations

- A borrower can't cancel a request.
- There's no UI for editing or deleting an item, though the permissions allow owners to do both.
- A lender can delete an item while it's lent out. Its requests stay saved, but nobody can approve them or mark them returned anymore.
- When a request is approved, the other pending requests for that item are declined automatically. These are separate writes, not one all-or-nothing operation. If one fails partway, some requests can stay pending, and the lender has to decline them by hand.

## Run locally

Requires Node 22.15+ (or 24 / 26).

```sh
npm install
npx deepspace auth login
npx deepspace dev start
```

Open the local URL the dev server prints.

**Use Chrome for local development.** The session cookie is marked Secure, and Safari drops it on `http://localhost`, so you can't sign in there. Test Safari on the deployed `https://` site instead.

Tests:

```sh
npm run validate                                 # type-check + unit tests
npx deepspace test run e2e --grep borrowing      # needs 3 test accounts
```

Create the three test accounts with `npx deepspace test accounts create --email <name>@deepspace.test --name "<Name>" --password-stdin`.
