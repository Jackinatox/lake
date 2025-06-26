# Project: Lake

This project is a full-stack web application for renting and managing game servers, built with Next.js, TypeScript, and integrated with the Pterodactyl game server management panel.

## Incomplete Feature: Server Booking Flow

The current server booking process is incomplete. The user's selected server configuration is not saved before they are redirected to payment, which means the application does not know what to provision after a successful transaction.

## TODO

Here is the plan to complete the server booking feature:

- [ ] **Update Database Schema:**
    - Add a new `ServerOrder` table to the Prisma schema (`prisma/schema.prisma`).
    - This table will temporarily store the user's hardware and game configuration, along with the payment status and user details.

- [ ] **Modify Booking Logic:**
    - Update the server-side logic that is called when the user submits their configuration.
    - This logic will now:
        - Save the chosen server configuration to the new `ServerOrder` table with a `PENDING` status.
        - Create a Stripe payment intent and associate it with the newly created order record.

- [ ] **Update Frontend Component:**
    - Adjust the frontend page (`app/[locale]/booking2/[gameId]/page.tsx`) to call this updated server logic before redirecting the user to the payment page.

- [ ] **Enhance Payment Webhook:**
    - Modify the Stripe webhook handler (`app/webhook/route.ts`).
    - When a payment is successful, it will:
        - Find the corresponding `ServerOrder` using the payment intent ID.
        - Mark the order as `PAID`.
        - Use the saved configuration from the order to create the game server via the Pterodactyl API.
        - Update the order status to `CREATED`.
