# Live Stack

## Market data

`GET /api/market` polls DEX Screener server-side and returns the best-liquidity Solana pair for the default radar symbols. `GET /api/market?q=...` searches live pairs and, when configured, enriches the result with X recent-search posts.

The app does not ship third-party API keys to the browser.

## Wallets

The browser connects to a compatible Solana wallet (for example Phantom). Only the public address is sent to the server for balance lookup. Signing happens inside the wallet provider.

## Live execution

The execution path is:

1. Browser sends mint addresses, amount and public wallet address to `/api/trade/route`.
2. Server calls the approved GMGN Trade API using `x-route-key`.
3. GMGN returns an unsigned transaction.
4. Browser deserializes and asks the wallet to sign it.
5. Browser sends the signed base64 transaction to `/api/trade/submit`.
6. Server submits it to the configured Solana RPC.
7. Client can poll `/api/trade/status?hash=...` for confirmation.

`LIVE_TRADING_ENABLED=true` is required as a deliberate server-side kill switch.

## Real-time roadmap

The current web client refreshes market data every 10 seconds. For higher scale, move to a dedicated stream worker using Alchemy Solana PubSub / WebSocket subscriptions, Redis pub/sub, and a fan-out layer. Keep the browser disconnected from provider secrets and broad blockchain streams.

## Security checklist

- Never accept private keys or seed phrases.
- Keep GMGN/X/Alchemy credentials server-side.
- Enforce authenticated users before production trading.
- Add idempotency keys to every execution request.
- Persist every quote, signed transaction, provider response and final status.
- Add spend limits, slippage limits and token allow/deny policies.
- Use a dedicated low-balance hot wallet for initial testing.
- Add RPC/provider failover and circuit breakers.
- Add structured audit logs and alerts.
