# Dev agent login and captcha-free auth

Under `next dev` (`bun dev`) the Turnstile captcha is turned off, and the route
`GET /api/dev/login` logs an agent in as a test user, creating the user the first time.
Both depend on `isDevServer` (`lib/devMode.ts`, which is `NODE_ENV === 'development'`). They
deliberately ignore `DEPLOYMENT_ENV`: a production build always has `NODE_ENV=production`, so a
wrong env var can't weaken auth on a deployed server.

## How an agent logs in

Open one of these URLs in the browser. Each one sets the session cookie and redirects:

| URL                          | User                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `/api/dev/login`             | `agent@example.com`, role `user`                               |
| `/api/dev/login?role=admin`  | `agent-admin@example.com`, role `admin`                        |
| `/api/dev/login?user=buyer2` | `buyer2@example.com` (any `[a-z0-9-]`)                         |
| `...&redirect=/admin/logs`   | redirect target (same-origin path only; default `/gameserver`) |

Use a separate `user=` slug when a test needs a fresh or isolated account.

- Every persona has the password `agent-dev-password`, and its username is the slug with `-`
  replaced by `_`. That lets the normal `/login` form be tested too.
- Every call resets the persona so it can log in: email verified, unbanned, no 2FA, the
  requested role, the known password. Data the user owns (servers, orders, tickets) is left alone.
- With curl, keep the cookie jar: `curl -c jar -b jar http://localhost:3000/api/dev/login`.

## What happens in `app/api/dev/login/route.ts`

1. It returns 404 outside `next dev`, and also when the `Host` header is not loopback
   (`localhost`, `127.0.0.1`, `[::1]`). That way a dev server reached via its LAN IP or a public
   dev domain (`devlake.scyed.com`) doesn't hand out admin sessions. The check uses the header,
   not `req.url`, because `next dev` builds `req.url` from its own bind address.
2. It upserts the `User` row and a `credential` `Account` row (with a Better Auth `hashPassword`
   hash) directly through Prisma. This means the signup hooks in `auth.ts` do not fire: no
   Telegram message, no PostHog signup events, and no email.
3. It calls `auth.api.signInEmail` and copies the `Set-Cookie` headers onto the redirect.
4. The `session.create.after` hook in `auth.ts` then provisions a **real Pterodactyl user** on
   the configured (dev) panel the first time, the same as for any verified user. If the panel
   can't be reached, this is only logged and the session still works, but the gameserver pages
   need `ptKey`.

## Using the app from localhost

`BETTER_AUTH_URL` is the public https host, so Better Auth sets `__Secure-` cookies with the
`Secure` flag. Browsers still accept those on `http://localhost` / `127.0.0.1` because those
count as secure contexts. On a plain-http LAN IP like `http://10.1.17.5:3000` they are silently
dropped, so browser login doesn't work there.

Better Auth rejects client-side auth POSTs (login form, sign-out, profile, 2FA) whose `Origin` is
not trusted (`403 Invalid origin`). Under `next dev`, `auth.ts` adds a `trustedOrigins` function
that also trusts the request's own origin when it is loopback. `BETTER_AUTH_URL` stays trusted.
OAuth logins still only work on the registered host, because the provider redirect URIs point
there.

## Captcha switch

- `auth.ts`: under `next dev` the `captcha()` plugin is not registered, so no endpoint asks for
  `X-captcha-response`.
- `components/auth/login-form.tsx` and `forgot-password-form.tsx` hide the `<Turnstile>` widget
  and don't block the submit button.
- `lib/startup.ts`: the `*_TURNSTILE_*` env vars are only required outside `next dev`.

Registration itself is OAuth-only (`disableSignUp: true`, and `register-form.tsx` shows only
Discord/Google), so agents create users through `/api/dev/login`, not through a form.
