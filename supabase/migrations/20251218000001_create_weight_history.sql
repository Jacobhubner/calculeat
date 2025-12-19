-- Create weight_history table for tracking weight changes over time
CREATE TABLE IF NOT EXISTS public.weight_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own weight history
CREATE POLICY "Users can manage own weight history"
  ON public.weight_history
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = weight_history.profile_id
      AND profiles.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_weight_history_profile_id ON public.weight_history(profile_id);
CREATE INDEX idx_weight_history_recorded_at ON public.weight_history(recorded_at DESC);
