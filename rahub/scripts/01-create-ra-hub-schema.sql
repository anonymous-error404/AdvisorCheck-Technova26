-- RA Hub Database Schema
-- Immutable trading advisory platform with SEBI verification

-- Create advisors table
CREATE TABLE IF NOT EXISTS advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sebi_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  years_experience INTEGER,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create investors table
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create trades table (immutable after publication)
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  entry_price DECIMAL(12, 2),
  entry_timestamp TIMESTAMP,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  exit_price DECIMAL(12, 2),
  exit_timestamp TIMESTAMP,
  target_price DECIMAL(12, 2),
  stop_loss DECIMAL(12, 2),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('LONG', 'SHORT')),
  description TEXT,
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create advisor_stats table for performance tracking
CREATE TABLE IF NOT EXISTS advisor_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL UNIQUE REFERENCES advisors(id) ON DELETE CASCADE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_return_percent DECIMAL(10, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  avg_winning_trade DECIMAL(10, 2) DEFAULT 0,
  avg_losing_trade DECIMAL(10, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisors_verified ON advisors(verified);
CREATE INDEX IF NOT EXISTS idx_advisors_sebi_number ON advisors(sebi_number);
CREATE INDEX IF NOT EXISTS idx_trades_advisor_id ON trades(advisor_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_published_at ON trades(published_at);

-- RLS disabled for development
-- ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE advisor_stats ENABLE ROW LEVEL SECURITY;

COMMIT;
