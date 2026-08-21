import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { readFrontendOrigins } from '../../../src/config/env.js'

const allowedOrigins = [
  'http://localhost:5173',
  'https://controle-faturamento-contabil-front.vercel.app',
]

describe('configuracao das origens do frontend', () => {
  test('usa o frontend local como origem padrao', () => {
    assert.deepEqual(readFrontendOrigins(), ['http://localhost:5173'])
  })

  test('aceita origens separadas por virgula, remove espacos e duplicatas', () => {
    assert.deepEqual(
      readFrontendOrigins('http://localhost:5173, https://app.exemplo.test/,http://localhost:5173'),
      ['http://localhost:5173', 'https://app.exemplo.test'],
    )
  })

  test('rejeita valor que nao representa uma origem HTTP valida', () => {
    assert.throws(
      () => readFrontendOrigins('https://app.exemplo.test/caminho'),
      /Origem inválida/,
    )
  })
})

describe('CORS da API', () => {
  for (const origin of allowedOrigins) {
    test(`autoriza ${origin}`, async (context) => {
      const app = await buildApp({ corsOrigins: allowedOrigins, logger: false })
      context.after(() => app.close())

      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/lancamentos',
        headers: {
          origin,
          'access-control-request-method': 'GET',
        },
      })

      assert.equal(response.statusCode, 204)
      assert.equal(response.headers['access-control-allow-origin'], origin)
    })
  }

  test('nao autoriza uma origem fora da lista', async (context) => {
    const app = await buildApp({ corsOrigins: allowedOrigins, logger: false })
    context.after(() => app.close())

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/lancamentos',
      headers: {
        origin: 'https://origem-nao-autorizada.test',
        'access-control-request-method': 'GET',
      },
    })

    assert.equal(response.headers['access-control-allow-origin'], undefined)
  })
})
