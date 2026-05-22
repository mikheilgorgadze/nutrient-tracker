-- Bootstrap migration: only the schema_migrations table.
-- This must be the first migration run on every fresh install.
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);
