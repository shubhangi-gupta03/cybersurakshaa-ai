-- ═══════════════════════════════════════════════
-- CyberSuraksha AI - Supabase Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. Scraped statistics table
CREATE TABLE IF NOT EXISTS scraped_stats (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  complaints_h1_2026 BIGINT,
  losses_crore DECIMAL(10,2),
  frozen_crore DECIMAL(10,2),
  cfcfrms_saved_crore DECIMAL(10,2),
  state_data JSONB,
  crime_types JSONB,
  raw_text TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 2. Live alerts table (real-time feed)
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'INFO',
  state VARCHAR(100),
  crime_type VARCHAR(100),
  amount_crore DECIMAL(10,2),
  source VARCHAR(100),
  source_url TEXT,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 3. ML predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  predicted_state VARCHAR(100),
  predicted_city VARCHAR(200),
  predicted_atm TEXT,
  risk_score DECIMAL(4,2),
  crime_type VARCHAR(100),
  time_window VARCHAR(100),
  confidence DECIMAL(4,2),
  model_version VARCHAR(50) DEFAULT 'xgboost-v1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Evidence chain table (blockchain hashes)
CREATE TABLE IF NOT EXISTS evidence_chain (
  id BIGSERIAL PRIMARY KEY,
  case_id VARCHAR(100),
  file_name VARCHAR(500),
  file_size BIGINT,
  file_type VARCHAR(100),
  sha256_hash VARCHAR(66) NOT NULL,
  polygon_tx_hash VARCHAR(66),
  block_number BIGINT,
  logged_by VARCHAR(100),
  role VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Telegram messages table
CREATE TABLE IF NOT EXISTS telegram_messages (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT,
  channel VARCHAR(100),
  text TEXT,
  date TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. State risk scores (updated by ML)
CREATE TABLE IF NOT EXISTS state_risk (
  id BIGSERIAL PRIMARY KEY,
  state VARCHAR(100) UNIQUE NOT NULL,
  complaints INTEGER DEFAULT 0,
  losses_crore DECIMAL(10,2) DEFAULT 0,
  risk_score DECIMAL(4,2) DEFAULT 0,
  risk_level VARCHAR(20) DEFAULT 'LOW',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert base state data (MHA H1 2026 official)
INSERT INTO state_risk (state, complaints, losses_crore, risk_score, risk_level) VALUES
  ('Uttar Pradesh', 185000, 734, 9.5, 'CRITICAL'),
  ('Maharashtra', 158000, 1637, 9.0, 'CRITICAL'),
  ('Karnataka', 121000, 1097, 8.5, 'CRITICAL'),
  ('Gujarat', 97937, 643, 8.0, 'CRITICAL'),
  ('Bihar', 93137, 520, 7.8, 'CRITICAL'),
  ('Rajasthan', 75883, 412, 7.0, 'HIGH'),
  ('West Bengal', 72439, 389, 6.8, 'HIGH'),
  ('Delhi', 64496, 541, 6.5, 'HIGH'),
  ('Tamil Nadu', 63116, 298, 6.2, 'HIGH'),
  ('Haryana', 58721, 334, 6.0, 'HIGH'),
  ('Telangana', 45000, 221, 5.5, 'MEDIUM'),
  ('Andhra Pradesh', 38000, 187, 5.0, 'MEDIUM'),
  ('Madhya Pradesh', 35000, 165, 4.8, 'MEDIUM'),
  ('Jharkhand', 22000, 98, 4.0, 'MEDIUM'),
  ('Odisha', 20000, 87, 3.8, 'MEDIUM'),
  ('Punjab', 18000, 76, 3.5, 'LOW'),
  ('Kerala', 17000, 71, 3.2, 'LOW'),
  ('Chhattisgarh', 15000, 62, 3.0, 'LOW'),
  ('Assam', 13000, 54, 2.8, 'LOW'),
  ('Uttarakhand', 11000, 45, 2.5, 'LOW')
ON CONFLICT (state) DO UPDATE SET
  complaints = EXCLUDED.complaints,
  losses_crore = EXCLUDED.losses_crore,
  risk_score = EXCLUDED.risk_score,
  risk_level = EXCLUDED.risk_level,
  updated_at = NOW();

-- Enable Realtime on alerts table
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE predictions REPLICA IDENTITY FULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_state_risk_state ON state_risk(state);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence_chain(case_id);
CREATE INDEX IF NOT EXISTS idx_telegram_processed ON telegram_messages(processed);

-- Row Level Security (open for our app)
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all" ON state_risk FOR ALL USING (true);
CREATE POLICY "Allow all" ON evidence_chain FOR ALL USING (true);
CREATE POLICY "Allow all" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow all" ON scraped_stats FOR ALL USING (true);
CREATE POLICY "Allow all" ON telegram_messages FOR ALL USING (true);
