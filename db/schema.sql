CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT UNIQUE NOT NULL,
  display_name TEXT,
  xp BIGINT NOT NULL DEFAULT 0,
  season_xp BIGINT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT UNIQUE NOT NULL,
  wallet TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_challenges_lookup ON auth_challenges(wallet, expires_at);

CREATE TABLE IF NOT EXISTS wallet_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS wallet_sessions_lookup ON wallet_sessions(token_hash, expires_at);

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_no INT UNIQUE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  wallet TEXT NOT NULL REFERENCES users(wallet),
  token_id TEXT NOT NULL,
  token_address TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  side TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  amount_raw NUMERIC(78,0) NOT NULL,
  quote_raw NUMERIC(78,0),
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'ROUTED',
  tx_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet, client_id)
);
CREATE INDEX IF NOT EXISTS trades_wallet_time ON trades(wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS trades_tx_hash ON trades(tx_hash);

CREATE TABLE IF NOT EXISTS trade_events (
  id BIGSERIAL PRIMARY KEY,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_progress (
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(wallet, season_id, quest_key)
);

CREATE TABLE IF NOT EXISTS arena_events (
  id BIGSERIAL PRIMARY KEY,
  wallet TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS arena_events_time ON arena_events(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  wallet TEXT,
  action TEXT NOT NULL,
  request_id TEXT,
  ip_hash TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_time ON audit_logs(created_at DESC);

INSERT INTO seasons (season_no, starts_at, ends_at, active)
SELECT 1, NOW(), NOW()+INTERVAL '30 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE season_no=1);
