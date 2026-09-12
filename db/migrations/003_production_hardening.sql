CREATE INDEX IF NOT EXISTS trades_wallet_status_time ON trades(wallet, status, created_at DESC);
CREATE INDEX IF NOT EXISTS player_stats_pnl ON player_stats(realized_pnl DESC);
CREATE INDEX IF NOT EXISTS player_stats_fomo ON player_stats(fomo_score DESC);
CREATE INDEX IF NOT EXISTS player_stats_diamond ON player_stats(diamond_score DESC);
CREATE INDEX IF NOT EXISTS player_stats_sniper ON player_stats(sniper_score DESC);
CREATE INDEX IF NOT EXISTS player_stats_best_trade ON player_stats(best_trade DESC);
CREATE INDEX IF NOT EXISTS arena_events_type_time ON arena_events(event_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS arena_events_wallet_activity_signature ON arena_events((payload->>'signature')) WHERE event_type='WALLET_ACTIVITY' AND payload ? 'signature';
CREATE INDEX IF NOT EXISTS player_achievements_time ON player_achievements(unlocked_at DESC);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trades_status_valid') THEN
    ALTER TABLE trades ADD CONSTRAINT trades_status_valid CHECK (status IN ('ROUTED','SUBMITTED','CONFIRMED','FAILED','CANCELLED'));
  END IF;
END $$;
