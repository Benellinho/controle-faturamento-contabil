import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { AppError } from '../../../src/lib/errors.js'
import { createCategoriasService } from '../../../src/modules/p0/categorias/categorias.service.js'
import { createEmpresasService } from '../../../src/modules/p0/empresas/empresas.service.js'

const empresasFixture = [
  { id: 1, nome: 'EMPRESA EXEMPLO ALFA LTDA', cnpj: '99999999000191' },
  { id: 2, nome: 'EMPRESA EXEMPLO BETA LTDA', cnpj: '88888888000191' },
]

const categoriasFixture = [
  { id: 10, nome: 'Anexo III' },
  { id: 11, nome: 'Vendas' },
]

function fakeServices(overrides = {}) {
  return {
    empresasService: {
      async listar() {
        return empresasFixture
      },
    },
    categoriasService: {
      async listarPorEmpresa() {
        return categoriasFixture
      },
    },
    ...overrides,
  }
}

async function withApp(services, callback) {
  const app = await buildApp({ logger: false, services })

  try {
    await callback(app)
  } finally {
    await app.close()
  }
}

describe('services de empresas e categorias', () => {
  test('service de empresas delega a listagem ao repository', async () => {
    let calls = 0
    const service = createEmpresasService({
      async findAll() {
        calls += 1
        return empresasFixture
      },
    })

    assert.deepEqual(await service.listar(), empresasFixture)
    assert.equal(calls, 1)
  })

  test('service de categorias consulta somente empresas existentes', async () => {
    const receivedIds = []
    const service = createCategoriasService({
      empresasRepository: {
        async existsById(id) {
          receivedIds.push(id)
          return true
        },
      },
      categoriasRepository: {
        async findByEmpresaId(id) {
          receivedIds.push(id)
          return categoriasFixture
        },
      },
    })

    assert.deepEqual(await service.listarPorEmpresa(3), categoriasFixture)
    assert.deepEqual(receivedIds, [3, 3])
  })

  test('service de categorias rejeita empresa inexistente', async () => {
    let categoriasConsultadas = false
    const service = createCategoriasService({
      empresasRepository: {
        async existsById() {
          return false
        },
      },
      categoriasRepository: {
        async findByEmpresaId() {
          categoriasConsultadas = true
          return []
        },
      },
    })

    await assert.rejects(
      service.listarPorEmpresa(999),
      (error) => (
        error instanceof AppError
        && error.statusCode === 404
        && error.code === 'EMPRESA_NAO_ENCONTRADA'
      ),
    )
    assert.equal(categoriasConsultadas, false)
  })
})

describe('endpoints de empresas e categorias', () => {
  test('GET /api/empresas retorna empresas com CNPJ', async () => {
    await withApp(fakeServices(), async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas',
      })

      assert.equal(response.statusCode, 200)
      assert.deepEqual(response.json(), empresasFixture)
    })
  })

  test('GET /api/empresas/:empresaId/categorias retorna categorias da empresa', async () => {
    let receivedId
    const services = fakeServices({
      categoriasService: {
        async listarPorEmpresa(empresaId) {
          receivedId = empresaId
          return categoriasFixture
        },
      },
    })

    await withApp(services, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas/3/categorias',
      })

      assert.equal(response.statusCode, 200)
      assert.equal(receivedId, 3)
      assert.deepEqual(response.json(), categoriasFixture)
    })
  })

  test('categorias retorna lista vazia quando a empresa nao possui categorias', async () => {
    const services = fakeServices({
      categoriasService: {
        async listarPorEmpresa() {
          return []
        },
      },
    })

    await withApp(services, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas/1/categorias',
      })

      assert.equal(response.statusCode, 200)
      assert.deepEqual(response.json(), [])
    })
  })

  test('categorias retorna 404 no formato do contrato para empresa inexistente', async () => {
    const services = fakeServices({
      categoriasService: {
        async listarPorEmpresa() {
          throw new AppError(
            404,
            'EMPRESA_NAO_ENCONTRADA',
            'A empresa informada nao foi encontrada.',
          )
        },
      },
    })

    await withApp(services, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas/999/categorias',
      })

      assert.equal(response.statusCode, 404)
      assert.deepEqual(response.json(), {
        erro: {
          codigo: 'EMPRESA_NAO_ENCONTRADA',
          mensagem: 'A empresa informada nao foi encontrada.',
        },
      })
    })
  })

  test('categorias retorna 400 para identificador invalido', async () => {
    let serviceCalled = false
    const services = fakeServices({
      categoriasService: {
        async listarPorEmpresa() {
          serviceCalled = true
          return []
        },
      },
    })

    await withApp(services, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas/invalida/categorias',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(serviceCalled, false)
      assert.deepEqual(response.json(), {
        erro: {
          codigo: 'PARAMETROS_INVALIDOS',
          mensagem: 'Os parametros informados sao invalidos.',
        },
      })
    })
  })

  test('categorias retorna 400 para identificador acima do limite seguro', async () => {
    await withApp(fakeServices(), async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/empresas/9223372036854775807/categorias',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
    })
  })
})
