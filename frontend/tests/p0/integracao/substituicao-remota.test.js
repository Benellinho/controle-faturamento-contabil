import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { after, test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { listarCategorias, listarEmpresas } from '../../../src/services/empresasApi.js'
import {
  criarLancamento,
  obterLancamento,
  substituirLancamento,
} from '../../../src/services/lancamentosApi.js'

const testId = randomUUID()
const originalMarker = `TESTE_ETAPA_9_ORIGINAL_${testId}`
const replacementMarker = `TESTE_ETAPA_9_SUBSTITUTO_${testId}`
const reason = `Correção integrada da Etapa 9 — ${testId}`
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const createdRows = []

after(async () => {
  for (const row of createdRows.reverse()) {
    const { data, error } = await admin
      .from('lancamentos')
      .delete()
      .eq('id', row.id)
      .eq('observacao', row.observacao)
      .select('id')

    assert.ifError(error)
    assert.deepEqual(data, [{ id: row.id }])
  }
})

test('substituicao do frontend preserva original e cria historico navegavel', async () => {
  assert.match(process.env.VITE_API_URL, /^https:\/\//)
  assert.match(supabaseUrl, /^https:\/\//)
  assert.ok(serviceKey)

  const empresas = await listarEmpresas()
  const empresa = empresas[0]
  assert.ok(empresa)

  const categorias = await listarCategorias(empresa.id)
  const categoria = categorias[0]
  assert.ok(categoria)

  const dataReferencia = `${new Date().toISOString().slice(0, 7)}-01`
  const original = await criarLancamento({
    empresa_id: empresa.id,
    categoria_id: categoria.id,
    data_referencia: dataReferencia,
    valor: 2000,
    percentual_imposto: 7.25,
    observacao: originalMarker,
  })
  createdRows.push({ id: original.id, observacao: originalMarker })

  const replacement = await substituirLancamento(original.id, {
    categoria_id: categoria.id,
    data_referencia: dataReferencia,
    valor: 2500,
    percentual_imposto: 8,
    observacao: replacementMarker,
    motivo_substituicao: reason,
  })
  createdRows.push({
    id: replacement.novo_lancamento_id,
    observacao: replacementMarker,
  })

  const originalDetail = await obterLancamento(original.id)
  const replacementDetail = await obterLancamento(replacement.novo_lancamento_id)

  assert.equal(originalDetail.status, 'SUBSTITUIDO')
  assert.equal(originalDetail.lancamento_substituto_id, replacement.novo_lancamento_id)
  assert.ok(originalDetail.substituido_em)
  assert.equal(replacementDetail.status, 'ATIVO')
  assert.equal(replacementDetail.lancamento_anterior_id, original.id)
  assert.equal(replacementDetail.motivo_substituicao, reason)

  await assert.rejects(
    substituirLancamento(original.id, {
      categoria_id: categoria.id,
      data_referencia: dataReferencia,
      valor: 3000,
      percentual_imposto: 9,
      motivo_substituicao: 'Tentativa duplicada do teste.',
    }),
    (error) => error.status === 409,
  )
})
