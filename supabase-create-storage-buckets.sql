-- Create storage buckets for VistorIA Pro
-- Run this in Supabase SQL Editor

-- Create properties bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Create inspections bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspections', 'inspections', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for properties bucket
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'properties');

CREATE POLICY "Authenticated users can update their property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'properties');

CREATE POLICY "Authenticated users can delete their property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'properties');

CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'properties');

-- Set up storage policies for inspections bucket
CREATE POLICY "Authenticated users can upload inspection images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspections');

CREATE POLICY "Authenticated users can update their inspection images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inspections');

CREATE POLICY "Authenticated users can delete their inspection images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inspections');

CREATE POLICY "Anyone can view inspection images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'inspections');
