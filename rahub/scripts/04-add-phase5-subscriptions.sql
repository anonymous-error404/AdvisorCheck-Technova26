-- Create advisor_tiers table
CREATE TABLE IF NOT EXISTS advisor_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL DEFAULT 'free',
  tier_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_subscribers INTEGER NOT NULL DEFAULT -1,
  current_subscribers INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(advisor_id, tier_name)
);

-- Create investor_subscriptions table
CREATE TABLE IF NOT EXISTS investor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL DEFAULT 'free',
  subscription_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  subscription_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(investor_id, advisor_id)
);

-- Create indexes
CREATE INDEX idx_advisor_tiers_advisor_id ON advisor_tiers(advisor_id);
CREATE INDEX idx_investor_subscriptions_investor_id ON investor_subscriptions(investor_id);
CREATE INDEX idx_investor_subscriptions_advisor_id ON investor_subscriptions(advisor_id);
CREATE INDEX idx_investor_subscriptions_status ON investor_subscriptions(status);

-- Enable RLS
ALTER TABLE advisor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advisor_tiers
CREATE POLICY advisor_tiers_select_public ON advisor_tiers FOR SELECT USING (true);
CREATE POLICY advisor_tiers_insert_advisor ON advisor_tiers FOR INSERT WITH CHECK (
  advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
);
CREATE POLICY advisor_tiers_update_advisor ON advisor_tiers FOR UPDATE WITH CHECK (
  advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
);
CREATE POLICY advisor_tiers_delete_advisor ON advisor_tiers FOR DELETE USING (
  advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
);

-- RLS Policies for investor_subscriptions
CREATE POLICY investor_subs_select_own ON investor_subscriptions FOR SELECT USING (
  investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid()) OR
  advisor_id IN (SELECT id FROM advisors WHERE user_id = auth.uid())
);
CREATE POLICY investor_subs_insert_investor ON investor_subscriptions FOR INSERT WITH CHECK (
  investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
);
CREATE POLICY investor_subs_delete_investor ON investor_subscriptions FOR DELETE USING (
  investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
);

COMMIT;
