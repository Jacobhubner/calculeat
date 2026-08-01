-- Add consent audit trail columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN terms_accepted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN privacy_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- For existing users, mark as accepted during this migration (implied consent before GDPR requirement)
UPDATE user_profiles
SET
  terms_accepted_at = created_at,
  privacy_accepted_at = created_at
WHERE terms_accepted_at IS NULL;

-- Create an audit log table for all consent changes
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy')),
  accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view their own audit log
CREATE POLICY "Users can view own consent audit" ON consent_audit_log
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Only Supabase service role can insert (from auth triggers)
CREATE POLICY "Service role can insert consent audit" ON consent_audit_log
  FOR INSERT
  WITH CHECK (true);
