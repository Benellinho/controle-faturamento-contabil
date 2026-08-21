import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { getConfiguredSupabase } from './helpers.js'

const publishedApiUrl = process.env.P0_API_URL?.replace(/\/+$/, '')

async function request(app, options) {
  if (app) return app.inject(options)

  const response = await fetch(`${publishedApiUrl}${options.url}`, {
    method: options.method,
    headers: options.payload ? { 'content-type': 'application/json' } : undefined,
    body: options.payload ? JSON.stringify(options.payload) : undefined,
  })
  const body = await response.text()

  return {
    statusCode: response.status,
    body,
    json() {
      return JSON.parse(body)
    },
  }
}

async function loadCategories(client) {
  const { data, error } = await client
    .from('categorias')
    .select('id,empresa_id,nome')
    .order('id', { ascending: true })

  assert.equal(error, null, `Falha ao consultar categorias: ${error?.message}`)

  const primary = data[0]
  const anotherCompany = data.find(
    (category) => category.empresa_id !== primary?.empresa_id,
  )

  assert.ok(primary, 'O teste integrado exige pelo menos uma categoria.')
  assert.ok(
    anotherCompany,
    'O teste integrado exige categorias pertencentes a empresas diferentes.',
  )

  return { primary, anotherCompany }
}

async function findTestRows(client, observations) {
  const { data, error } = await client
    .from('lancamentos')
    .select('id,observacao')
    .in('observacao', observations)
    .order('id', { ascending: false })

  assert.equal(
    error,
    null,
    `Falha ao localizar registros temporarios: ${error?.message}`,
  )
  return data
}

async function removeTestRows(client, observations) {
  const rows = await findTestRows(client, observations)

  for (const row of rows) {
    const { error } = await client
      .from('lancamentos')
      .delete()
      .eq('id', row.id)

    assert.equal(
      error,
      null,
      `Falha ao remover o lancamento temporario ${row.id}: ${error?.message}`,
    )
  }

  assert.deepEqual(
    await findTestRows(client, observations),
    [],
    'A limpeza deixou lancamentos temporarios no Supabase remoto.',
  )
}

test('fluxo remoto cria, substitui, preserva historico e limpa os dados', {
  timeout: 60_000,
}, async () => {
  const client = getConfiguredSupabase()
  const app = publishedApiUrl ? null : await buildApp({ logger: false })
  const marker = `TESTE-P0-${randomUUID()}`
  const observations = [
    `${marker}-original`,
    `${marker}-segundo`,
    `${marker}-terceiro`,
    `${marker}-rollback`,
    `${marker}-conflito`,
  ]

  try {
    const { primary, anotherCompany } = await loadCategories(client)

    const creationResponse = await request(app, {
      method: 'POST',
      url: '/api/lancamentos',
      payload: {
        empresa_id: primary.empresa_id,
        categoria_id: primary.id,
        data_referencia: '2026-08-01',
        valor: 5000,
        percentual_imposto: 7.25,
        observacao: observations[0],
      },
    })
    assert.equal(creationResponse.statusCode, 201, creationResponse.body)
    const original = creationResponse.json()

    const rollbackResponse = await request(app, {
      method: 'POST',
      url: `/api/lancamentos/${original.id}/substituir`,
      payload: {
        categoria_id: anotherCompany.id,
        data_referencia: '2026-08-01',
        valor: 5100,
        percentual_imposto: 7.25,
        observacao: observations[3],
        motivo_substituicao: 'Categoria incompativel para validar rollback.',
      },
    })
    assert.equal(rollbackResponse.statusCode, 400, rollbackResponse.body)
    assert.equal(
      rollbackResponse.json().erro.codigo,
      'CATEGORIA_NAO_PERTENCE_EMPRESA',
    )
    assert.equal(
      (await findTestRows(client, observations)).length,
      1,
      'Uma substituicao rejeitada criou registro parcial.',
    )

    const firstReplacementResponse = await request(app, {
      method: 'POST',
      url: `/api/lancamentos/${original.id}/substituir`,
      payload: {
        categoria_id: primary.id,
        data_referencia: '2026-09-01',
        valor: 5500,
        percentual_imposto: 8,
        observacao: observations[1],
        motivo_substituicao: 'Primeira correcao do teste integrado.',
      },
    })
    assert.equal(firstReplacementResponse.statusCode, 201, firstReplacementResponse.body)
    const firstReplacement = firstReplacementResponse.json()
    assert.equal(firstReplacement.lancamento_original_id, original.id)

    const conflictResponse = await request(app, {
      method: 'POST',
      url: `/api/lancamentos/${original.id}/substituir`,
      payload: {
        categoria_id: primary.id,
        data_referencia: '2026-09-01',
        valor: 5600,
        percentual_imposto: 8,
        observacao: observations[4],
        motivo_substituicao: 'Tentativa conflitante do teste integrado.',
      },
    })
    assert.equal(conflictResponse.statusCode, 409, conflictResponse.body)
    assert.equal(conflictResponse.json().erro.codigo, 'LANCAMENTO_NAO_ATIVO')
    assert.equal(
      (await findTestRows(client, observations)).length,
      2,
      'A tentativa conflitante criou um lancamento adicional.',
    )

    const secondReplacementResponse = await request(app, {
      method: 'POST',
      url: `/api/lancamentos/${firstReplacement.novo_lancamento_id}/substituir`,
      payload: {
        categoria_id: primary.id,
        data_referencia: '2026-10-01',
        valor: 5750,
        percentual_imposto: 9,
        observacao: observations[2],
        motivo_substituicao: 'Segunda correcao do teste integrado.',
      },
    })
    assert.equal(secondReplacementResponse.statusCode, 201, secondReplacementResponse.body)
    const secondReplacement = secondReplacementResponse.json()

    const originalDetailResponse = await request(app, {
      method: 'GET',
      url: `/api/lancamentos/${original.id}`,
    })
    const middleDetailResponse = await request(app, {
      method: 'GET',
      url: `/api/lancamentos/${firstReplacement.novo_lancamento_id}`,
    })
    const currentDetailResponse = await request(app, {
      method: 'GET',
      url: `/api/lancamentos/${secondReplacement.novo_lancamento_id}`,
    })

    assert.equal(originalDetailResponse.statusCode, 200, originalDetailResponse.body)
    assert.equal(middleDetailResponse.statusCode, 200, middleDetailResponse.body)
    assert.equal(currentDetailResponse.statusCode, 200, currentDetailResponse.body)

    const originalDetail = originalDetailResponse.json()
    const middleDetail = middleDetailResponse.json()
    const currentDetail = currentDetailResponse.json()

    assert.equal(originalDetail.status, 'SUBSTITUIDO')
    assert.ok(originalDetail.substituido_em)
    assert.equal(originalDetail.valor, original.valor)
    assert.equal(originalDetail.observacao, original.observacao)
    assert.equal(originalDetail.categoria.id, original.categoria_id)
    assert.equal(originalDetail.lancamento_anterior_id, null)
    assert.equal(
      originalDetail.lancamento_substituto_id,
      firstReplacement.novo_lancamento_id,
    )

    assert.equal(middleDetail.status, 'SUBSTITUIDO')
    assert.equal(middleDetail.empresa.id, original.empresa_id)
    assert.equal(middleDetail.lancamento_anterior_id, original.id)
    assert.equal(
      middleDetail.lancamento_substituto_id,
      secondReplacement.novo_lancamento_id,
    )
    assert.equal(
      middleDetail.motivo_substituicao,
      'Primeira correcao do teste integrado.',
    )

    assert.equal(currentDetail.status, 'ATIVO')
    assert.equal(currentDetail.empresa.id, original.empresa_id)
    assert.equal(
      currentDetail.lancamento_anterior_id,
      firstReplacement.novo_lancamento_id,
    )
    assert.equal(currentDetail.lancamento_substituto_id, null)
    assert.equal(
      currentDetail.motivo_substituicao,
      'Segunda correcao do teste integrado.',
    )
    assert.equal((await findTestRows(client, observations)).length, 3)
  } finally {
    if (app) await app.close()
    await removeTestRows(client, observations)
  }
})
