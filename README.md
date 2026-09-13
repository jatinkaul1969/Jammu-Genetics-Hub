# Jammu Genetics Hub

A diagnostics test aggregator: compare test/package prices across Jammu Genetics Hub,
Thyrocare, Redcliffe Labs, Dr Lal PathLabs and Metropolis for routine tests, plus five
specialty genetics partners (AMPATH, Tata 1mg, MedGenome, Yoda Diagnostics, Lilac
Insights) for prenatal/carrier/hereditary-cancer genetic testing — then book home sample
collection from whichever lab you choose. Phone-OTP login captures the patient's
name and age. An admin panel manages booking status and report delivery.

**Important business fact, easy to get wrong in copy**: Jammu Genetics Hub
does not run its own testing lab — it's directly accredited with every
partner lab above, and every test is actually processed by one of them. JGH
does still have its own price tier on every product (`Lab.isOwn`) and its
own phlebotomist network for home collection — those are real — but never
word anything (site copy, the AI chat prompt, a `Lab.accreditation` string)
to claim JGH itself is "NABL Accredited" or "our own lab." See the
`accreditation` comment on the `jammu-genetics-hub` entry in
[`prisma/seed.ts`](prisma/seed.ts).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Prisma 7 + Postgres (via the `@prisma/adapter-pg` driver adapter) — a hosted
  [Prisma Postgres](https://console.prisma.io) instance in production; any
  Postgres connection string works locally too (see "Getting started" below)
- Cart is client-side (localStorage); patient auth is an httpOnly `jgh_uid`
  cookie set after OTP verification; admin auth is a separate httpOnly
  `jgh_admin` cookie (a salted hash of `ADMIN_PASSWORD`, not the password
  itself). Both are fine for a prototype — swap for signed sessions/JWTs
  before real production use.

**Per-account cart isolation:** the cart is stored in localStorage under a key
scoped to whoever is currently logged in (`jgh_cart_v1_<phone>`, or
`jgh_cart_v1_guest` when logged out) — see
[`src/lib/cart-context.tsx`](src/lib/cart-context.tsx) and
[`src/lib/auth-context.tsx`](src/lib/auth-context.tsx). Logging out, or
logging into a different account on the same browser, always loads that
identity's own cart, never a previous one — items added while a guest are
carried into whichever account logs in next, but never into a *different*
account than the one that added them. This was a real bug earlier (a single
shared cart key) — verified fixed by testing exactly that sequence: add an
item as account A, log out (cart empties), log into account B (cart still
empty, not A's), add a different item as B, log back into A (A's original
item is back, B's item never appears).

## Getting started

```bash
npm install
cp .env.example .env      # then set DATABASE_URL and ADMIN_PASSWORD
npx prisma migrate dev    # applies the schema to your Postgres database
npx prisma db seed        # loads labs, categories, tests/packages, prices
npm run dev
```

`DATABASE_URL` needs a real Postgres connection string — the easiest way to
get one locally is the same [Prisma Postgres](https://console.prisma.io)
service production uses (free tier), or point at any local/Docker Postgres.
There's no more SQLite file to worry about.

Then open http://localhost:3000 (storefront) or http://localhost:3000/admin
(admin panel — log in with `ADMIN_PASSWORD`).

**Windows note:** this environment had a stray `NODE_OPTIONS=--enable-source-maps`
in its shell environment that crashes Turbopack's CSS worker process on Windows.
`npm run dev` runs `dev.cmd`, which clears `NODE_OPTIONS`, fixes `PATH`, and runs
`next dev --webpack --disable-source-maps` to avoid it. If you hit the same crash
elsewhere, that's the fix.

**Generated Prisma client**: `src/generated/prisma` is gitignored (it's
generated code) and the schema uses that custom output path, so it must be
regenerated after every fresh `npm install` — a `postinstall` script in
`package.json` runs `prisma generate` automatically for this. If you ever see
`Module not found: Can't resolve '@/generated/prisma/client'`, that hook
didn't run — just run `npx prisma generate` by hand.

## Deployment

Live on [Vercel](https://vercel.com), connected to the GitHub repo
(`jatinkaul1969/Jammu-Genetics-Hub`) for auto-deploy on every push to `main`.
Database is a [Prisma Postgres](https://console.prisma.io) instance
(Singapore region — closest to Jammu). The same `DATABASE_URL` is currently
used for both local dev and production, so local testing and the live site
share one database; point local `.env` at a different Postgres instance if
you want to stop that.

**Required environment variables on Vercel** (Project Settings → Environment
Variables — these are separate from local `.env` and must be added there
explicitly, nothing carries over automatically):
- `DATABASE_URL` — the Postgres connection string
- `ADMIN_PASSWORD` — the owner login password. **This one is easy to forget**
  — a fresh Vercel project has neither variable set by default, and the
  admin login page fails with "Admin access isn't configured yet" until it's
  added. Adding/changing an env var doesn't affect an already-running
  deployment — you must **Redeploy** afterward for it to take effect.
- Everything else (`RAZORPAY_*`, `WHATSAPP_*`, `ANTHROPIC_API_KEY`,
  `CRON_SECRET`) is optional, same as local — the app runs fine in dev-mode
  fallback behavior without them (OTP shown on-screen instead of sent, no
  online prepayment button, chat uses the keyword fallback, etc.)

**Two gotchas hit standing this up, worth knowing if the site ever 404s or
looks unreachable after a redeploy:**

1. **Deployment Protection.** Vercel's "Vercel Authentication" protection,
   if left on Standard/all-deployments, puts a Vercel-login wall in front of
   *Production* too — meaning real customers would be bounced to a Vercel
   SSO page instead of the site. Project → Settings → Deployment Protection
   → Vercel Authentication should be scoped to Preview deployments only, not
   Production.
2. **Domain isn't automatic for team-owned projects.** A project under a
   Vercel *team* workspace doesn't automatically get the clean
   `<project-name>.vercel.app` address the way a personal-account project
   does (that exact name may already be taken by someone else — `.vercel.app`
   names are global, not per-team). Check Project → Settings → Domains; if
   it's empty, add the desired `<name>.vercel.app` explicitly there.

**The build itself**: `next build` needs the generated Prisma client (see the
`postinstall` note above) — this is the one dependency that isn't obvious
from `package.json` alone, since `src/generated/prisma` is gitignored and
only exists after `prisma generate` runs. If a deployment fails with `Module
not found: Can't resolve '@/generated/prisma/client'`, confirm the
`postinstall` script in `package.json` is still `prisma generate`.

**Database differs from local dev in one behavior worth knowing**: SQLite's
`contains` filter is case-insensitive by default; Postgres's isn't. Every
`contains:` filter in the app search/lookup features
(`src/lib/catalog.ts`, `src/lib/chat-context.ts`, the admin/staff search
routes) explicitly passes `mode: "insensitive"` to match the SQLite-era
behavior — if you ever add a new `contains:` filter, add that too, or search
will silently become case-sensitive in production only.

## OTP login

`POST /api/otp/send` is rate-limited (5 requests / 10 min per phone number) and
sends the code over **WhatsApp** when configured. Without the env vars it runs
in **dev mode**: a 6-digit code is generated, stored in the `OtpCode` table,
and returned directly in the response as `devOtp` — the login modal shows it in
an on-screen banner instead of sending it.

Delivery reuses the WhatsApp Cloud API credentials set up for the chat
automation (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`, see below) —
there is no separate SMS gateway and no per-message charge on WhatsApp's free
tier. To go live:

1. In the Meta app, open **WhatsApp → Message templates** and create a template
   in the **Authentication** category with a **Copy code** button. Note its
   name and language (e.g. `otp_login` / `en_US`).
2. Set in `.env`:

   ```
   WHATSAPP_OTP_TEMPLATE_NAME="otp_login"
   WHATSAPP_OTP_TEMPLATE_LANG="en_US"
   ```

Once `WHATSAPP_OTP_TEMPLATE_NAME` is set (and the Cloud API creds are present),
`devOtp` stops being returned — the code only ever leaves the server as a
WhatsApp message (see `sendOtpWhatsApp()` in
[`src/lib/whatsapp-cloud.ts`](src/lib/whatsapp-cloud.ts) and
[`src/lib/otp.ts`](src/lib/otp.ts)). Authentication templates carry the code in
both the message body and the copy-code button, which is why the code is passed
twice in the send payload.

## Chat widget

A floating chat button (bottom-right, every page except `/admin`) answers
customer questions in real time. Two modes, switched automatically by whether
`ANTHROPIC_API_KEY` is set:

- **Without a key (default):** a small keyword-matched responder in
  [`src/lib/chat-fallback.ts`](src/lib/chat-fallback.ts) handles common
  questions (home collection, OTP login, reports, booking, payment) and looks
  up real prices from the database when a test/package name is mentioned. No
  external dependency, works immediately.
- **With a key:** `/api/chat` streams real answers from Claude
  (`claude-opus-5`) instead, grounded with the same live product-price lookup
  so it can't invent numbers — see [`src/lib/chat-context.ts`](src/lib/chat-context.ts)
  for the system prompt and the price-grounding logic, and
  [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts) for the streaming
  endpoint (rate-limited to 15 messages/min per IP).

Get a key at [console.anthropic.com](https://console.anthropic.com) and set
`ANTHROPIC_API_KEY` in `.env` — no other code changes needed.

Next to the chat button is a WhatsApp button (`wa.me` click-to-chat, using
`WHATSAPP_NUMBER` in [`src/lib/contact.ts`](src/lib/contact.ts)) — see the
WhatsApp automation section below for what happens once a customer lands
there.

## WhatsApp automation

The site's WhatsApp button and the contact numbers in the footer point at a
real number backed by the **WhatsApp Cloud API** (Meta's official Business
Platform), not just a `wa.me` link — set up the credentials below and
messages sent to that number get an instant, automated reply from the same
Claude-powered assistant as the site chat, with real product/price grounding.
An admin can take over any conversation at any time from `/admin/whatsapp`.

**How it works:**

1. A customer messages your WhatsApp Business number. Meta POSTs it to
   `/api/whatsapp/webhook` ([`src/app/api/whatsapp/webhook/route.ts`](src/app/api/whatsapp/webhook/route.ts)).
2. The webhook stores the message, then generates a reply using the same
   `SYSTEM_PROMPT` and `findRelevantProducts` price-grounding as the website
   chat widget (or the same keyword fallback if `ANTHROPIC_API_KEY` isn't
   set), and sends it back via [`src/lib/whatsapp-cloud.ts`](src/lib/whatsapp-cloud.ts).
3. If the message looks like something the bot can't resolve — a
   cancellation/reschedule request, or the customer explicitly asking for a
   human — the bot answers once, says it's flagging the conversation for the
   team, and **pauses itself** on that conversation so it won't reply on top
   of you.
4. `/admin/whatsapp` lists every conversation (bot-active vs. needs-you), and
   each thread has a reply box — sending a manual reply from there also
   pauses the bot, and a "Resume bot" button un-pauses it once you're done.

**Setup** (until these env vars are set, the WhatsApp button on the site
still works fine as a plain click-to-chat link — nothing breaks, it just
isn't automated):

1. Create a Meta developer app at [developers.facebook.com](https://developers.facebook.com)
   and add the **WhatsApp** product.
2. Either use the free test number (instant, but can only message numbers
   you've added as testers) or register your real business number — the
   latter requires Meta Business verification, which can take a few days.
3. From the app dashboard, copy the **temporary/permanent access token** and
   the **Phone Number ID** into `.env` as `WHATSAPP_ACCESS_TOKEN` and
   `WHATSAPP_PHONE_NUMBER_ID`.
4. Pick any random string as `WHATSAPP_VERIFY_TOKEN` and put it in `.env`
   too — you'll enter the same value in the Meta dashboard when registering
   the webhook.
5. In the Meta app's WhatsApp → Configuration page, set the webhook callback
   URL to `https://<your-deployed-domain>/api/whatsapp/webhook` (Meta needs a
   real public HTTPS URL — `localhost` won't work; use a tunnel like ngrok
   for local testing) and the verify token from step 4, then subscribe to the
   `messages` field.
6. Copy the app's **App Secret** into `.env` as `WHATSAPP_APP_SECRET` — this
   is used to verify that webhook requests really came from Meta
   (`verifyWhatsAppSignature` in `whatsapp-cloud.ts`); without it, the webhook
   still works but accepts unsigned requests, which is fine for local testing
   only.

Note: outside a 24-hour window since the customer's last message, WhatsApp
requires a pre-approved **message template** to send anything — this only
affects proactively messaging a customer first (e.g. an automated
abandoned-cart nudge), not replying to an inbound message, which is what this
integration does.

The same credentials also power **login OTP delivery** once you create an
Authentication-category template and set `WHATSAPP_OTP_TEMPLATE_NAME` — see the
[OTP login](#otp-login) section above.

## Collection slots, fees & membership

Checkout ([`src/components/CheckoutForm.tsx`](src/components/CheckoutForm.tsx),
slot/fee logic shared with the server in
[`src/lib/collection-slots.ts`](src/lib/collection-slots.ts)):

- **Dynamic hourly slots** — today plus the next 6 days, hourly slots from
  6 AM–8 PM.
- **Express fee (₹150), tagged per slot** — for today, `getSlotsForDate()`
  returns every remaining hourly slot (not just a narrow window), each
  tagged `isExpress: true/false`. Only slots starting within
  `EXPRESS_WINDOW_MINUTES` (90) of the request are `isExpress` — those get
  an "Express" badge on the slot button itself and add the fee; later slots
  today are ordinary, no-fee bookings, same as picking a future date.
  `isExpressSlot(date, slot)` recomputes this server-side from the specific
  date+slot actually stored on the booking — the fee is never trusted from
  the client.
- **Diagnostic fee (₹49)** — a flat fee on every booking, same as the
  per-visit fee most partner labs charge.
- **Hard copy reports (₹149 per lab)** — opt-in add-on for a printed report
  alongside the always-free digital one; multiplied by the number of
  distinct labs in the cart, since each lab prints its own.
- **Membership (₹199/yr, 10% off every booking)** — opt-in at checkout,
  one flat tier. Buying it discounts the very order that bought it too.
  Never stacks with a coupon — whichever discount is larger wins
  (`Booking.discountKind` records which). Once active, `AuthUser.membershipActive`
  (threaded through `getCurrentUser`/`/api/auth/me`/OTP verify) hides the
  upsell and auto-applies the discount on every future checkout until
  `User.membershipExpiresAt` (one year out) passes.

None of the four fees above are touched by a coupon or membership discount —
they're added after the discount is subtracted, same rule Redcliffe and
other partner labs use. All four are server-computed constants in
`collection-slots.ts`; the client only ever sends its date/slot/add-on
*choices*, never an amount.

## Coupons

**Audience targeting**: every coupon has an `audience` — `ALL`, `NEW_USER`
(first booking only), or `MEMBER` (VIP members only, see membership above) —
set from `/admin/coupons`. This is the single source of truth for two
separate things: (1) whether a given customer is *allowed* to apply the code
(checked server-side in `validateCoupon()`), and (2) whether they *see* it
listed at all, in the "Your coupons" section of checkout's Coupon block
(`getVisibleCouponsForUser()`, behind `GET /api/coupons/mine`) — so a
customer doesn't need to already know a code to use one they qualify for.
Separately, first-time customers get an automatic **WELCOME15** (`NEW_USER`
audience) silently pre-applied — `GET /api/coupons/eligible` on checkout
load — a narrower, deliberate behavior kept distinct from the visible list:
only ever a `NEW_USER` coupon, so a first-time visitor gets a welcome
discount without hunting for a code, but nothing else silently discounts a
returning customer's order without them choosing it. Either way, the code
is re-validated server-side in `POST /api/bookings` — the client-computed
discount is never trusted. When a cart spans multiple labs (multiple
bookings from one checkout), the discount is split proportionally across
them; see [`src/lib/coupons.ts`](src/lib/coupons.ts) for the
eligibility/discount logic and the `Coupon` model in
[`prisma/schema.prisma`](prisma/schema.prisma) for the fields (`type`
PERCENT/FLAT, `maxDiscount`, `minOrderAmount`, `audience`, `expiresAt`;
`firstOrderOnly` is kept in sync with `audience === "NEW_USER"` for any
older code still reading it directly). The `WELCOME15` coupon still seeds
from [`prisma/seed.ts`](prisma/seed.ts) as a baseline default, but ongoing
coupon management belongs in the admin UI now, not the seed file.

**Client/server split, easy to get wrong**: `src/lib/coupons.ts` imports
`prisma`, which pulls in the `pg` driver adapter — a Node-only module. A
`"use client"` component that imports *anything* from
`coupons.ts` (even a plain constant with no database code) drags that whole
chain into the browser bundle and breaks the dev build with `Module not
found: Can't resolve 'fs'`, taking down every page that shares the chunk —
this actually happened once building the audience feature. Client-safe
constants shared with admin forms (`COUPON_AUDIENCES`, `CouponAudienceKey`)
live in the separate [`src/lib/coupon-constants.ts`](src/lib/coupon-constants.ts)
instead — never add a new export to `coupons.ts` that a client component
needs; put it in `coupon-constants.ts`.

## Admin panel

`/admin` has its **own root layout** ([`src/app/admin/layout.tsx`](src/app/admin/layout.tsx)),
completely separate from the customer site's
([`src/app/(site)/layout.tsx`](src/app/(site)/layout.tsx)) — no shared header,
cart, login modal, or chat widget between them. They also use different
cookies (`jgh_admin` vs `jgh_uid`), so an admin session and a customer session
are entirely independent; being logged into one never shows or implies
anything about the other. `/admin` requires `ADMIN_PASSWORD` to be set in
`.env` (there's no login form at all if it isn't). From there:

- **Bookings list** (`/admin/bookings`) — search by booking ID/phone/patient
  name, filter by status or lab
- **Booking detail** — update status (Pending → Confirmed → Sample Collected →
  Report Ready → Cancelled), upload a PDF report (auto-sets status to Report
  Ready), leave an internal note
- **Abandoned Carts** (`/admin/abandoned-carts`) — logged-in customers with
  items still in their cart and no completed booking since. Each row has a
  "Send WhatsApp reminder" button — a `wa.me` click-to-chat link pre-filled
  with a message referencing their actual cart contents and a real link back
  to the product page (see [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts)). This
  needs no WhatsApp Business API credentials, but it's not unattended
  auto-sending either — clicking it opens WhatsApp with the message ready,
  and a person still hits Send. For real automated sending later, swap this
  for the WhatsApp Cloud API (Meta) with an approved message template — same
  "works immediately, upgrade when you have credentials" pattern as OTP/SMS
  and the AI chat above.

  The cart itself stays client-side (localStorage) as the source of truth;
  logged-in users' carts are mirrored server-side into `CartSnapshot`
  (debounced, best-effort — never blocks shopping if it fails) purely so this
  page can detect abandonment. A snapshot is deleted the moment that user
  completes a booking, or empties their cart.
- **WhatsApp Chats** (`/admin/whatsapp`) — every conversation from the site's
  WhatsApp number, with a "Bot active" / "Needs you" badge. Open a thread to
  see the full history and reply manually (pauses the bot on that
  conversation) or resume the bot once you're done. See the WhatsApp
  automation section above for how the auto-reply/handoff works.
- **Pickups** (`/admin/pickups`) and **Phlebotomists** (`/admin/phlebos`) —
  see "Phlebo pickups" below.
- **Book for Customer** (`/admin/book-for-customer`) — see "Sales &
  phone-in bookings" below.
- **Team** (`/admin/team`) — manage support-staff accounts. See below.
- **Coupons** (`/admin/coupons`) — create, edit, activate/deactivate or
  delete discount codes for sales and occasions. See Coupons above.
- **Settings** (`/admin/settings`) — change the owner's own admin login
  password (requires the current password). Storing it only in
  `ADMIN_PASSWORD` meant changing it required editing `.env` and restarting
  the server; changing it here updates a DB row (`OwnerCredential`,
  scrypt-hashed like staff passwords) that takes over as the source of truth
  immediately, no restart needed. `ADMIN_PASSWORD` in `.env` remains the
  bootstrap/fallback password until the owner changes it for the first time.

## Team & delegated access

The single `ADMIN_PASSWORD` login is the **owner** account — always full
access, including staff management, catalog and pricing, which are never
delegable. On top of that, the owner can create **staff accounts**
(`/admin/team` → "Add staff member") with a name, username and password, and
grant each one an individual set of permissions rather than a fixed role —
today's options (see [`src/lib/permissions.ts`](src/lib/permissions.ts)):

- `leads` — work the callback-request queue
- `whatsapp` — the same WhatsApp Chats interface as the owner
- `bookings` — the same bookings list/detail as the owner (status, reports)
- `pickups` — live phlebotomist pickup tracking, for helping a customer on a call
- `sales` — book a test on behalf of a customer over a call

Each staff account also has a **team** — `support`, `sales`, or `operations`
(see `STAFF_TEAMS` in `permissions.ts`) — a purely organizational label shown
on the Team page; picking one when creating an account just pre-checks the
permissions typical for that team (e.g. "Sales" pre-checks `sales` +
`bookings`), it doesn't grant anything by itself — `permissionsJson` is what
actually controls access, so you can always fine-tune per person.

Staff log in separately at `/admin/staff-login` (own `jgh_staff` cookie,
completely independent of the owner's `jgh_admin` session) and land on
`/admin/staff`, which only shows the sections they've been granted — an
account with zero permissions sees a placeholder until an admin grants some.
Disabling an account from `/admin/team` takes effect immediately (checked
fresh on every request, not just at login).

**Callback request auto-assignment**: every "Request a callback" submission
is round-robin assigned to whichever `leads`-permitted staff member is
currently **online** (a self-toggle staff control, separate from the
account-enabled flag the owner controls) and has the **fewest open leads**
right now — so closing your tickets is what makes you next in line, and ties
break on whoever was assigned least recently. See
[`src/lib/lead-assignment.ts`](src/lib/lead-assignment.ts). The owner can
always see and manually reassign any lead from `/admin/leads/[id]`; staff can
only act on leads assigned to them.

Each lead has a **status** (New → Contacted → Follow-up needed → Converted /
Closed) and a running **call-notes log** — every call/update gets its own
timestamped entry, so if a different staff member (or the same one, later)
opens the lead again, they see exactly where things were left off instead of
starting the conversation cold. Shared between the owner's and staff's lead
detail views via [`src/components/LeadDetail.tsx`](src/components/LeadDetail.tsx).

Reports are stored outside `public/` under `storage/reports/<bookingId>.pdf`
and served through [`/api/reports/[code]`](src/app/api/reports/[code]/route.ts),
which checks that the requester is either the booking's own patient (via their
`jgh_uid` session) or an authenticated admin — nobody else can fetch a report
by guessing a URL.

## Sales & phone-in bookings

The `sales` permission (owner, or any staff member granted it — e.g. a Sales
team account) unlocks **Book for Customer** (`/admin/book-for-customer` for
the owner, `/admin/staff/book-for-customer` for staff). It's the same
booking machinery as self-service checkout, just walked through by a
person on a call instead of the customer clicking through the site:

1. Look up the customer by phone (`GET /api/admin/customers/lookup`) — if
   they already have an account, their saved patients/addresses show up as
   picks; if not, a couple of fields creates one on the spot.
2. Search tests/packages and add specific (test, lab) price rows to a running
   cart — any of the 5 labs, exactly like the customer-facing comparison.
3. Pick or add a patient and collection address, a date/slot, and an
   optional coupon code.
4. Submit — this calls the exact same booking-creation logic as customer
   checkout ([`src/lib/create-booking.ts`](src/lib/create-booking.ts), shared
   by both `POST /api/bookings` and `POST /api/admin/bookings/create-for-customer`),
   so the result is indistinguishable from a self-service booking: it belongs
   to the customer's own account, shows up in their "My Bookings", and
   triggers the same phlebo auto-assignment. The only difference is
   `Booking.bookedByStaffId`, kept for internal attribution.

**Phlebos get this too**, at `/admin/phlebo/book-for-customer` — the same
[`AdminBookingForm`](src/components/AdminBookingForm.tsx) component, for
converting a customer on the spot during a home visit (e.g. they mention
wanting another test while the phlebo is already there). Each price option
is sorted cheapest-first and the lowest is tagged ★, so the phlebo can
immediately quote the best rate. [`src/lib/admin-access.ts`](src/lib/admin-access.ts)'s
`getAdminActor()` recognizes a phlebo session as a third actor type
alongside owner/staff, but `actorHasPermission()` only ever grants it the
`sales` permission — a phlebo can create a booking through this one form and
nothing else in the admin surface. Attribution uses the separate
`Booking.bookedByPhleboId` field (not `bookedByStaffId`, since a `Phlebo` is
a different model from `AdminUser`) — see the `"PickupAssignment"` vs.
`"PhleboBookedBookings"` relation names in `schema.prisma`, needed because
`Booking` now has two independent relations to `Phlebo` (who's assigned to
collect it, and who sold it).

## Phlebo pickups

A third internal login, separate from both the owner and staff accounts —
phlebotomists get their own limited portal for the pickups assigned to them.
Only ever used for **our own lab's** bookings (`Lab.isOwn`) — a competitor
lab dispatches and tracks its own phlebotomist, which this site has no
visibility into.

**Assignment**: the moment a booking for our lab is created (self-service or
via Book for Customer), it's round-robin assigned to whichever phlebo is
**online** and has the fewest open pickups on that *same scheduled date* —
see [`src/lib/phlebo-assignment.ts`](src/lib/phlebo-assignment.ts). Ties
break on whoever was assigned least recently, same pattern as lead
assignment.

**The phlebo's own flow** (`/admin/phlebo-login` → `/admin/phlebo/pickups`):
a pickup arrives as `ASSIGNED` and must be explicitly **accepted** before it
shows the customer anything; from there a **status dropdown**
([`src/components/PhleboPickupActions.tsx`](src/components/PhleboPickupActions.tsx))
moves it through `ACCEPTED` → `EN_ROUTE` → `ARRIVED` → `COLLECTED` (which
also flips the booking's own `status` to `COLLECTED`, feeding straight into
the existing admin bookings pipeline) — the dropdown isn't rigidly locked to
one step at a time beyond "you haven't collected yet," so a phlebo who
selects the wrong stage can correct it themselves. A phlebo can **cancel**
an accepted-or-earlier pickup any time up to **1 hour before** the scheduled
slot ([`src/lib/pickup-time.ts`](src/lib/pickup-time.ts) enforces the cutoff
server-side); cancelling immediately tries to auto-reassign someone else
online, excluding the phlebo who just backed out.

**Timing record**: every status change — assignment, acceptance, en route,
arrival, collection, cancellations and reassignments — is timestamped twice
over: Booking keeps a quick-access column per stage (`phleboAssignedAt`,
`phleboRespondedAt`, `phleboEnRouteAt`, `phleboArrivedAt`,
`phleboCollectedAt`), and a separate, permanent `PickupEvent` row is
appended for each one (who/what triggered it — `system`/`phlebo`/`owner`/`staff`
— and exactly when), via the single
[`recordPickupStatus`](src/lib/pickup-events.ts) helper so nothing updates
one without the other. The owner/staff pickup detail view renders the full
event list as a "Timing record" — this is the actual record for reporting,
not just the current snapshot.

**Live location**: tapping "I'm on the way" starts sharing the phlebo's
GPS position (`navigator.geolocation.watchPosition`, throttled to about
once every 15s) to `PATCH /api/phlebo/location`, which stores only the
latest point — not a full track history. `GET /api/bookings/[id]/track`
polls that back out to whoever's allowed to see it: the customer (once the
phlebo has **accepted**, not before — their identity isn't revealed while
still pending, since it could still change hands) sees a status-stage
tracker and, once `EN_ROUTE`, a live map on `/account/bookings`
([`src/components/PickupTracker.tsx`](src/components/PickupTracker.tsx));
the owner and any `pickups`-permitted staff see the same thing plus a
reassign control, from `/admin/pickups/[id]`
([`src/components/PickupLiveDetail.tsx`](src/components/PickupLiveDetail.tsx)) —
so if a customer calls in asking "where's my phlebotomist," anyone on the
team can pull up the exact live position.

**T-30-minute reminder**: once a pickup is accepted, a WhatsApp message with
the phlebo's name and phone number is meant to go out 30 minutes before the
slot. The sending logic itself is ready
([`GET /api/cron/pickup-reminders`](src/app/api/cron/pickup-reminders/route.ts) —
protected by `CRON_SECRET`, reuses the WhatsApp Cloud API integration above),
but **nothing calls it on its own** — Next.js has no built-in scheduler, so
you need to point an external one (Vercel Cron, an OS cron job, a task
scheduler) at that URL every 5-15 minutes. Until that's wired up, the
reminder simply won't fire — everything else (in-app tracking, the phlebo's
own workflow) works regardless.

Owner-only **Phlebotomists** page (`/admin/phlebos`) manages accounts the
same way Team manages staff — add, disable, reset password.

**Customer-facing detail**: each booking on `/account/bookings` links to
`/account/bookings/[id]` — booking ID, collection date/time, full address,
payment status, and the same live pickup tracker — and from there to
`/account/bookings/[id]/invoice`, a printable invoice (itemized tests,
coupon applied, total paid, sample collection date) with a "Print / Save as
PDF" button (`window.print()` — no PDF library needed; `globals.css` hides
the header/footer/floating widgets in print via `@media print`).

## Payments (Razorpay)

Optional — leave `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` unset and checkout
behaves exactly as it always has (pay the phlebotomist cash on collection).
Set both and a "Pay online now" button appears on the booking confirmation
page ([`src/components/RazorpayPayButton.tsx`](src/components/RazorpayPayButton.tsx)),
using Razorpay's standard hosted Checkout widget — one integration covers
cards, UPI, netbanking and wallets, since Razorpay's own widget handles
method selection rather than needing separate code per payment method.

Flow: `POST /api/payments/razorpay/order` creates a Razorpay order for the
booking's total (server-computed from the DB, never trusting a client
amount); Checkout's `handler` callback gets an order id + payment id +
signature back, which `POST /api/payments/razorpay/verify` checks against an
HMAC computed with `RAZORPAY_KEY_SECRET`
([`src/lib/razorpay.ts`](src/lib/razorpay.ts)) before marking the booking(s)
`paymentStatus: "PAID"`. Get test-mode keys free at
[dashboard.razorpay.com](https://dashboard.razorpay.com).

## Data model

See [`prisma/schema.prisma`](prisma/schema.prisma):

- `Lab` — ten labs total: the original five general-comparison labs (Jammu
  Genetics Hub, Thyrocare, Redcliffe Labs, Dr Lal PathLabs, Metropolis —
  `isOwn` marks Jammu Genetics Hub) plus five **specialty genetics partners**
  (AMPATH, Tata 1mg, MedGenome, Yoda Diagnostics, Lilac Insights — flagged
  `isSpecialtyPartner: true`). See "Genetic & specialty testing" below.
- `Category` / `Product` — tests and packages, tagged `TEST` or `PACKAGE`,
  across 18 categories (full body, diabetes, heart, thyroid, vitamins,
  liver & kidney, fever, women's health, senior citizen, general, bone &
  joint, cancer screening, allergy, STD screening, pregnancy, executive,
  child care, genetic testing)
- `Price` — one row per (product, lab) pair — this is the comparison engine.
  Not every product has a row for every lab: the five general labs are
  auto-priced for ordinary commodity tests, but the five specialty partners
  are **sparse by design** (added only where that partner actually offers the
  test — see below). `testCode` is an optional field, that partner's own
  internal order/routing code — **admin reference only, never shown to
  customers**, who only ever see the test name and price.
- `User` / `OtpCode` — phone-OTP accounts. `membershipActive`/
  `membershipExpiresAt` on `User` track the standing membership described
  above.
- `Patient` — people a booking can be made for; a "self" entry is created
  automatically from the account holder's own details the first time they
  reach checkout, and "Someone else" at checkout adds a family member that's
  saved for next time
- `Address` — saved collection addresses, reusable across bookings; the first
  one saved becomes the default
- `Coupon` — discount codes (see Coupons section above)
- `Booking` / `BookingItem` — one booking per lab per checkout (a cart spanning
  multiple labs splits into multiple bookings, since each lab sends its own
  phlebotomist); `status`, `reportFile` and `adminNote` are admin-managed.
  `patientId`/`addressId` link back to the `Patient`/`Address` actually used
  (when not freshly typed in) — checkout uses this to default a returning
  patient to the address they were last booked at, rather than a single
  account-wide default. Also carries the phlebo-pickup fields (`phleboId`,
  `phleboStatus`, `phleboAssignedAt`/`phleboRespondedAt`, `reminderSentAt`),
  payment fields (`paymentStatus`, `paymentMethod`, `razorpayOrderId`,
  `razorpayPaymentId`), `bookedByStaffId` for phone-in bookings, and the
  `diagnosticFee`/`expressFee`/`hardCopyFee`/`membershipFee`/`discountKind`
  fields described in "Collection slots, fees & membership" above

- `WhatsAppConversation` / `WhatsAppMessage` — one thread per customer
  WhatsApp number, with full message history (`sender`: customer/bot/admin)
  and a `botPaused` flag once a human needs to take over — see the WhatsApp
  automation section above
- `AdminUser` — staff accounts, with `permissionsJson` (a JSON array of
  granted permission keys), `team` (organizational grouping only), `enabled`
  (owner-controlled) and `online` (staff-controlled) — see Team & delegated
  access above
- `Lead` / `LeadNote` — callback requests, with `status` and `assignedToId`
  (round-robin assigned to online staff), plus a `LeadNote` per call/update
  for continuity across staff members
- `Phlebo` — phlebotomist accounts, structurally similar to `AdminUser` but
  separate (own login, own `enabled`/`online`), plus `currentLat`/`currentLng`/
  `locationUpdatedAt` for live tracking — see Phlebo pickups above
- `PickupEvent` — one append-only row per pickup status change (`status`,
  `actor`, `createdAt`) — the permanent timing record described above,
  separate from Booking's own quick-access per-stage timestamp columns

Booking's `patientName`/`patientAge`/`addressLine`/`city`/`pincode` are
snapshotted at booking time (not just foreign keys) so a booking's history
stays accurate even if the underlying `Patient`/`Address` row is later edited.

Seed data lives in [`prisma/seed.ts`](prisma/seed.ts) — 82 tests/packages
priced across all five general labs with enough variance that Jammu Genetics
Hub isn't always the cheapest, so the comparison table reads as honest rather
than rigged.

## Genetic & specialty testing

25 genetic/specialty products (prenatal screening, newborn screening, carrier
screening, hereditary cancer, exome/genome/karyotype/microarray) were
imported from a real combined price list covering 7 partner labs, curated
down from ~13,700 raw rows to the ~780 consumer-relevant ones and then to
these 25 canonical tests — see
[`prisma/genetic-tests-seed-data.ts`](prisma/genetic-tests-seed-data.ts) for
the full list and its header comment for the methodology.

**Why this needed its own model instead of just adding more products:**
partner labs brand the exact same clinical test differently — e.g. Redcliffe
Labs sells the Double Marker Test as "Combined Screening"; MedGenome sells
NIPT as "Claria-NIPT." String-matching on product names couldn't reconcile
this (proven by a normalization pass that still produced ~748 near-unique
groups from 780 rows) — each canonical product below was resolved by hand,
matching real per-partner test codes/prices to one clinical name.

**Sparse pricing**: unlike the five general labs (always auto-priced for new
commodity products — see `POST /api/admin/products`), the five specialty
partners never get an automatic price row. [`ProductPriceEditor`](src/components/ProductPriceEditor.tsx)
only renders rows for labs that already have a price, plus an "Add a lab…"
picker to deliberately add one and a per-row delete
([`DELETE /api/admin/products/[id]/prices`](src/app/api/admin/products/%5Bid%5D/prices/route.ts))
to remove one — so a product only ever lists the partners that actually offer
it.

**Note on the 5 pre-existing genetic products** (double/triple/quadruple
marker, NIPT, newborn screening panel) — these existed before this import
with fabricated prices at the original five labs. The seed now `deleteMany`s
any price row not in the new real partner list before upserting, so no stale
fabricated price survives re-seeding.

**Known open item**: the original ask described Lilac Insights branding NIPT
as "InsightT" — the source file doesn't contain that name anywhere; Lilac's
actual NIPT rows are testCode `T111` ("NIPT Basic Sequencing") and `T112`
("NIPT Advance Sequencing"), which is what's seeded instead. Worth
double-checking against Lilac's current price list if that naming matters.

## Known gaps

- Report PDFs are stored on local disk, not object storage — fine for a
  single-server deployment, not for a multi-instance one
- No audit log of who changed what (booking status, lead status, catalog
  edits) — just the current state
- No timeout on an `ASSIGNED` pickup a phlebo never responds to — it just
  sits there until the owner/staff notices and manually reassigns from
  `/admin/pickups/[id]`
- The T-30-min pickup reminder needs an external scheduler pointed at
  `/api/cron/pickup-reminders` — see "Phlebo pickups" above
- No refund flow for a Razorpay-paid booking that gets cancelled — that's a
  manual step in the Razorpay dashboard for now
- No admin UI to view or manually grant/revoke a customer's membership — it's
  only ever set by the customer buying it at checkout (`User.membershipActive`
  in Prisma Studio is the only way to inspect or override it today)
