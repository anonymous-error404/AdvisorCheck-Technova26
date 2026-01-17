-- Add social features tables for Phase 6

-- Comments on trades
CREATE TABLE IF NOT EXISTS trade_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advisor followers
CREATE TABLE IF NOT EXISTS advisor_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(advisor_id, investor_id)
);

-- Copy trading portfolios
CREATE TABLE IF NOT EXISTS copy_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  allocation_percent DECIMAL(5,2) NOT NULL CHECK (allocation_percent > 0 AND allocation_percent <= 100),
  auto_copy_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(investor_id, advisor_id)
);

-- Indexes for performance
CREATE INDEX idx_trade_comments_trade_id ON trade_comments(trade_id);
CREATE INDEX idx_trade_comments_investor_id ON trade_comments(investor_id);
CREATE INDEX idx_advisor_followers_advisor_id ON advisor_followers(advisor_id);
CREATE INDEX idx_advisor_followers_investor_id ON advisor_followers(investor_id);
CREATE INDEX idx_copy_portfolios_investor_id ON copy_portfolios(investor_id);
CREATE INDEX idx_copy_portfolios_advisor_id ON copy_portfolios(advisor_id);

-- Row Level Security
ALTER TABLE trade_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_comments
CREATE POLICY "Anyone can view trade comments" ON trade_comments FOR SELECT USING (true);
CREATE POLICY "Investors can create own comments" ON trade_comments FOR INSERT 
  WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors can update own comments" ON trade_comments FOR UPDATE 
  USING (auth.uid() = investor_id);
CREATE POLICY "Investors can delete own comments" ON trade_comments FOR DELETE 
  USING (auth.uid() = investor_id);

-- RLS Policies for advisor_followers
CREATE POLICY "Anyone can view followers" ON advisor_followers FOR SELECT USING (true);
CREATE POLICY "Investors can follow advisors" ON advisor_followers FOR INSERT 
  WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors can unfollow" ON advisor_followers FOR DELETE 
  USING (auth.uid() = investor_id);

-- RLS Policies for copy_portfolios
CREATE POLICY "Investors can view own portfolios" ON copy_portfolios FOR SELECT 
  USING (auth.uid() = investor_id);
CREATE POLICY "Investors can create portfolios" ON copy_portfolios FOR INSERT 
  WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors can update own portfolios" ON copy_portfolios FOR UPDATE 
  USING (auth.uid() = investor_id);
CREATE POLICY "Investors can delete own portfolios" ON copy_portfolios FOR DELETE 
  USING (auth.uid() = investor_id);

COMMIT;
