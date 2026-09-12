# Privy production authentication

CT Meme Arena now uses Privy as the primary identity layer for Google, X/Twitter, email and Solana wallet login.

Privy supports multiple authentication methods on one user account, so a player can authenticate with Google, X, email or a wallet without creating separate Arena identities. The same Privy user can also have linked wallets/accounts. See the official Privy authentication documentation for the current supported login methods.

## 1. Create Privy apps

Create separate development and production Privy apps. For production, configure the real CT Meme Arena domain in Privy and enable HttpOnly cookies if you want Privy to manage the access-token cookie on the application domain.

## 2. Enable login methods

In the Privy Dashboard, enable:

- Google
- X / Twitter
- Email
- Wallet

For production OAuth, configure your own Google and X OAuth credentials rather than relying on Privy's development credentials. Privy's OAuth callback is:

`https://auth.privy.io/api/v1/oauth/callback`

Use your production domain and the exact OAuth configuration shown by the Privy Dashboard.

## 3. Environment

Set:

- `NEXT_PUBLIC_PRIVY_APP_ID` — public Privy application ID
- `PRIVY_APP_ID` — server-side copy of the app ID
- `PRIVY_APP_SECRET` — server-only Privy app secret
- `DATABASE_URL` — PostgreSQL
- `REDIS_URL` — Redis, for realtime arena events

Never expose `PRIVY_APP_SECRET` to the browser.

## 4. Solana wallets

The React provider is configured to automatically create an embedded Solana wallet for users without an existing wallet. Users can therefore enter the Arena with Google, X or email and still receive a Solana wallet through Privy.

External wallets can still be supported through Privy's Solana connectors when enabled in the Privy configuration.

## 5. Backend authentication

The backend verifies Privy access tokens before trusting the user. The verified Privy user ID is stored with the Arena account, along with the currently linked Solana wallet and available social identifiers.

The `/api/auth/sync` endpoint bridges a verified Privy session into the existing Arena HttpOnly session so legacy trade/history routes remain authenticated without exposing a private key or accepting an arbitrary wallet address from the browser.

## 6. Production security

- Use HTTPS everywhere.
- Keep the Privy app secret server-side.
- Use a separate Privy production app from development.
- Enable MFA in Privy for users who will perform higher-value wallet actions.
- Keep live trading disabled until the Privy identity-to-wallet flow, route validation, signing, submission and status tracking have been tested end-to-end with a dedicated low-balance wallet.
- Configure database backups and audit-log retention.
- Monitor authentication failures, trade failures, RPC latency and provider errors.
