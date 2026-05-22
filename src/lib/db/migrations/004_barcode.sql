-- Add barcode column to foods for barcode-scanner lookups and bundled OFF data.
ALTER TABLE foods ADD COLUMN barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
