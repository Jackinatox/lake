# Server Creation Workflow

This document outlines the streamlined process for creating a game server, from user configuration to provisioning and status updates.

## 1. User Configuration & Order Initiation

- **Frontend (`app/[locale]/booking2/[gameId]/page.tsx`):** User selects server hardware and game settings.
- **Backend Action (`app/[locale]/booking2/[gameId]/actions.ts`):** `createServerOrder` validates input, creates a `ServerOrder` in Prisma (initial `status: PENDING`), and returns the order ID.
- **Redirection:** Frontend redirects to payment, passing the order ID.

## 2. Payment Session Creation

- **Frontend Component (`components/payments/PaymentElements.tsx`):** Calls `createPaymentSession` with the `ServerOrder` ID.
- **Backend Action (`app/[locale]/booking2/[gameId]/bookServerPayment.ts`):** `createPaymentSession` fetches order details, creates a Stripe checkout session (including `serverOrderId` in metadata), and returns the `client_secret`.
- **Stripe Checkout:** Frontend renders Stripe's embedded UI for user payment.

## 3. Stripe Webhook Processing (`app/webhook/route.ts`)

Stripe sends a webhook upon successful payment, triggering server provisioning.

- **Event Handling:** `POST` handler verifies webhook signature and processes `checkout.session.completed` events.
- **Order Update:** Fetches `ServerOrder` using `session_id`, updates `status` to `PAID`.
- **Provisioning Trigger:** Calls `provisionServer` (from `lib/Pterodactyl/createServers/provisionServer.ts`) with the `ServerOrder`.
- **Final Status:** After successful provisioning, updates `ServerOrder` `status` to `CREATED`.

## 4. Pterodactyl Server Provisioning (`lib/Pterodactyl/createServers/provisionServer.ts`)

This function interacts with the Pterodactyl API to create the server.

- **API Interaction:** Initializes Pterodactyl client, retrieves user's Pterodactyl ID, and maps `ServerOrder` configuration to Pterodactyl's `NewServerOptions`.
- **Server Creation:** Sends request to Pterodactyl to create the server.
- **ID Update:** Saves the new server's `identifier` (from Pterodactyl) to the `serverId` field of the `ServerOrder` in the database.

## 5. Frontend Polling & Display (`app/[locale]/checkout/return/ServerReadyPoller.tsx` & `app/[locale]/checkout/return/checkIfServerReady.ts`)

The frontend continuously polls for server status updates.

- **Polling:** `ServerReadyPoller` repeatedly calls `checkIfServerReady`.
- **Status Retrieval:** `checkIfServerReady` (server action) fetches `ServerOrder` status and `serverId` from the database.
    - If `PAID`, it also checks Pterodactyl for installation status.
- **Dynamic UI:** `ServerReadyPoller` updates the UI based on `orderStatus`:
    - `PENDING`: "Waiting for Payment."
    - `PAID`: "Creating Your Server" (loading animation).
    - `CREATED`: "Server Ready" (connect button).
    - `FAILED`/`null`: "Server Error" or "Server not found."
- **Redirection:** "Connect to Server" button redirects to `/gameserver/[server_id]`.

This workflow ensures a robust and user-friendly server creation experience.
