# Support tickets (conversation system)

Customers open tickets and chat with admins in a messaging-style thread. Admins work them from
an inbox with assignment, priorities, internal notes and an audit trail. It **coexists with the
legacy `SupportTicket` system** (`/support` contact form → `app/api/tickets/route.ts`,
`/admin/tickets`) until the links are switched over. Nothing links to the new pages yet except
the "Support Inbox" card on `/admin` and the new system's own emails and Telegram messages.

## Routes

| URL | File | Notes |
| --- | --- | --- |
| `/support/v2` | `app/[locale]/support/v2/page.tsx` → `components/support/SupportLanding.tsx` | Temporary landing page (`SUPPORT_LANDING_PATH`). `?category=&subject=&server=` are forwarded to the form, so the legacy deep links work once it replaces `/support`. |
| `/support/tickets` | `app/[locale]/support/tickets/page.tsx` | My tickets, `?view=closed` for the closed tab |
| `/support/tickets/new` | `…/tickets/new/{page,NewTicketForm}.tsx` | Prefill: `?category=` (enum value), `?subject=`, `?server=` (Pterodactyl id from the dashboard URL). A SUSPENSION ticket preselects the only suspended server. |
| `/support/tickets/[ticketId]` | `…/tickets/[ticketId]/*` | Chat view; `ticketId` is the cuid |
| `/admin/support` | `app/[locale]/admin/support/page.tsx` | Inbox; filters live in the URL: `view`, `category`, `priority`, `sort`, `q`, `userId`, `serverId`, `page` |
| `/admin/support/[number]` | `app/[locale]/admin/support/[number]/page.tsx` | Admin detail; uses the human ticket number |

Customer URLs use the unguessable `Ticket.id`; admin URLs and all UI use `Ticket.number` ("#1042").

## Schema (`prisma/schema.prisma`)

- `Ticket` — `number` (autoincrement, unique), `userId`, `subject`, `category` (reuses the legacy
  `TicketCategory`), `status` (`TicketState`), `priority`, `assigneeId`, `gameServerId`, plus
  bookkeeping timestamps: `statusChangedAt`, `lastMessageAt` (sort key), `lastCustomerMessageAt`
  ("waiting since", admin unread), `lastStaffMessageAt` (customer unread; set for STAFF and SYSTEM
  messages), `firstResponseAt` (inbox metric). Customer, assignee and server FKs are `SetNull`, so a
  ticket outlives a deleted account or server.
- `TicketMessage` — `authorRole` (`CUSTOMER`/`STAFF`/`SYSTEM`) is a snapshot so role changes do not
  rewrite history. Messages cannot be edited (the email is already out).
- `TicketNote` — internal admin notes. A **separate table on purpose**: customer queries
  (`app/data-access-layer/tickets/customerTickets.ts`) never touch it, so a note cannot leak.
- `TicketEvent` — audit trail; `fromValue`/`toValue` are display snapshots (enum value, username,
  server name); `actorId = null` means the system/worker.
- `TicketReadState` — `(ticketId, userId) → lastReadAt`, for customers and each admin.

Manual migration note: start the number sequence above the legacy ids so "#12 old" and "#12 new"
cannot be confused, e.g. `ALTER SEQUENCE "Ticket_number_seq" RESTART WITH 1000;`.

## Status flow (`TicketState`)

| State | Meaning | Customer label |
| --- | --- | --- |
| `OPEN` | needs a staff reply | Waiting for support |
| `WAITING_FOR_CUSTOMER` | staff replied | Awaiting your reply |
| `ON_HOLD` | internal wait | In progress |
| `RESOLVED` | solved, customer may still reply | Resolved |
| `CLOSED` | final, read-only for the customer | Closed |

- Customer creates or replies → `OPEN` (a reply to `RESOLVED` reopens it).
- Staff reply → the composer's "then …" choice (default `WAITING_FOR_CUSTOMER`, or `RESOLVED`,
  `ON_HOLD`, keep). The first reply on an unassigned ticket assigns it to the replying admin.
- Customer "My issue is solved" → `CLOSED`. Admins can set any state, including reopening.
- Every status change writes `statusChangedAt` and a `STATUS_CHANGED` event. Customers only see
  some events (resolved / closed / reopened), see `customerVisibleStatusEvent`.

## Files

- `lib/tickets/` — `constants.ts` (lengths, abuse limits, `SUPPORT_LANDING_PATH`, refresh
  interval), `types.ts` (`TicketActionResult` + error codes), `presentation.ts` (badge styles,
  English admin labels, `staffDisplayName`, Europe/Berlin date formatting), `timeline.ts` (day
  separators), `urls.ts` (absolute customer/admin URLs for emails and Telegram).
- `lib/validation/tickets.ts` — zod schemas for every action plus the inbox query string.
- `app/data-access-layer/tickets/` — `customerTickets.ts` (ownership-scoped, no notes, no staff
  emails) and `adminTickets.ts` (inbox query, view counts, stats, detail, customer context).
- `app/actions/tickets/customerTicketActions.ts` — create, reply, close, `markTicketReadAction`
  (also used by admins).
- `app/actions/tickets/adminTicketActions.ts` — reply, update fields, delete, note CRUD + pin.
- `components/support/` — landing page, `TicketStatusLabel` (status as coloured dot + text; the
  ticket UI deliberately uses no pill badges), `TicketAvatar` (profile picture with initials
  fallback, used on both sides of the chat), `LinkifiedText`, `TicketAutoRefresh`.
- `components/admin/tickets/` — inbox filters, composer, note item, the compact sidebar
  (`SidebarSection`, `TicketPropertiesPanel`) and `TicketHeaderActions` (edit subject, delete).
- Customer copy: `supportTickets.*` in `messages/{en,de}.json`; every `TicketActionError` code needs
  an `errors.*` key. The admin UI is English-only.

## Behaviour worth knowing

- **Messages are plain text.** `LinkifiedText` only turns http(s) URLs into links; nothing is
  rendered as HTML or markdown. Same in emails (`white-space: pre-line`).
- **Staff identity.** Customers see the admin's username with an "Admin" badge;
  `staffDisplayName` never falls back to the email address.
- **Live updates without websockets.** `useRefreshWhileVisible` calls `router.refresh()` every 30s
  (ticket pages) / 60s (inbox) while the tab is visible. `TicketAutoRefresh` also marks the ticket
  read and scrolls to the newest message whenever the latest message id changes.
- **Reply conflicts.** The admin composer sends `lastSeenMessageId`; if a newer message exists the
  action returns `conflict`, the page refreshes and the draft is kept (drafts live in
  localStorage under `ticket-draft:<ticketId>:<reply|note>`).
- **Abuse limits** (customers only, never shown in the UI, see `constants.ts`): 25 non-closed
  tickets, 20 new tickets per 24h, 60 messages per hour. Max message length is 5,000 characters.
- **Notifications.** Customer email on ticket created (`sendTicketOpenedEmail`), staff reply
  (`sendTicketReplyEmail`, mentions when the reply resolved the ticket) and a status change to
  `RESOLVED` without a reply (`sendTicketResolvedEmail`, `EmailType.SUPPORT_TICKET_RESOLVED`).
  Notes, assignment and priority changes never email. Telegram: new ticket
  (`sendSupportTicketNotification`) and customer reply (`sendTicketReplyNotification`), both
  linking to `/admin/support/<number>`.

## Worker contract

Lake does not auto-close anything; the worker (separate repo) owns the cron cleanup and its
emails. When it changes a ticket it must keep the same invariants as lake:

- set `status` **and** `statusChangedAt`, and write a `TicketEvent` (`STATUS_CHANGED`,
  `actorId = null`, `fromValue`/`toValue` = the enum values);
- an automated message is a `TicketMessage` with `authorRole = SYSTEM`, `authorId = null`, and it
  must also bump `lastMessageAt` and `lastStaffMessageAt`;
- never touch `TicketNote`.

Typical rules: `RESOLVED` for N days (`statusChangedAt`) → `CLOSED`; `WAITING_FOR_CUSTOMER` for N
days → `RESOLVED` (optionally with a reminder first).

## Switching over (not done yet)

1. Render `SupportLanding` from `app/[locale]/support/page.tsx` and set `SUPPORT_LANDING_PATH` to
   `/support`; delete `support/v2`. Keep `support/EmailAndCopyButton.tsx` (the landing uses it).
2. Point the "contact support" links at the new pages: Footer, MainMenu, error pages,
   `ServerReadyPoller`, `RefundRequestButton`, `PaymentsTab`, the suspension links
   (`suspensionActions.supportUrl`, `GameServerCard`, `ServerSuspended` — add `&server=`), and
   the email templates/`EmailLayout`. Add "My tickets" to the profile/menu.
3. Replace the `/admin/tickets` card, update the ticket counts in `app/api/status/route.ts`, then
   remove the legacy route, actions, templates, `SupportTicket` and `TicketStatus`.
