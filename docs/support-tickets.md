# Support tickets (conversation system)

Customers open tickets and chat with admins in a messaging-style thread. Admins work them from
an inbox with assignment, priorities, internal notes and an audit trail. All "contact support"
links (menu, footer, error pages, emails, suspension links) point here. The **legacy
`SupportTicket` system** (`/support` contact form → `app/api/tickets/route.ts`, `/admin/tickets`)
is still reachable but deprecated: both pages show a banner linking to the new pages, and it is
due for removal (see below).

## Routes

| URL | File | Notes |
| --- | --- | --- |
| `/support/tickets` | `app/[locale]/support/tickets/page.tsx` | The support page: the customer's tickets (`?view=closed` for closed ones; a sign-in hint when logged out), the single "New ticket" button and a deliberately low-key email fallback (`SupportEmailHint`). `?category=&subject=&server=` are forwarded to the form, so the legacy `/support` deep links work once they point here. |
| `/support/tickets/new` | `…/tickets/new/{page,NewTicketForm}.tsx` | Below the category picker: `categories.*.description` + the one-line `categories.*.examples` hint. Prefill: `?category=` (enum value), `?subject=`, `?server=` (Pterodactyl id from the dashboard URL). A SUSPENSION ticket preselects the only suspended server. |
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

- `lib/tickets/` — `constants.ts` (lengths, abuse limits, refresh interval), `types.ts` (`TicketActionResult` + error codes), `presentation.ts` (badge styles,
  English admin labels, `staffDisplayName`, Europe/Berlin date formatting), `timeline.ts` (day
  separators), `urls.ts` (absolute customer/admin URLs for emails and Telegram).
- `lib/validation/tickets.ts` — zod schemas for every action plus the inbox query string.
- `app/data-access-layer/tickets/` — `customerTickets.ts` (ownership-scoped, no notes, no staff
  emails) and `adminTickets.ts` (inbox query, view counts, stats, detail, customer context).
- `app/actions/tickets/customerTicketActions.ts` — create, reply, close, `markTicketReadAction`
  (also used by admins).
- `app/actions/tickets/adminTicketActions.ts` — reply, update fields, delete, note CRUD + pin.
- `components/support/` — `TicketCategoryIcon`, `TicketStatusLabel` (status as coloured dot + text; the
  ticket UI deliberately uses no pill badges), `TicketAvatar` (profile picture with initials
  fallback, used on both sides of the chat), `LinkifiedText`, `TicketAutoRefresh`.
- `components/admin/tickets/` — inbox view nav + filter toolbar (`TicketInboxFilters.tsx`), composer, note item, the compact sidebar
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
  read and scrolls just far enough to show the newest message above the composer whenever the latest
  message id changes (never past the top, so a short conversation opens at scroll position 0). The navbar is not sticky on
  `/support/tickets/<anything>` (`components/Navbar.tsx`) because those pages have their own
  sticky header.
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

## Application logs

Every ticket action writes a `SUPPORT_TICKET` `ApplicationLog` via `logTicketEvent`
(`lib/tickets/log.ts`). The log is always bound to the ticket's **customer** (`userId`) and
**linked server** (`gameServerId`), never to the acting admin, so `/admin/logs?userId=…` or
`?serverId=…` shows a customer's whole ticket history. The actor is in `details.actorId` /
`details.actorRole`, alongside `ticketId` / `ticketNumber`; the request's IP and user agent are
attached. Message and note bodies are never logged, only their length.

| Level | Events |
| --- | --- |
| `TRACE` | note edited, note pinned/unpinned, staff reply rejected by a reply `conflict` |
| `INFO` | ticket created, customer reply (and reopen), customer close, staff reply (status change, self-assign), admin field update (one entry listing every changed field), note added/deleted, customer reply rejected because the ticket is closed |
| `WARN` | ticket deleted, abuse limit hit (`openLimit`/`dailyLimit`/`messageLimit`), a customer naming a server they do not own, a customer reply/close on a ticket that is not theirs |
| `ERROR` | unexpected failures (`logger.logError`, bound to the acting user because the ticket may not be loaded yet); failed ticket emails are logged as `EMAIL`, bound to the customer and server too |

An admin update that changes the linked server is bound to the new server (or the old one when
it was unlinked). `markTicketReadAction` is deliberately not logged (it fires on every view).

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

## Removing the legacy system (not done yet)

Links already point at the new pages; suspension links go straight to
`/support/tickets/new?category=SUSPENSION&subject=…&server=<ptServerId>`.

1. Redirect `/support` to `/support/tickets` (keeping the query string, which the new page
   forwards to the form) and delete `app/[locale]/support/{page,HelpComponent,ContactForm,
   EmailAndCopyButton}.tsx` plus the `getHelp.*` keys that only they use.
2. Remove `/admin/tickets` and its card on `/admin`, update the ticket counts in
   `app/api/status/route.ts`, then the legacy route, actions, templates, `SupportTicket` and
   `TicketStatus`.
