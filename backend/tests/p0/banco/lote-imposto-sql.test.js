import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const migrationUrl = new URL(
  '../../../../supabase/migrations/20260821020000_lancamentos_lote_e_imposto_p0.sql',
  import.meta.url,
)
const twoDecimalPlacesMigrationUrl = new URL(
  '../../../../supabase/migrations/20260821030000_limitar_percentual_imposto_duas_casas_p0.sql',
  import.meta.url,
)
const monthlyReferenceMigrationUrl = new URL(
  '../../../../supabase/migrations/20260821040000_normalizar_data_referencia_mensal_p0.sql',
  import.meta.url,
)
const balancesMigrationUrl = new URL(
  '../../../../supabase/migrations/20260824000000_adicionar_saldos_estoque_caixa_p0.sql',
  import.meta.url,
)
const normalAndRtMigrationUrl = new URL(
  '../../../../supabase/migrations/20260824010000_adicionar_lancamentos_normal_e_rt_p0.sql',
  import.meta.url,
)

test('migration adiciona imposto e lote atomico restrito a service role', async () => {
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /^BEGIN;/m)
  assert.match(sql, /^COMMIT;/m)
  assert.match(sql, /percentual_imposto NUMERIC\(5,2\)/)
  assert.match(sql, /percentual_imposto >= 0 AND percentual_imposto <= 100/)
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.criar_lancamentos_lote_p0/)
  assert.match(sql, /RETURNS TABLE[\s\S]+categoria_id BIGINT/)
  assert.match(sql, /CATEGORIAS_INCOMPLETAS/)
  assert.match(sql, /CATEGORIAS_DUPLICADAS/)
  assert.match(sql, /INSERT INTO public\.lancamentos/)
  assert.match(sql, /SECURITY DEFINER/)
  assert.match(sql, /SET search_path = ''/)
  assert.match(sql, /REVOKE ALL[\s\S]+FROM PUBLIC, anon, authenticated/)
  assert.match(sql, /GRANT EXECUTE[\s\S]+TO service_role/)
})

test('migration complementar limita imposto a duas casas em bancos existentes', async () => {
  const sql = await readFile(twoDecimalPlacesMigrationUrl, 'utf8')

  assert.match(sql, /^BEGIN;/m)
  assert.match(sql, /ALTER COLUMN percentual_imposto TYPE NUMERIC\(5,2\)/)
  assert.match(sql, /USING ROUND\(percentual_imposto, 2\)/)
  assert.match(sql, /^COMMIT;/m)
})

test('migration complementar normaliza a referencia para o primeiro dia do mes', async () => {
  const sql = await readFile(monthlyReferenceMigrationUrl, 'utf8')

  assert.match(sql, /date_trunc\('month', data_referencia\)::DATE/)
  assert.match(sql, /CHECK \(EXTRACT\(DAY FROM data_referencia\) = 1\)/)
})

test('migration adiciona saldos mensais ao lote e preserva na substituicao', async () => {
  const sql = await readFile(balancesMigrationUrl, 'utf8')

  for (const field of ['estoque_inicial', 'estoque_final', 'caixa_inicial', 'caixa_final']) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS ${field} NUMERIC\\(14,2\\)`))
    assert.match(sql, new RegExp(`${field} >= 0`))
  }

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.criar_lancamentos_lote_p0/)
  assert.match(sql, /p_estoque_inicial NUMERIC\(14,2\)/)
  assert.match(sql, /p_caixa_final NUMERIC\(14,2\)/)
  assert.match(sql, /CREATE TRIGGER trg_herdar_saldos_lancamento_substituto_p0/)
  assert.match(sql, /NEW\.caixa_final := v_original\.caixa_final/)
  assert.match(sql, /^COMMIT;/m)
})

test('migration exige os campos Normal e com RT com impostos independentes', async () => {
  const sql = await readFile(normalAndRtMigrationUrl, 'utf8')

  assert.match(sql, /ADD COLUMN IF NOT EXISTS tipo_lancamento VARCHAR\(10\)/)
  assert.match(sql, /tipo_lancamento IN \('NORMAL', 'COM_RT'\)/)
  assert.match(sql, /CROSS JOIN \(VALUES \('NORMAL'\), \('COM_RT'\)\)/)
  assert.match(sql, /CAMPOS_CATEGORIA_DUPLICADOS/)
  assert.match(sql, /v_original\.tipo_lancamento/)
  assert.match(sql, /lancamentos\.tipo_lancamento/)
})
