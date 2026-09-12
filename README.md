# CT Meme Arena

CT Meme Arena is a multiplayer-style meme-coin paper-trading arena designed around Crypto Twitter.

## Included

- Dark neon CT trading-arena UI
- Market Radar with Hot / Gainers / Social sorting
- Demo Solana meme-token dataset
- Paper wallet starting at $10,000
- Buy / sell simulation
- Portfolio mark-to-market
- CT shill timeline
- Live arena activity simulation
- Season leaderboard
- Daily quests
- Health and market API routes
- Provider abstraction for GMGN / Fomo / Alchemy / Dune integrations
- Responsive mobile layout
- GitHub Actions CI

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production direction

The UI ships without secrets or undocumented third-party endpoints. Provider interfaces are ready for real server-side adapters once API contracts and credentials are supplied. Production should add persistent storage, authenticated wallet ownership, server-authoritative trade settlement, realtime infrastructure, moderation, rate limits, and audited on-chain execution.

## Important

This repository is a functional paper-trading prototype. It does not move real user funds.
