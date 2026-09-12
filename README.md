# CT Meme Arena

CT Meme Arena is a Crypto Twitter-native meme-coin arena with live DEX market data, CT signal ingestion, wallet awareness, competitive paper trading, and an optional real Solana execution rail.

## Live stack

- **DEX Screener** — live Solana pair discovery, price, liquidity, volume and price-change data.
- **X API v2** — recent CT posts for token/ticker searches when `X_BEARER_TOKEN` is configured.
- **Alchemy Solana RPC** — wallet balances and transaction submission when `ALCHEMY_API_KEY` is configured.
- **GMGN Trade API** — server-side Solana route generation when an approved `GMGN_API_KEY` is configured.
- **Phantom-compatible wallet signing** — the browser wallet signs unsigned transactions; private keys never enter the server.
- **Paper engine** — remains available for testing and competitive gameplay.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Enable live market data

No key is required for the basic DEX Screener market adapter. The app polls live market data every 10 seconds and falls back to the bundled demo dataset if a provider is unavailable.

## Enable live CT signals

Set:

```env
X_BEARER_TOKEN=...
```

The app uses X API v2 recent search for token/ticker queries. Keep the token server-side.

## Enable wallet/on-chain data

Preferred:

```env
ALCHEMY_API_KEY=...
```

or provide a compatible Solana RPC URL:

```env
SOLANA_RPC_URL=https://...
```

## Enable real trading

GMGN Trade API access is gated by GMGN approval. After receiving an API key:

```env
GMGN_API_KEY=...
LIVE_TRADING_ENABLED=true
```

The server requests an unsigned route transaction from GMGN. The connected browser wallet signs it. The server then submits the signed transaction through the configured Solana RPC. The server never receives a seed phrase or private key.

**Start with a dedicated low-balance test wallet. Verify the token mint, route, slippage, amount, priority fee and wallet prompt before signing.**

## API

- `GET /api/market` — live market radar with fallback.
- `GET /api/market?q=BONK` — live Solana pair search plus optional CT signals.
- `GET /api/wallet?owner=<address>` — SOL and SPL token balances.
- `POST /api/trade/route` — guarded GMGN route generation.
- `POST /api/trade/submit` — guarded signed-transaction submission.
- `GET /api/trade/status?hash=<signature>` — Solana transaction status.
- `GET /api/health` — provider and live-trading readiness.

## Safety and production hardening

The live rail is deliberately server-keyed and wallet-signed. Before public launch, add authentication, database-backed users/seasons/trades, Redis/pub-sub for high-fanout events, server-side idempotency keys, persistent audit logs, abuse controls, token allow/deny lists, RPC failover, provider circuit breakers, monitoring, alerting, and an independent security review.

## License / data providers

Review the terms of each external data and trading provider before commercial deployment. This project does not claim ownership of third-party market or social data.
