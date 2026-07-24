CREATE TABLE IF NOT EXISTS form_submission_idempotency (
  form_slug TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  response_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('processing', 'completed', 'failed')),
  lease_until INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (form_slug, key_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS form_submission_response_id_idx
  ON form_submission_idempotency (response_id);

CREATE TABLE IF NOT EXISTS form_rate_limits (
  scope TEXT NOT NULL,
  bucket_hash TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (scope, bucket_hash)
);

CREATE INDEX IF NOT EXISTS form_rate_limits_expiry_idx
  ON form_rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx
  ON admin_sessions (expires_at);
