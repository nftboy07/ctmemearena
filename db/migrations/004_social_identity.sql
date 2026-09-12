ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_subject TEXT;
CREATE INDEX IF NOT EXISTS users_apple_subject ON users(apple_subject);
