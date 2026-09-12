export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER UNIQUE,
  username TEXT,
  display_name TEXT NOT NULL,
  avatar TEXT,
  cover TEXT,
  bio TEXT,
  verified INTEGER DEFAULT 0,
  premium INTEGER DEFAULT 0,
  premium_expires_at TEXT,
  banned INTEGER DEFAULT 0,
  banned_at TEXT,
  star_balance INTEGER DEFAULT 0,
  earnings INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  login_method TEXT DEFAULT 'telegram',
  created_at TEXT NOT NULL,
  last_active_at TEXT,
  deleted INTEGER DEFAULT 0,
  deleted_at TEXT,
  verification_request_pending INTEGER DEFAULT 0,
  username_set INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  telegram_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reserved_usernames (username TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS deleted_user_ids (user_id TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT,
  data TEXT NOT NULL,
  media_expired INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT,
  title TEXT,
  body TEXT,
  icon TEXT,
  meta TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  followers INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS banned_users (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_objects (
  object_key TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_charges (
  charge_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`;
