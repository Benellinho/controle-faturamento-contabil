import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { after, test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { listarCategorias, listarEmpresas } from '../../../src/services/empresasApi.js'
import {
  criarLancamento,
  listarLancamentos,
  obterLancamento,
} from '../../../src/services/lancamentosApi.js'

const marker = `TESTE_ETAPA_8_${randomUUID()}`
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
let createdId

after(async () => {
  if (!createdId) return

  const { data, error } = await admin
    .from('lancamentos')
    .delete()
    .eq('id', createdId)
    .eq('observacao', marker)
    .select('id')

  assert.ifError(error)
  assert.deepEqual(data, [{ id: createdId }])
})

test('criacao do frontend aparece no detalhe e na listagem remotos', async () => {
  assert.match(process.env.VITE_API_URL, /^https:\/\//)
  assert.match(supabaseUrl, /^https:\/\//)
  assert.ok(serviceKey)

  const empresas = await listarEmpresas()
  assert.ok(empresas.length > 0, 'A API deve disponibilizar ao menos uma empresa.')

  const empresa = empresas[0]
  const categorias = await listarCategorias(empresa.id)
  assert.ok(categorias.length > 0, 'A empresa escolhida deve possuir uma categoria.')

  const categoria = categorias[0]
  const dataReferencia = `${new Date().toISOString().slice(0, 7)}-01`
  const created = await criarLancamento({
    empresa_id: empresa.id,
    categoria_id: categoria.id,
    data_referencia: dataReferencia,
    valor: 1234.5,
    percentual_imposto: 7.25,
    observacao: marker,
  })
  createdId = created.id

  assert.equal(created.status, 'ATIVO')

  const detail = await obterLancamento(createdId)
  assert.equal(detail.id, createdId)
  assert.equal(detail.observacao, marker)
  assert.equal(detail.empresa.id, empresa.id)
  assert.equal(detail.categoria.id, categoria.id)

  const listed = await listarLancamentos({
    empresa_id: empresa.id,
    categoria_id: categoria.id,
    data: dataReferencia,
    status: 'ATIVO',
  })

  assert.ok(listed.some((item) => item.id === createdId))
})
