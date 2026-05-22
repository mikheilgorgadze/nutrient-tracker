-- FTS5 virtual table for full-text food search.
-- content= keeps FTS in sync with the foods table.

CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
  name,
  brand,
  content='foods',
  content_rowid='rowid'
);

-- Populate FTS from existing rows (idempotent via full rebuild)
INSERT INTO foods_fts(foods_fts) VALUES('rebuild');

-- Triggers to keep FTS in sync with foods table mutations
CREATE TRIGGER IF NOT EXISTS foods_ai AFTER INSERT ON foods BEGIN
  INSERT INTO foods_fts(rowid, name, brand)
  VALUES (new.rowid, new.name, new.brand);
END;

CREATE TRIGGER IF NOT EXISTS foods_ad AFTER DELETE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand)
  VALUES ('delete', old.rowid, old.name, old.brand);
END;

CREATE TRIGGER IF NOT EXISTS foods_au AFTER UPDATE ON foods BEGIN
  INSERT INTO foods_fts(foods_fts, rowid, name, brand)
  VALUES ('delete', old.rowid, old.name, old.brand);
  INSERT INTO foods_fts(rowid, name, brand)
  VALUES (new.rowid, new.name, new.brand);
END;
