-- Garantir que o bucket inspection-photos é público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'inspection-photos';

-- Verificar se as políticas RLS permitem leitura pública
DO $$ 
BEGIN
  -- Dropar política existente se houver
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
  
  -- Criar política de leitura pública para inspection-photos
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-photos');
  
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- Mostrar configuração atual
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('inspection-photos', 'signatures', 'reports');
