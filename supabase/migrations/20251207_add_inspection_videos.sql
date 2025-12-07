-- Add inspection_videos table for video analysis storage
-- Created: 2025-12-07

CREATE TABLE IF NOT EXISTS public.inspection_videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inspection_id uuid NOT NULL,
  user_id uuid NOT NULL,
  
  -- Video Info
  room_name text NOT NULL,
  room_category text CHECK (room_category = ANY (ARRAY['living_room'::text, 'kitchen'::text, 'bathroom'::text, 'bedroom'::text, 'hallway'::text, 'balcony'::text, 'garage'::text, 'other'::text])),
  
  -- Storage
  storage_path text NOT NULL, -- Path in Supabase Storage
  file_size integer,
  duration_seconds integer,
  
  -- AI Analysis Result
  analysis jsonb DEFAULT '{}'::jsonb, -- Full Claude analysis response
  has_problems boolean DEFAULT false,
  confidence numeric(3, 2), -- 0.00 to 1.00
  overall_condition text CHECK (overall_condition = ANY (ARRAY['excelente'::text, 'bom'::text, 'aceitável'::text, 'precisa_reparo'::text, 'crítico'::text])),
  
  -- Problem Summary
  problem_count integer DEFAULT 0,
  severity_summary jsonb DEFAULT '{}'::jsonb, -- { "baixa": 0, "média": 0, "alta": 0 }
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  
  CONSTRAINT inspection_videos_pkey PRIMARY KEY (id),
  CONSTRAINT inspection_videos_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE,
  CONSTRAINT inspection_videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspection_videos_inspection_id ON public.inspection_videos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_videos_user_id ON public.inspection_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_videos_room_name ON public.inspection_videos(room_name);
CREATE INDEX IF NOT EXISTS idx_inspection_videos_created_at ON public.inspection_videos(created_at);

-- Enable Row Level Security
ALTER TABLE public.inspection_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own inspection videos
CREATE POLICY "Users can only read their own inspection videos"
  ON public.inspection_videos
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can only insert their own inspection videos"
  ON public.inspection_videos
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can only update their own inspection videos"
  ON public.inspection_videos
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can only delete their own inspection videos"
  ON public.inspection_videos
  FOR DELETE
  USING (auth.uid()::uuid = user_id);
