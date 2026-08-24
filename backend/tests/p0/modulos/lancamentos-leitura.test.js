import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { AppError } from '../../../src/lib/errors.js'
import { createLancamentosService } from '../../../src/modules/p0/lancamentos/lancamentos.service.js'

const listItemFixture = {
  id: 21,
  data_referencia: '2026-08-01',
  empresa: {
    id: 1,
    nome: 'EMPRESA EXEMPLO ALFA LTDA',
    cnpj: '99999999000191',
  },
  categoria: {
    id: 2,
    nome: 'Vendas',
  },
  valor: 5500,
  percentual_imposto: 7.25,
  tipo_lancamento: 'NORMAL',
  estoque_inicial: 10000,
  estoque_final: 12500,
  caixa_inicial: 5000,
  caixa_final: 6200,
  status: 'ATIVO',
  criado_em: '2026-08-20T11:00:00',
}

const detailFixture = {
  ...listItemFixture,
  observacao: 'Lancamento de demonstracao.',
  substitui_lancamento_id: 15,
  motivo_substituicao: 'Valor informado incorretamente.',
  lancamento_anterior_id: 15,
  lancamento_substituto_id: null,
  substituido_em: null,
}

function fakeServices(lancamentosService) {
  return {
    empresasService: {
      async listar() {
        return []
      },
    },
    categoriasService: {
      async listarPorEmpresa() {
        return []
      },
    },
    lancamentosService,
  }
}

async function withApp(lancamentosService, callback) {
  const app = await buildApp({
    logger: false,
    services: fakeServices(lancamentosService),
  })

  try {
    await callback(app)
  } finally {
    await app.close()
  }
}

describe('service de leitura de lancamentos', () => {
  test('delega filtros da listagem ao repository', async () => {
    let receivedFilters
    const service = createLancamentosService({
      lancamentosRepository: {
        async findAll(filters) {
          receivedFilters = filters
          return [listItemFixture]
        },
      },
    })
    const filters = {
      empresa_id: 1,
      categoria_id: 2,
      data: '2026-08-20',
      ano: 2026,
      status: 'ATIVO',
    }

    assert.deepEqual(await service.listar(filters), [listItemFixture])
    assert.deepEqual(receivedFilters, filters)
  })

  test('retorna o detalhe encontrado pelo repository', async () => {
    const service = createLancamentosService({
      lancamentosRepository: {
        async findById(id) {
          assert.equal(id, 21)
          return detailFixture
        },
      },
    })

    assert.deepEqual(await service.obterPorId(21), detailFixture)
  })

  test('rejeita lancamento inexistente', async () => {
    const service = createLancamentosService({
      lancamentosRepository: {
        async findById() {
          return null
        },
      },
    })

    await assert.rejects(
      service.obterPorId(999),
      (error) => (
        error instanceof AppError
        && error.statusCode === 404
        && error.code === 'LANCAMENTO_NAO_ENCONTRADO'
      ),
    )
  })
})

describe('endpoints de leitura de lancamentos', () => {
  test('GET /api/lancamentos retorna lista vazia', async () => {
    await withApp({
      async listar() {
        return []
      },
    }, async (app) => {
      const response = await app.inject({ method: 'GET', url: '/api/lancamentos' })

      assert.equal(response.statusCode, 200)
      assert.deepEqual(response.json(), [])
    })
  })

  test('listagem recebe os cinco filtros validados e convertidos', async () => {
    let receivedFilters

    await withApp({
      async listar(filters) {
        receivedFilters = filters
        return [listItemFixture]
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos?empresa_id=1&categoria_id=2&data=2026-08-20&ano=2026&status=ATIVO',
      })

      assert.equal(response.statusCode, 200)
      assert.deepEqual(receivedFilters, {
        empresa_id: 1,
        categoria_id: 2,
        data: '2026-08-20',
        ano: 2026,
        status: 'ATIVO',
      })
      assert.deepEqual(response.json(), [listItemFixture])
    })
  })

  test('listagem rejeita status fora do contrato', async () => {
    let serviceCalled = false

    await withApp({
      async listar() {
        serviceCalled = true
        return []
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos?status=CANCELADO',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
      assert.equal(serviceCalled, false)
    })
  })

  test('listagem rejeita data invalida', async () => {
    await withApp({
      async listar() {
        return []
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos?data=data-invalida',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
    })
  })

  test('listagem rejeita ano fora do intervalo suportado', async () => {
    await withApp({
      async listar() {
        return []
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos?ano=1999',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
    })
  })

  test('GET /api/lancamentos/:id retorna detalhe e navegacao', async () => {
    let receivedId

    await withApp({
      async obterPorId(id) {
        receivedId = id
        return detailFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos/21',
      })

      assert.equal(response.statusCode, 200)
      assert.equal(receivedId, 21)
      assert.deepEqual(response.json(), detailFixture)
    })
  })

  test('detalhe retorna 404 no formato do contrato', async () => {
    await withApp({
      async obterPorId() {
        throw new AppError(
          404,
          'LANCAMENTO_NAO_ENCONTRADO',
          'O lancamento informado nao foi encontrado.',
        )
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos/999',
      })

      assert.equal(response.statusCode, 404)
      assert.deepEqual(response.json(), {
        erro: {
          codigo: 'LANCAMENTO_NAO_ENCONTRADO',
          mensagem: 'O lancamento informado nao foi encontrado.',
        },
      })
    })
  })

  test('detalhe rejeita identificador acima do limite seguro', async () => {
    await withApp({
      async obterPorId() {
        return detailFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/lancamentos/9223372036854775807',
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
    })
  })
})
