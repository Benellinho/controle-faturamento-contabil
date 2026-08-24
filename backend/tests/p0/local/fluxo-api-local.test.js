import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { supabase } from '../../../src/lib/supabase.js'

function isLocalSupabase() {
  try {
    return ['127.0.0.1', 'localhost'].includes(new URL(process.env.SUPABASE_URL).hostname)
  } catch {
    return false
  }
}

test('checklist da API P0 contra o Supabase local', {
  skip: !isLocalSupabase() && 'Configure as credenciais do Supabase local para executar este teste.',
}, async () => {
  const app = await buildApp({ logger: false })
  let createdId = null

  try {
    const empresasResponse = await app.inject({ method: 'GET', url: '/api/empresas' })
    assert.equal(empresasResponse.statusCode, 200)
    const empresas = empresasResponse.json()
    assert.ok(empresas.length >= 3)
    assert.match(empresas[0].cnpj, /^\d{14}$/)

    const categoriasPorEmpresa = new Map()
    for (const empresa of empresas) {
      const response = await app.inject({
        method: 'GET',
        url: `/api/empresas/${empresa.id}/categorias`,
      })
      assert.equal(response.statusCode, 200)
      categoriasPorEmpresa.set(empresa.id, response.json())
    }

    const empresasComCategoria = empresas.filter(
      (empresa) => categoriasPorEmpresa.get(empresa.id).length > 0,
    )
    assert.ok(empresasComCategoria.length >= 2)

    const empresa = empresasComCategoria[0]
    const categoria = categoriasPorEmpresa.get(empresa.id)[0]
    const outraEmpresa = empresasComCategoria.find((item) => item.id !== empresa.id)
    const categoriaDeOutraEmpresa = categoriasPorEmpresa.get(outraEmpresa.id)[0]
    const dataReferencia = `${new Date().toISOString().slice(0, 7)}-01`

    const semFiltrosResponse = await app.inject({ method: 'GET', url: '/api/lancamentos' })
    assert.equal(semFiltrosResponse.statusCode, 200)
    assert.ok(Array.isArray(semFiltrosResponse.json()))

    const payload = {
      empresa_id: empresa.id,
      categoria_id: categoria.id,
      data_referencia: dataReferencia,
      valor: 1234.56,
      percentual_imposto: 7.25,
      estoque_inicial: 10000,
      estoque_final: 12500,
      caixa_inicial: 5000,
      caixa_final: 6200,
      observacao: 'Teste automatizado do Supabase local.',
    }
    const creationResponse = await app.inject({
      method: 'POST',
      url: '/api/lancamentos',
      payload,
    })
    assert.equal(creationResponse.statusCode, 201, creationResponse.body)
    const created = creationResponse.json()
    createdId = created.id
    assert.equal(created.status, 'ATIVO')

    const filteredResponse = await app.inject({
      method: 'GET',
      url: `/api/lancamentos?empresa_id=${empresa.id}&categoria_id=${categoria.id}&data=${dataReferencia}&status=ATIVO`,
    })
    assert.equal(filteredResponse.statusCode, 200)
    assert.ok(filteredResponse.json().some((item) => item.id === createdId))

    const detailResponse = await app.inject({ method: 'GET', url: `/api/lancamentos/${createdId}` })
    assert.equal(detailResponse.statusCode, 200)
    assert.equal(detailResponse.json().empresa.cnpj, empresa.cnpj)

    const missingDetailResponse = await app.inject({
      method: 'GET',
      url: '/api/lancamentos/9007199254740991',
    })
    assert.equal(missingDetailResponse.statusCode, 404)

    for (const requiredField of ['empresa_id', 'categoria_id', 'data_referencia', 'valor', 'percentual_imposto', 'estoque_inicial', 'estoque_final', 'caixa_inicial', 'caixa_final']) {
      const invalidPayload = { ...payload }
      delete invalidPayload[requiredField]
      const response = await app.inject({ method: 'POST', url: '/api/lancamentos', payload: invalidPayload })
      assert.equal(response.statusCode, 400, `Campo ausente aceito: ${requiredField}`)
    }

    const wrongCategoryResponse = await app.inject({
      method: 'POST',
      url: '/api/lancamentos',
      payload: { ...payload, categoria_id: categoriaDeOutraEmpresa.id },
    })
    assert.equal(wrongCategoryResponse.statusCode, 400)

    for (const valor of [0, -1]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos',
        payload: { ...payload, valor },
      })
      assert.equal(response.statusCode, 400, `Valor inválido aceito: ${valor}`)
    }
  } finally {
    if (createdId) {
      const { error } = await supabase.from('lancamentos').delete().eq('id', createdId)
      assert.equal(error, null, `Falha ao limpar lançamento local: ${error?.message}`)
    }
    await app.close()
  }
})
