# CT Meme Arena — production runbook

## Required services

- PostgreSQL for wallet identities, sessions, trades, quests, seasons, arena events and audit records.
- Redis for realtime fan-out when `/api/realtime` is enabled.
- Solana RPC/Alchemy for balances and signed transaction submission.
- DEX Screener for live market discovery.
- X API for recent Crypto Twitter signals.
- GMGN Trade API for approved live routing.

## First deployment

1. Provision PostgreSQL and run `db/schema.sql`.
2. Set `DATABASE_URL` and `DATABASE_SSL=true`.
3. Set `REDIS_URL` if realtime fan-out is desired.
4. Configure `SOLANA_RPC_URL` or `ALCHEMY_API_KEY`.
5. Configure `X_BEARER_TOKEN` if CT signals are required.
6. Configure an approved `GMGN_API_KEY` server-side.
7. Keep `LIVE_TRADING_ENABLED=false` until a dedicated test wallet has been connected and the complete signing flow has been verified.
8. Run `npm install`, `npm run typecheck`, and `npm run build`.

## Wallet authentication

The browser connects a Solana wallet, requests a short-lived challenge, signs the challenge message, and sends the signature to `/api/auth/verify`. The server verifies the Ed25519 signature, consumes the one-time challenge inside a database transaction, and creates an HttpOnly session cookie. Private keys never enter the application server.

## Multiplayer state

The database is authoritative for users, XP, season XP, quests, trades, trade events, arena events and leaderboard reads. Redis is an event transport, not the source of truth.

## Operational controls

- Keep the live-trading kill switch available at the environment level.
- Use a dedicated low-balance wallet for initial testing.
- Keep GMGN and RPC credentials server-side.
- Keep audit logs and trade records for incident investigation.
- Put the app behind HTTPS in production.
- Add external monitoring for `/api/health`, database connectivity, RPC latency and trade failure rates.
- Configure database backups and a tested restore procedure.
- Use a dedicated realtime service when the deployment platform cannot hold long-lived SSE connections reliably.

## Important limitation

The repository now contains the production-oriented multiplayer/auth/persistence/realtime foundation. Live execution remains intentionally guarded by environment configuration and provider access. Do not treat a successful build as proof that a real-money transaction is safe; independently verify routes, token mints, slippage, wallet prompts, RPC behavior and provider status before enabling live execution.
