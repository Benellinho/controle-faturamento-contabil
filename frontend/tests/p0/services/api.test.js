import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { ApiError, apiRequest } from '../../../src/services/api.js'

const originalFetch = globalThis.fetch
const originalApiUrl = globalThis.process.env.VITE_API_URL

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  globalThis.process.env.VITE_API_URL = 'https://api.exemplo.test/'
})

afterEach(() => {
  globalThis.fetch = originalFetch

  if (originalApiUrl === undefined) {
    delete globalThis.process.env.VITE_API_URL
  } else {
    globalThis.process.env.VITE_API_URL = originalApiUrl
  }
})

describe('cliente HTTP do frontend', () => {
  test('combina a URL configurada e retorna o JSON de sucesso', async () => {
    let receivedUrl
    let receivedOptions
    globalThis.fetch = async (url, options) => {
      receivedUrl = url
      receivedOptions = options
      return jsonResponse([{ id: 1 }])
    }

    const result = await apiRequest('/api/empresas')

    assert.deepEqual(result, [{ id: 1 }])
    assert.equal(receivedUrl, 'https://api.exemplo.test/api/empresas')
    assert.equal(receivedOptions.method, 'GET')
    assert.equal(receivedOptions.headers.get('accept'), 'application/json')
  })

  test('serializa o corpo como JSON', async () => {
    let receivedOptions
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.exemplo.test/api/lancamentos')
      receivedOptions = options
      return jsonResponse({ id: 10 }, 201)
    }

    await apiRequest('/api/lancamentos', {
      method: 'POST',
      body: { valor: 5000 },
    })

    assert.equal(receivedOptions.method, 'POST')
    assert.equal(receivedOptions.headers.get('content-type'), 'application/json')
    assert.equal(receivedOptions.body, JSON.stringify({ valor: 5000 }))
  })

  test('retorna null para resposta de sucesso sem corpo', async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 })

    assert.equal(await apiRequest('/health'), null)
  })

  test('normaliza o erro retornado pelo backend', async () => {
    globalThis.fetch = async () => jsonResponse({
      erro: {
        codigo: 'LANCAMENTO_NAO_ENCONTRADO',
        mensagem: 'O lançamento não foi encontrado.',
      },
    }, 404)

    await assert.rejects(
      apiRequest('/api/lancamentos/999'),
      (error) => (
        error instanceof ApiError
        && error.status === 404
        && error.codigo === 'LANCAMENTO_NAO_ENCONTRADO'
        && error.message === 'O lançamento não foi encontrado.'
      ),
    )
  })

  test('normaliza resposta HTTP sem o formato de erro do contrato', async () => {
    globalThis.fetch = async () => jsonResponse({ detalhe: 'indisponível' }, 503)

    await assert.rejects(
      apiRequest('/api/lancamentos'),
      (error) => (
        error instanceof ApiError
        && error.status === 503
        && error.codigo === 'ERRO_HTTP'
      ),
    )
  })

  test('rejeita resposta que nao possui JSON valido', async () => {
    globalThis.fetch = async () => new Response('indisponível', { status: 502 })

    await assert.rejects(
      apiRequest('/api/lancamentos'),
      (error) => (
        error instanceof ApiError
        && error.status === 502
        && error.codigo === 'RESPOSTA_INVALIDA'
      ),
    )
  })

  test('normaliza falha de rede sem expor a excecao original', async () => {
    globalThis.fetch = async () => {
      throw new Error('detalhe interno da rede')
    }

    await assert.rejects(
      apiRequest('/api/lancamentos'),
      (error) => (
        error instanceof ApiError
        && error.status === 0
        && error.codigo === 'FALHA_CONEXAO'
        && !error.message.includes('detalhe interno')
      ),
    )
  })

  test('rejeita chamada sem VITE_API_URL', async () => {
    delete globalThis.process.env.VITE_API_URL

    await assert.rejects(
      apiRequest('/api/empresas'),
      (error) => (
        error instanceof ApiError
        && error.codigo === 'CONFIGURACAO_API_AUSENTE'
      ),
    )
  })
})
