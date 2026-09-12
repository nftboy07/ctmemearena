ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_subject TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_privy_user_id_key ON users(privy_user_id) WHERE privy_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_google_subject_idx ON users(google_subject);
CREATE INDEX IF NOT EXISTS users_twitter_subject_idx ON users(twitter_subject);
