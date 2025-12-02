-- Script de Verificação: Room Names com Espaços
-- Execute este script no Supabase SQL Editor para verificar se ainda há nomes de cômodos com espaços

-- 1. Verificar quantas fotos têm room_name com espaços extras
SELECT
  'Fotos com espaços em branco' as tipo,
  COUNT(*) as total
FROM inspection_photos
WHERE room_name != TRIM(room_name);

-- 2. Listar exemplos de room_names com problemas
SELECT
  id,
  inspection_id,
  CONCAT('''', room_name, '''') as room_name_com_espacos,
  CONCAT('''', TRIM(room_name), '''') as room_name_limpo,
  LENGTH(room_name) as tamanho_original,
  LENGTH(TRIM(room_name)) as tamanho_limpo,
  created_at
FROM inspection_photos
WHERE room_name != TRIM(room_name)
LIMIT 20;

-- 3. Agrupar por room_name para ver todos os valores únicos
SELECT
  CONCAT('''', room_name, '''') as room_name,
  COUNT(*) as total_fotos,
  MIN(created_at) as primeira_foto,
  MAX(created_at) as ultima_foto
FROM inspection_photos
GROUP BY room_name
ORDER BY total_fotos DESC;

-- 4. Verificar se a constraint foi criada
SELECT
  conname as nome_constraint,
  pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conname = 'check_room_name_no_trailing_spaces';

-- 5. Verificar se o índice foi criado
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_inspection_photos_room_name_lower';

-- 6. Verificar se a função normalize_room_name existe
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'normalize_room_name';

-- RESULTADO ESPERADO:
-- - Query 1: Deve retornar 0 (zero) fotos com espaços
-- - Query 4: Deve mostrar a constraint criada
-- - Query 5: Deve mostrar o índice criado
-- - Query 6: Deve mostrar a função criada
