# Architecture

## Client

Next.js App Router + React client component in `components/Arena.tsx`.

## Domain

`lib/types.ts` defines chains, tokens, holdings, trades, and CT posts.

`lib/game.ts` owns paper-trading invariants: buys cannot exceed cash, sells cannot exceed position value, average entry updates on additional buys, and portfolio is marked using current token prices.

## API

- `GET /api/market` returns provider-backed trending tokens.
- `GET /api/health` returns service/provider configuration.

## Provider layer

`lib/providers.ts` defines a provider-agnostic market interface. Demo data is the default. Environment variables only indicate that credentials exist; no undocumented provider endpoints are invented.

## Production layers

1. Auth + wallet signature verification.
2. Postgres for users, seasons, trades, quests, and moderation.
3. Redis/pub-sub for live arena events.
4. Server-authoritative trade engine.
5. Real provider adapters with tested API contracts.
6. On-chain execution as a separate audited service.
