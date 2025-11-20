# 🚀 Executar Migration - Team Management

As tabelas de gerenciamento de equipe ainda não existem no seu banco de dados.
Siga os passos abaixo para criar essas tabelas:

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/fmmykrcqpguqihidolfj/sql/new
   ```

2. **Abra o arquivo de migration:**
   - Abra o arquivo: `supabase/migrations/002_team_management.sql`
   - Copie TODO o conteúdo do arquivo

3. **Cole no SQL Editor:**
   - Cole o SQL completo no editor
   - Clique em **"Run"** (ou pressione Ctrl+Enter)

4. **Aguarde a execução:**
   - A migration pode demorar alguns segundos
   - Você verá uma mensagem de sucesso quando concluir

5. **Verifique se funcionou:**
   ```bash
   node verify-tables.mjs
   ```

## Opção 2: Via linha de comando (se tiver psql instalado)

Se você tem o PostgreSQL client (`psql`) instalado:

1. **Obtenha a senha do banco de dados:**
   - Acesse: https://supabase.com/dashboard/project/fmmykrcqpguqihidolfj/settings/database
   - Role até "Connection string" e copie a senha

2. **Execute a migration:**
   ```bash
   psql "postgresql://postgres:[SUA-SENHA]@db.fmmykrcqpguqihidolfj.supabase.co:5432/postgres" -f supabase/migrations/002_team_management.sql
   ```

## O que a migration cria:

- ✅ Tabela `team_members` - Membros da equipe
- ✅ Tabela `team_invites` - Convites pendentes
- ✅ Tabela `team_activity_log` - Log de atividades
- ✅ Enums personalizados para roles e status
- ✅ Triggers automáticos
- ✅ Row Level Security (RLS) policies
- ✅ Funções auxiliares (stats, validações, logs)
- ✅ Criação automática do owner para usuários existentes

## Após executar:

Execute o script de verificação para confirmar que tudo funcionou:

```bash
node verify-tables.mjs
```

Se você ver "✅ Team management system is ready to use!", está tudo pronto! 🎉
