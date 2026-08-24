import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { AppError } from '../../../src/lib/errors.js'
import { createLancamentosRepository } from '../../../src/modules/p0/lancamentos/lancamentos.repository.js'
import { createLancamentosService } from '../../../src/modules/p0/lancamentos/lancamentos.service.js'

const validPayload = {
  categoria_id: 2,
  data_referencia: '2026-08-01',
  valor: 5500.55,
  percentual_imposto: 7.25,
  observacao: 'Lancamento corrigido.',
  motivo_substituicao: 'Valor informado incorretamente.',
}

const successFixture = {
  mensagem: 'Lançamento substituído com sucesso.',
  lancamento_original_id: 15,
  novo_lancamento_id: 16,
}

const originalFixture = {
  id: 15,
  categoria: { id: 2, nome: 'Vendas' },
}

function fakeServices(lancamentosService) {
  return {
    empresasService: { async listar() { return [] } },
    categoriasService: { async listarPorEmpresa() { return [] } },
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

describe('service de substituicao de lancamentos', () => {
  test('remove espacos do motivo e delega uma unica operacao ao repository', async () => {
    let receivedId
    let receivedPayload
    const service = createLancamentosService({
      lancamentosRepository: {
        async findById() {
          return originalFixture
        },
        async replace(id, payload) {
          receivedId = id
          receivedPayload = payload
          return successFixture
        },
      },
    })

    const result = await service.substituir(15, {
      ...validPayload,
      motivo_substituicao: '  Valor informado incorretamente.  ',
    })

    assert.deepEqual(result, successFixture)
    assert.equal(receivedId, 15)
    assert.equal(receivedPayload.motivo_substituicao, 'Valor informado incorretamente.')
  })

  test('rejeita motivo contendo apenas espacos sem chamar o repository', async () => {
    let repositoryCalled = false
    const service = createLancamentosService({
      lancamentosRepository: {
        async replace() {
          repositoryCalled = true
        },
      },
    })

    await assert.rejects(
      service.substituir(15, {
        ...validPayload,
        motivo_substituicao: '   ',
      }),
      (error) => (
        error instanceof AppError
        && error.statusCode === 400
        && error.code === 'MOTIVO_SUBSTITUICAO_INVALIDO'
      ),
    )
    assert.equal(repositoryCalled, false)
  })

  test('rejeita alteracao da categoria original sem executar a substituicao', async () => {
    let replaceCalled = false
    const service = createLancamentosService({
      lancamentosRepository: {
        async findById() {
          return originalFixture
        },
        async replace() {
          replaceCalled = true
        },
      },
    })

    await assert.rejects(
      service.substituir(15, { ...validPayload, categoria_id: 3 }),
      (error) => (
        error instanceof AppError
        && error.statusCode === 400
        && error.code === 'CATEGORIA_IMUTAVEL'
      ),
    )
    assert.equal(replaceCalled, false)
  })
})

describe('repository de substituicao de lancamentos', () => {
  test('executa uma unica RPC com todos os parametros da substituicao', async () => {
    let rpcName
    let rpcParameters
    const repository = createLancamentosRepository({
      async rpc(name, parameters) {
        rpcName = name
        rpcParameters = parameters
        return {
          data: [{ lancamento_original_id: 15, novo_lancamento_id: 16 }],
          error: null,
        }
      },
    })

    const result = await repository.replace(15, validPayload)

    assert.equal(rpcName, 'substituir_lancamento_p0')
    assert.deepEqual(rpcParameters, {
      p_lancamento_original_id: 15,
      p_categoria_id: 2,
      p_data_referencia: '2026-08-01',
      p_valor: 5500.55,
      p_percentual_imposto: 7.25,
      p_observacao: 'Lancamento corrigido.',
      p_motivo_substituicao: 'Valor informado incorretamente.',
    })
    assert.deepEqual(result, successFixture)
  })

  const businessErrors = [
    ['LANCAMENTO_NAO_ENCONTRADO', 404],
    ['LANCAMENTO_NAO_ATIVO', 409],
    ['CATEGORIA_NAO_PERTENCE_EMPRESA', 400],
    ['MOTIVO_SUBSTITUICAO_INVALIDO', 400],
    ['PARAMETROS_INVALIDOS', 400],
  ]

  for (const [code, statusCode] of businessErrors) {
    test(`converte ${code} para erro HTTP ${statusCode}`, async () => {
      const repository = createLancamentosRepository({
        async rpc() {
          return { data: null, error: { message: code } }
        },
      })

      await assert.rejects(
        repository.replace(15, validPayload),
        (error) => (
          error instanceof AppError
          && error.statusCode === statusCode
          && error.code === code
        ),
      )
    })
  }

  test('converte falha desconhecida da RPC em erro interno sem expor detalhes', async () => {
    const repository = createLancamentosRepository({
      async rpc() {
        return { data: null, error: { message: 'detalhe interno do banco' } }
      },
    })

    await assert.rejects(
      repository.replace(15, validPayload),
      (error) => (
        error instanceof AppError
        && error.statusCode === 500
        && error.code === 'FALHA_CONSULTA_BANCO'
        && !error.message.includes('detalhe interno')
      ),
    )
  })
})

describe('endpoint de substituicao de lancamentos', () => {
  test('POST /api/lancamentos/:id/substituir retorna HTTP 201', async () => {
    let receivedId
    let receivedPayload

    await withApp({
      async substituir(id, payload) {
        receivedId = id
        receivedPayload = payload
        return successFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos/15/substituir',
        payload: validPayload,
      })

      assert.equal(response.statusCode, 201)
      assert.equal(receivedId, 15)
      assert.deepEqual(receivedPayload, validPayload)
      assert.deepEqual(response.json(), successFixture)
    })
  })

  test('retorna 409 ao tentar substituir um lancamento nao ativo', async () => {
    await withApp({
      async substituir() {
        throw new AppError(
          409,
          'LANCAMENTO_NAO_ATIVO',
          'Somente um lancamento ativo pode ser substituido.',
        )
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos/15/substituir',
        payload: validPayload,
      })

      assert.equal(response.statusCode, 409)
      assert.equal(response.json().erro.codigo, 'LANCAMENTO_NAO_ATIVO')
    })
  })

  const invalidRequests = [
    ['ID invalido', '/api/lancamentos/0/substituir', validPayload],
    ['categoria ausente', '/api/lancamentos/15/substituir', { ...validPayload, categoria_id: undefined }],
    ['data invalida', '/api/lancamentos/15/substituir', { ...validPayload, data_referencia: '2026-02-30' }],
    ['data fora do primeiro dia', '/api/lancamentos/15/substituir', { ...validPayload, data_referencia: '2026-08-20' }],
    ['valor negativo', '/api/lancamentos/15/substituir', { ...validPayload, valor: -1 }],
    ['valor com mais de duas casas', '/api/lancamentos/15/substituir', { ...validPayload, valor: 10.123 }],
    ['percentual ausente', '/api/lancamentos/15/substituir', { ...validPayload, percentual_imposto: undefined }],
    ['percentual acima de cem', '/api/lancamentos/15/substituir', { ...validPayload, percentual_imposto: 100.01 }],
    ['percentual com mais de duas casas', '/api/lancamentos/15/substituir', { ...validPayload, percentual_imposto: 7.123 }],
    ['motivo ausente', '/api/lancamentos/15/substituir', { ...validPayload, motivo_substituicao: undefined }],
    ['empresa reservada', '/api/lancamentos/15/substituir', { ...validPayload, empresa_id: 3 }],
    ['status reservado', '/api/lancamentos/15/substituir', { ...validPayload, status: 'ATIVO' }],
  ]

  for (const [scenario, url, payload] of invalidRequests) {
    test(`rejeita ${scenario}`, async () => {
      let serviceCalled = false

      await withApp({
        async substituir() {
          serviceCalled = true
          return successFixture
        },
      }, async (app) => {
        const response = await app.inject({ method: 'POST', url, payload })

        assert.equal(response.statusCode, 400)
        assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
        assert.equal(serviceCalled, false)
      })
    })
  }

  test('rejeita motivo contendo somente espacos', async () => {
    const service = createLancamentosService({
      lancamentosRepository: {
        async findById() {
          return originalFixture
        },
        async replace() {
          throw new Error('O repository nao deveria ser chamado.')
        },
      },
    })

    await withApp(service, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos/15/substituir',
        payload: { ...validPayload, motivo_substituicao: '   ' },
      })

      assert.equal(response.statusCode, 400)
      assert.equal(response.json().erro.codigo, 'MOTIVO_SUBSTITUICAO_INVALIDO')
    })
  })
})
