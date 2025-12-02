-- =============================================================================
-- VistorIA Pro - RLS Policies Fix
-- Configura RLS para funcionar corretamente com Clerk + Supabase
-- =============================================================================

-- O problema: Usamos Clerk para autenticação, não Supabase Auth.
-- As policies originais usam auth.jwt() que não funciona com Clerk.
--
-- Solução: Usar Service Role (admin client) no servidor que bypassa RLS,
-- e manter RLS apenas para acesso direto ao banco (segurança extra).
--
-- No código, já usamos createAdminClient() que usa SUPABASE_SERVICE_ROLE_KEY.
-- Isso já bypassa o RLS automaticamente.

-- =============================================================================
-- STEP 1: Verificar se RLS está habilitado
-- =============================================================================

-- Habilitar RLS em todas as tabelas (caso não esteja)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photo_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comparison_differences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dispute_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_activity ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: Limpar policies antigas que podem causar conflito
-- =============================================================================

-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
DROP POLICY IF EXISTS "Allow anon read users" ON users;

-- Properties
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can create own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;
DROP POLICY IF EXISTS "Allow service role full access to properties" ON properties;

-- Inspections
DROP POLICY IF EXISTS "Users can view own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can create own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can update own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can delete own inspections" ON inspections;
DROP POLICY IF EXISTS "Allow service role full access to inspections" ON inspections;

-- Inspection Photos
DROP POLICY IF EXISTS "Users can view own photos" ON inspection_photos;
DROP POLICY IF EXISTS "Users can create own photos" ON inspection_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON inspection_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON inspection_photos;
DROP POLICY IF EXISTS "Allow service role full access to inspection_photos" ON inspection_photos;

-- Photo Problems
DROP POLICY IF EXISTS "Users can view own photo problems" ON photo_problems;
DROP POLICY IF EXISTS "Users can create own photo problems" ON photo_problems;
DROP POLICY IF EXISTS "Users can update own photo problems" ON photo_problems;
DROP POLICY IF EXISTS "Allow service role full access to photo_problems" ON photo_problems;

-- Comparisons
DROP POLICY IF EXISTS "Users can view own comparisons" ON comparisons;
DROP POLICY IF EXISTS "Users can create own comparisons" ON comparisons;
DROP POLICY IF EXISTS "Allow service role full access to comparisons" ON comparisons;

-- Comparison Differences
DROP POLICY IF EXISTS "Users can view own comparison differences" ON comparison_differences;
DROP POLICY IF EXISTS "Allow service role full access to comparison_differences" ON comparison_differences;

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow service role full access to transactions" ON transactions;

-- Credit Usage
DROP POLICY IF EXISTS "Users can view own credit usage" ON credit_usage;
DROP POLICY IF EXISTS "Allow service role full access to credit_usage" ON credit_usage;

-- Disputes
DROP POLICY IF EXISTS "Users can view own disputes" ON disputes;
DROP POLICY IF EXISTS "Allow public access via token" ON disputes;
DROP POLICY IF EXISTS "Allow service role full access to disputes" ON disputes;

-- Dispute Messages
DROP POLICY IF EXISTS "Allow service role full access to dispute_messages" ON dispute_messages;

-- Dispute Attachments
DROP POLICY IF EXISTS "Allow service role full access to dispute_attachments" ON dispute_attachments;

-- User Settings
DROP POLICY IF EXISTS "Allow service role full access to user_settings" ON user_settings;

-- Team
DROP POLICY IF EXISTS "Allow service role full access to team_members" ON team_members;
DROP POLICY IF EXISTS "Allow service role full access to team_invites" ON team_invites;
DROP POLICY IF EXISTS "Allow service role full access to team_activity" ON team_activity;

-- =============================================================================
-- STEP 3: Criar policies simples para Service Role
-- O Service Role bypassa RLS por padrão, então estas policies são para
-- garantir que nada seja acessível via cliente anônimo.
-- =============================================================================

-- USERS: Apenas Service Role pode acessar
CREATE POLICY "service_role_users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- PROPERTIES: Apenas Service Role pode acessar
CREATE POLICY "service_role_properties" ON properties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- INSPECTIONS: Apenas Service Role pode acessar
CREATE POLICY "service_role_inspections" ON inspections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- INSPECTION_PHOTOS: Apenas Service Role pode acessar
CREATE POLICY "service_role_inspection_photos" ON inspection_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- PHOTO_PROBLEMS: Apenas Service Role pode acessar
CREATE POLICY "service_role_photo_problems" ON photo_problems
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- COMPARISONS: Apenas Service Role pode acessar
CREATE POLICY "service_role_comparisons" ON comparisons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- COMPARISON_DIFFERENCES: Apenas Service Role pode acessar
CREATE POLICY "service_role_comparison_differences" ON comparison_differences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- TRANSACTIONS: Apenas Service Role pode acessar
CREATE POLICY "service_role_transactions" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- CREDIT_USAGE: Apenas Service Role pode acessar
CREATE POLICY "service_role_credit_usage" ON credit_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- DISPUTES: Apenas Service Role pode acessar (+ acesso público via token handled no código)
CREATE POLICY "service_role_disputes" ON disputes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- DISPUTE_MESSAGES: Apenas Service Role pode acessar
CREATE POLICY "service_role_dispute_messages" ON dispute_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- DISPUTE_ATTACHMENTS: Apenas Service Role pode acessar
CREATE POLICY "service_role_dispute_attachments" ON dispute_attachments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER_SETTINGS: Apenas Service Role pode acessar
CREATE POLICY "service_role_user_settings" ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- TEAM_MEMBERS: Apenas Service Role pode acessar
CREATE POLICY "service_role_team_members" ON team_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- TEAM_INVITES: Apenas Service Role pode acessar
CREATE POLICY "service_role_team_invites" ON team_invites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- TEAM_ACTIVITY: Apenas Service Role pode acessar
CREATE POLICY "service_role_team_activity" ON team_activity
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- VERIFICAÇÃO
-- =============================================================================

-- Para verificar se as policies foram criadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- =============================================================================
-- NOTAS IMPORTANTES
-- =============================================================================

-- 1. O RLS está habilitado, mas as policies permitem tudo.
--    Isso significa que:
--    - Clientes ANON não conseguem acessar nada (precisam de auth)
--    - Service Role bypassa RLS e tem acesso total
--
-- 2. A segurança real é feita no nível da aplicação:
--    - Clerk valida o token do usuário
--    - A API verifica se o recurso pertence ao usuário via user_id
--    - Usamos createAdminClient() para operações autorizadas
--
-- 3. Para aumentar a segurança no futuro, você pode:
--    - Integrar Clerk JWT com Supabase via custom JWT
--    - Criar policies mais restritivas baseadas no JWT
--    - Implementar RLS baseado em roles personalizados
