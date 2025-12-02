-- Migration: Clean Room Names
-- Fix room_name mismatches by removing trailing/leading spaces
-- Add constraint to prevent future issues

-- 1. Limpar espaços dos nomes de cômodos existentes
UPDATE inspection_photos
SET room_name = TRIM(room_name)
WHERE room_name != TRIM(room_name);

-- 2. Log quantas linhas foram afetadas (para debug)
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned % room names with trailing/leading spaces', affected_count;
END $$;

-- 3. Adicionar check constraint para prevenir espaços no futuro
-- Primeiro, verificar se a constraint já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_room_name_no_trailing_spaces'
  ) THEN
    ALTER TABLE inspection_photos
    ADD CONSTRAINT check_room_name_no_trailing_spaces
    CHECK (room_name = TRIM(room_name));

    RAISE NOTICE 'Added constraint check_room_name_no_trailing_spaces';
  ELSE
    RAISE NOTICE 'Constraint check_room_name_no_trailing_spaces already exists';
  END IF;
END $$;

-- 4. Criar índice para melhorar performance de matching por room_name
-- (caso ainda não exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_inspection_photos_room_name_lower'
  ) THEN
    CREATE INDEX idx_inspection_photos_room_name_lower
    ON inspection_photos (LOWER(TRIM(room_name)));

    RAISE NOTICE 'Created index idx_inspection_photos_room_name_lower';
  ELSE
    RAISE NOTICE 'Index idx_inspection_photos_room_name_lower already exists';
  END IF;
END $$;

-- 5. Criar função helper para normalizar room names (pode ser útil no futuro)
CREATE OR REPLACE FUNCTION normalize_room_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(name));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_room_name IS 'Normaliza nome de cômodo removendo espaços e convertendo para lowercase. Útil para comparações case-insensitive.';
