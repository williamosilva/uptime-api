-- Run this script in Supabase SQL Editor to create the required tables

-- Create the health_checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('ok', 'degraded', 'down')),
  
  -- Frontend fields
  frontend_status VARCHAR(20) CHECK (frontend_status IN ('ok', 'degraded', 'down', 'absent', 'unknown')),
  frontend_response_time INTEGER DEFAULT 0,
  frontend_error TEXT,
  
-- Backend fields
  backend_status VARCHAR(20) CHECK (backend_status IN ('ok', 'degraded', 'down', 'absent', 'unknown')),
  backend_response_time INTEGER DEFAULT 0,
  backend_error TEXT,
  
-- Supabase fields
  supabase_status VARCHAR(20) CHECK (supabase_status IN ('ok', 'degraded', 'down', 'absent', 'unknown')),
  supabase_response_time INTEGER DEFAULT 0,
  supabase_error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_overall_status ON health_checks(overall_status);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);

-- Add comments for documentation
COMMENT ON TABLE health_checks IS 'Stores the health check history of services';
COMMENT ON COLUMN health_checks.overall_status IS 'Overall system status: ok, degraded, or down';
COMMENT ON COLUMN health_checks.frontend_status IS 'Frontend status';
COMMENT ON COLUMN health_checks.backend_status IS 'Backend status';
COMMENT ON COLUMN health_checks.supabase_status IS 'Supabase status';

-- Enable Row Level Security (RLS)
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- Create basic access policies (adjust according to your needs)
CREATE POLICY "Enable all access for health_checks" ON health_checks
FOR ALL USING (true);
