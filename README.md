# CT Meme Arena

CT Meme Arena is a Crypto Twitter-native on-chain social game. Players use their X/Google/Email identity, connect or receive a Solana wallet through Privy, enter blockchain-themed districts, discover profitable traders, inspect their holdings and trades, follow players, collect achievements, and compete on seasonal leaderboards.

## The game

- **Blockchain districts** — Solana City, Base Block, Ethereum, BNB Boulevard and the all-chain Metaverse.
- **Fame Board** — Profit, FOMO, Diamond Hands, Snipers and Best Trade leaderboards.
- **Trader profiles** — X-style identity, avatar, verified wallet, PnL, unrealized PnL, win/loss record, best trade, holdings, trade history and achievements.
- **Social graph** — follow/watch traders and build a personal list of players to beat.
- **Season progression** — XP, levels, quests and achievement storage are backed by PostgreSQL.
- **Live market** — DEX Screener prices refresh every 10 seconds and feed the Trading Pit.
- **Realtime foundation** — Redis pub/sub and SSE are available for arena events.
- **Privy** — Google, X/Twitter, email and wallet login with embedded Solana wallets.

## Data and trading stack

- **DEX Screener** — live Solana pair discovery, price, liquidity, volume and price-change data.
- **X API v2** — recent CT posts for token/ticker searches when `X_BEARER_TOKEN` is configured.
- **Alchemy Solana RPC** — wallet balances and transaction submission when `ALCHEMY_API_KEY` is configured.
- **GMGN Trade API** — guarded Solana route generation when an approved `GMGN_API_KEY` is configured.
- **PostgreSQL** — users, seasons, trades, player stats, holdings, follows, achievements, quests and audit records.
- **Redis** — realtime arena event fan-out.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Privy production setup

Configure a production Privy app with Google, X/Twitter, email and wallet login. Set `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_ID` and `PRIVY_APP_SECRET`, configure the production domain/cookies in Privy, and apply the SQL in `db/schema.sql` plus migrations in `db/migrations/`.

## Enable live data

```env
X_BEARER_TOKEN=...
ALCHEMY_API_KEY=...
SOLANA_RPC_URL=https://...
```

The app has safe demo fallbacks when optional providers are unavailable.

## Enable real trading

GMGN access is gated by GMGN approval. After receiving an API key:

```env
GMGN_API_KEY=...
LIVE_TRADING_ENABLED=true
```

The server authenticates the Privy Solana wallet, checks the requested `fromAddress`, applies rate limiting and idempotency, requests an unsigned route from GMGN, and records the trade. The browser signs the transaction; the server never receives a seed phrase or private key. Signed submission also verifies that the transaction fee payer matches the authenticated wallet.

**Start with a dedicated low-balance test wallet. Verify the token mint, route, slippage, amount, priority fee and wallet prompt before signing.**

## API

- `GET /api/players` — seasonal social leaderboard by category and chain.
- `GET /api/player?wallet=<address>` — player profile, trades, holdings, badges and follow state.
- `POST /api/player` / `DELETE /api/player` — follow/unfollow a player.
- `GET /api/market` — live market radar with fallback.
- `GET /api/wallet?owner=<address>` — SOL and SPL token balances.
- `POST /api/trade/route` — authenticated, rate-limited GMGN route generation.
- `POST /api/trade/submit` — authenticated signed-transaction submission.
- `GET /api/trade/status?hash=<signature>` — Solana transaction status.
- `GET /api/leaderboard` — persistent XP leaderboard.
- `GET /api/quests` — authenticated seasonal quests.
- `GET /api/realtime` — Redis-backed arena event stream.
- `GET /api/health` — provider and live-trading readiness.

## Production checklist

Keep `LIVE_TRADING_ENABLED=false` until Privy, PostgreSQL, Redis, Solana RPC and GMGN are configured and a low-balance end-to-end test has passed. Before handling meaningful funds, add RPC/provider failover, distributed rate limiting, background wallet-data ingestion, transaction confirmation workers, monitoring/alerting and an independent security review.

## License / data providers

Review the terms of each external data and trading provider before commercial deployment. This project does not claim ownership of third-party market or social data.
