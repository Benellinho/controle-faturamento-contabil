import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const migrationUrl = new URL(
  '../../../../supabase/migrations/20260821010000_criar_funcao_substituicao_p0.sql',
  import.meta.url,
)

test('migration de substituicao preserva o contrato transacional e de acesso', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  const insertPosition = sql.indexOf('INSERT INTO public.lancamentos')
  const updatePosition = sql.indexOf('UPDATE public.lancamentos')
  const rowCountPosition = sql.indexOf('GET DIAGNOSTICS v_total_atualizado = ROW_COUNT')
  const rollbackGuardPosition = sql.lastIndexOf("MESSAGE = 'LANCAMENTO_NAO_ATIVO'")

  assert.match(sql, /^BEGIN;/m)
  assert.match(sql, /^COMMIT;/m)
  assert.match(sql, /SECURITY DEFINER/)
  assert.match(sql, /SET search_path = ''/)
  assert.match(sql, /FOR UPDATE/)
  assert.match(sql, /status = 'SUBSTITUIDO'/)
  assert.match(sql, /substituido_em = CURRENT_TIMESTAMP/)
  assert.match(sql, /GRANT EXECUTE[\s\S]+TO service_role/)
  assert.match(sql, /REVOKE ALL[\s\S]+FROM PUBLIC, anon, authenticated/)
  assert.ok(insertPosition >= 0)
  assert.ok(updatePosition > insertPosition)
  assert.ok(rowCountPosition > updatePosition)
  assert.ok(rollbackGuardPosition > rowCountPosition)
})
