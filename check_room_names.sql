-- Verificar room_names com espaços
SELECT 
  id,
  inspection_id,
  room_name,
  LENGTH(room_name) as len,
  LENGTH(TRIM(room_name)) as trimmed_len,
  room_name = TRIM(room_name) as is_clean,
  '"' || room_name || '"' as quoted_name
FROM inspection_photos
WHERE room_name != TRIM(room_name)
ORDER BY created_at DESC
LIMIT 20;

-- Verificar se a constraint existe
SELECT conname, contype, convalidated, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'check_room_name_no_trailing_spaces';

-- Verificar room names únicos nas últimas fotos
SELECT DISTINCT
  room_name,
  '"' || room_name || '"' as quoted,
  LENGTH(room_name) as len,
  inspection_id
FROM inspection_photos
ORDER BY inspection_id DESC
LIMIT 30;
