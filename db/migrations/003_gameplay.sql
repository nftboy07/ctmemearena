-- CT Meme Arena social-game layer.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_chain TEXT NOT NULL DEFAULT 'solana';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS player_stats (
  wallet TEXT PRIMARY KEY REFERENCES users(wallet) ON DELETE CASCADE,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  volume_usd NUMERIC NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  best_trade NUMERIC NOT NULL DEFAULT 0,
  fomo_score NUMERIC NOT NULL DEFAULT 0,
  diamond_score NUMERIC NOT NULL DEFAULT 0,
  sniper_score NUMERIC NOT NULL DEFAULT 0,
  trades_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_holdings (
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  token_address TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  avg_entry NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  pnl_usd NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(wallet, token_id)
);
CREATE INDEX IF NOT EXISTS player_holdings_wallet_value ON player_holdings(wallet, usd_value DESC);

CREATE TABLE IF NOT EXISTS player_follows (
  follower_wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  followed_wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(follower_wallet, followed_wallet),
  CHECK (follower_wallet <> followed_wallet)
);
CREATE INDEX IF NOT EXISTS player_follows_followed ON player_follows(followed_wallet);

CREATE TABLE IF NOT EXISTS player_achievements (
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY(wallet, achievement_key)
);

CREATE INDEX IF NOT EXISTS trades_wallet_created ON trades(wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS users_chain_xp ON users(home_chain, season_xp DESC);
