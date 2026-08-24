import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import {
  listarCategorias,
  listarEmpresas,
} from '../../../src/services/empresasApi.js'
import {
  criarLancamento,
  criarLancamentosLote,
  listarLancamentos,
  obterLancamento,
  substituirLancamento,
} from '../../../src/services/lancamentosApi.js'

const originalFetch = globalThis.fetch
const originalApiUrl = globalThis.process.env.VITE_API_URL
let requests

beforeEach(() => {
  requests = []
  globalThis.process.env.VITE_API_URL = 'https://api.exemplo.test'
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return new Response(JSON.stringify([]), {
      status: options.method === 'POST' ? 201 : 200,
      headers: { 'content-type': 'application/json' },
    })
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch

  if (originalApiUrl === undefined) {
    delete globalThis.process.env.VITE_API_URL
  } else {
    globalThis.process.env.VITE_API_URL = originalApiUrl
  }
})

describe('endpoints de empresas e categorias', () => {
  test('lista empresas pela rota do contrato', async () => {
    await listarEmpresas()

    assert.equal(requests[0].url, 'https://api.exemplo.test/api/empresas')
    assert.equal(requests[0].options.method, 'GET')
  })

  test('lista categorias usando o identificador da empresa', async () => {
    await listarCategorias(25)

    assert.equal(
      requests[0].url,
      'https://api.exemplo.test/api/empresas/25/categorias',
    )
  })
})

describe('endpoints de lancamentos', () => {
  test('lista sem adicionar uma query string vazia', async () => {
    await listarLancamentos()

    assert.equal(requests[0].url, 'https://api.exemplo.test/api/lancamentos')
  })

  test('envia somente filtros preenchidos', async () => {
    await listarLancamentos({
      empresa_id: 1,
      categoria_id: '',
      data: '2026-08-21',
      ano: 2026,
      status: null,
      campo_fora_do_contrato: 'ignorado',
    })

    assert.equal(
      requests[0].url,
      'https://api.exemplo.test/api/lancamentos?empresa_id=1&data=2026-08-21&ano=2026',
    )
  })

  test('consulta o detalhe pelo identificador', async () => {
    await obterLancamento(15)

    assert.equal(requests[0].url, 'https://api.exemplo.test/api/lancamentos/15')
  })

  test('cria um lancamento com POST e o payload recebido', async () => {
    const payload = {
      empresa_id: 1,
      categoria_id: 2,
      tipo_lancamento: 'NORMAL',
      data_referencia: '2026-08-01',
      valor: 5000,
      percentual_imposto: 7.25,
      estoque_inicial: 10000,
      estoque_final: 12500,
      caixa_inicial: 5000,
      caixa_final: 6200,
    }

    await criarLancamento(payload)

    assert.equal(requests[0].options.method, 'POST')
    assert.equal(requests[0].options.body, JSON.stringify(payload))
  })

  test('cria todas as categorias pela rota transacional de lote', async () => {
    const payload = {
      empresa_id: 1,
      data_referencia: '2026-08-01',
      estoque_inicial: 10000,
      estoque_final: 12500,
      caixa_inicial: 5000,
      caixa_final: 6200,
      itens: [
        { categoria_id: 2, tipo_lancamento: 'NORMAL', valor: 5000, percentual_imposto: 7.25 },
        { categoria_id: 2, tipo_lancamento: 'COM_RT', valor: 800, percentual_imposto: 5 },
        { categoria_id: 3, tipo_lancamento: 'NORMAL', valor: 1500, percentual_imposto: 3 },
        { categoria_id: 3, tipo_lancamento: 'COM_RT', valor: 200, percentual_imposto: 2 },
      ],
    }

    await criarLancamentosLote(payload)

    assert.equal(requests[0].url, 'https://api.exemplo.test/api/lancamentos/lote')
    assert.equal(requests[0].options.method, 'POST')
    assert.equal(requests[0].options.body, JSON.stringify(payload))
  })

  test('substitui um lancamento pela rota transacional', async () => {
    const payload = {
      categoria_id: 2,
      data_referencia: '2026-08-01',
      valor: 5500,
      percentual_imposto: 7.25,
      motivo_substituicao: 'Correção do valor.',
    }

    await substituirLancamento(15, payload)

    assert.equal(
      requests[0].url,
      'https://api.exemplo.test/api/lancamentos/15/substituir',
    )
    assert.equal(requests[0].options.method, 'POST')
    assert.equal(requests[0].options.body, JSON.stringify(payload))
  })
})
