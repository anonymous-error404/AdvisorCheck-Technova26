-- Add Phase 2 columns for trade publishing system
-- Adds support for live market data, immutability, and publish timestamps

ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_immutable BOOLEAN DEFAULT FALSE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_reason VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price DECIMAL(15, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS analysis TEXT;

-- Add constraint to prevent editing published trades
ALTER TABLE trades ADD CONSTRAINT prevent_published_edit
CHECK (
  (status = 'draft' AND is_immutable = FALSE) OR
  (status IN ('open', 'published', 'closed') AND is_immutable = TRUE)
);

-- Create index for faster queries on published trades
CREATE INDEX IF NOT EXISTS idx_trades_published_at ON trades(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status_immutable ON trades(status, is_immutable);

-- Update RLS policy to prevent modifications of published trades
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prevent_published_trade_updates" ON trades
  FOR UPDATE
  USING (status = 'draft' AND is_immutable = FALSE)
  WITH CHECK (status = 'draft' AND is_immutable = FALSE);

COMMIT;
