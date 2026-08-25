import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { AppError } from '../../../src/lib/errors.js'
import { createLancamentosRepository } from '../../../src/modules/p0/lancamentos/lancamentos.repository.js'
import { createLancamentosService } from '../../../src/modules/p0/lancamentos/lancamentos.service.js'

const validPayload = {
  empresa_id: 1,
  categoria_id: 2,
  tipo_lancamento: 'NORMAL',
  data_referencia: '2026-08-01',
  valor: 5000.55,
  percentual_imposto: 7.25,
  estoque_inicial: 10000,
  estoque_final: 12500,
  caixa_inicial: 5000,
  caixa_final: 6200,
  observacao: 'Lancamento de demonstracao.',
}

const createdFixture = {
  id: 31,
  ...validPayload,
  status: 'ATIVO',
  substitui_lancamento_id: null,
  motivo_substituicao: null,
  criado_em: '2026-08-21T12:00:00',
  substituido_em: null,
}

const validBatchPayload = {
  empresa_id: 1,
  data_referencia: '2026-08-01',
  estoque_inicial: 10000,
  estoque_final: 12500,
  caixa_inicial: 5000,
  caixa_final: 6200,
  itens: [
    { categoria_id: 2, tipo_lancamento: 'NORMAL', valor: 5000.55, percentual_imposto: 7.25, observacao: 'Vendas.' },
    { categoria_id: 2, tipo_lancamento: 'COM_RT', valor: 800, percentual_imposto: 5 },
    { categoria_id: 3, tipo_lancamento: 'NORMAL', valor: 1500, percentual_imposto: 3 },
    { categoria_id: 3, tipo_lancamento: 'COM_RT', valor: 200, percentual_imposto: 2 },
  ],
}

const batchFixture = {
  mensagem: 'Lançamentos criados com sucesso.',
  total: 4,
  lancamentos: [
    { id: 31, categoria_id: 2, tipo_lancamento: 'NORMAL' },
    { id: 32, categoria_id: 2, tipo_lancamento: 'COM_RT' },
    { id: 33, categoria_id: 3, tipo_lancamento: 'NORMAL' },
    { id: 34, categoria_id: 3, tipo_lancamento: 'COM_RT' },
  ],
}

function createService(overrides = {}) {
  const calls = {
    create: 0,
    createBatch: 0,
    findCategory: 0,
  }

  const service = createLancamentosService({
    empresasRepository: {
      async existsById() {
        return overrides.empresaExiste ?? true
      },
    },
    categoriasRepository: {
      async findById() {
        calls.findCategory += 1
        return overrides.categoria === undefined
          ? { id: 2, empresa_id: 1, nome: 'Vendas' }
          : overrides.categoria
      },
    },
    lancamentosRepository: {
      async create(payload) {
        calls.create += 1
        calls.createdPayload = payload
        return createdFixture
      },
      async createBatch(payload) {
        calls.createBatch += 1
        calls.batchPayload = payload
        return batchFixture
      },
    },
  })

  return { service, calls }
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

describe('service de criacao de lancamentos', () => {
  test('valida os relacionamentos e cria o lancamento', async () => {
    const { service, calls } = createService()

    assert.deepEqual(await service.criar(validPayload), createdFixture)
    assert.equal(calls.findCategory, 1)
    assert.equal(calls.create, 1)
    assert.deepEqual(calls.createdPayload, validPayload)
  })

  test('rejeita empresa inexistente antes de consultar a categoria', async () => {
    const { service, calls } = createService({ empresaExiste: false })

    await assert.rejects(
      service.criar(validPayload),
      (error) => (
        error instanceof AppError
        && error.statusCode === 404
        && error.code === 'EMPRESA_NAO_ENCONTRADA'
      ),
    )
    assert.equal(calls.findCategory, 0)
    assert.equal(calls.create, 0)
  })

  test('rejeita categoria inexistente sem criar registro', async () => {
    const { service, calls } = createService({ categoria: null })

    await assert.rejects(
      service.criar(validPayload),
      (error) => (
        error instanceof AppError
        && error.statusCode === 404
        && error.code === 'CATEGORIA_NAO_ENCONTRADA'
      ),
    )
    assert.equal(calls.create, 0)
  })

  test('rejeita categoria pertencente a outra empresa sem criar registro', async () => {
    const { service, calls } = createService({
      categoria: { id: 2, empresa_id: 3, nome: 'Vendas' },
    })

    await assert.rejects(
      service.criar(validPayload),
      (error) => (
        error instanceof AppError
        && error.statusCode === 400
        && error.code === 'CATEGORIA_NAO_PERTENCE_EMPRESA'
      ),
    )
    assert.equal(calls.create, 0)
  })

  test('criacao em lote valida a empresa e delega uma unica operacao', async () => {
    const { service, calls } = createService()

    assert.deepEqual(await service.criarLote(validBatchPayload), batchFixture)
    assert.equal(calls.createBatch, 1)
    assert.deepEqual(calls.batchPayload, validBatchPayload)
  })
})

describe('repository de criacao de lancamentos', () => {
  test('grava somente dados permitidos e define os campos de controle', async () => {
    let insertedRow
    let selectedColumns
    const databaseRow = {
      id: 31,
      empresa_id: 1,
      categoria_id: 2,
      tipo_lancamento: 'NORMAL',
      data_referencia: '2026-08-01',
      valor: '5000.55',
      percentual_imposto: '7.2500',
      estoque_inicial: '10000.00',
      estoque_final: '12500.00',
      caixa_inicial: '5000.00',
      caixa_final: '6200.00',
      observacao: 'Lancamento de demonstracao.',
      status: 'ATIVO',
      substitui_lancamento_id: null,
      motivo_substituicao: null,
      criado_em: '2026-08-21T12:00:00',
      substituido_em: null,
    }
    const query = {
      insert(row) {
        insertedRow = row
        return this
      },
      select(columns) {
        selectedColumns = columns
        return this
      },
      async single() {
        return { data: databaseRow, error: null }
      },
    }
    const repository = createLancamentosRepository({
      from(table) {
        assert.equal(table, 'lancamentos')
        return query
      },
    })

    const created = await repository.create(validPayload)

    assert.deepEqual(insertedRow, {
      ...validPayload,
      status: 'ATIVO',
      substitui_lancamento_id: null,
      motivo_substituicao: null,
      substituido_em: null,
    })
    assert.match(selectedColumns, /empresa_id/)
    assert.equal(created.valor, 5000.55)
    assert.equal(created.percentual_imposto, 7.25)
    assert.deepEqual(created, createdFixture)
  })

  test('criacao em lote usa uma unica RPC com todas as categorias', async () => {
    let rpcName
    let rpcParameters
    const repository = createLancamentosRepository({
      async rpc(name, parameters) {
        rpcName = name
        rpcParameters = parameters
        return {
          data: [
            { id: 31, categoria_id: 2, tipo_lancamento: 'NORMAL' },
            { id: 32, categoria_id: 2, tipo_lancamento: 'COM_RT' },
            { id: 33, categoria_id: 3, tipo_lancamento: 'NORMAL' },
            { id: 34, categoria_id: 3, tipo_lancamento: 'COM_RT' },
          ],
          error: null,
        }
      },
    })

    assert.deepEqual(await repository.createBatch(validBatchPayload), batchFixture)
    assert.equal(rpcName, 'criar_lancamentos_lote_p0')
    assert.deepEqual(rpcParameters, {
      p_empresa_id: 1,
      p_data_referencia: '2026-08-01',
      p_estoque_inicial: 10000,
      p_estoque_final: 12500,
      p_caixa_inicial: 5000,
      p_caixa_final: 6200,
      p_itens: [
        { categoria_id: 2, tipo_lancamento: 'NORMAL', valor: 5000.55, percentual_imposto: 7.25, observacao: 'Vendas.' },
        { categoria_id: 2, tipo_lancamento: 'COM_RT', valor: 800, percentual_imposto: 5, observacao: null },
        { categoria_id: 3, tipo_lancamento: 'NORMAL', valor: 1500, percentual_imposto: 3, observacao: null },
        { categoria_id: 3, tipo_lancamento: 'COM_RT', valor: 200, percentual_imposto: 2, observacao: null },
      ],
    })
  })
})

describe('endpoint de criacao de lancamentos', () => {
  test('POST /api/lancamentos/lote cria todas as categorias com HTTP 201', async () => {
    let receivedPayload

    await withApp({
      async criarLote(payload) {
        receivedPayload = payload
        return batchFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos/lote',
        payload: validBatchPayload,
      })

      assert.equal(response.statusCode, 201)
      assert.deepEqual(receivedPayload, validBatchPayload)
      assert.deepEqual(response.json(), batchFixture)
    })
  })

  test('POST /api/lancamentos/lote aceita caixa inicial e final negativos', async () => {
    const payload = { ...validBatchPayload, caixa_inicial: -5000, caixa_final: -6200 }

    await withApp({
      async criarLote(receivedPayload) {
        assert.deepEqual(receivedPayload, payload)
        return batchFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos/lote',
        payload,
      })

      assert.equal(response.statusCode, 201)
    })
  })

  test('POST /api/lancamentos cria um registro ATIVO com HTTP 201', async () => {
    let receivedPayload

    await withApp({
      async criar(payload) {
        receivedPayload = payload
        return createdFixture
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos',
        payload: validPayload,
      })

      assert.equal(response.statusCode, 201)
      assert.deepEqual(receivedPayload, validPayload)
      assert.deepEqual(response.json(), createdFixture)
    })
  })

  test('POST /api/lancamentos aceita caixa inicial e final negativos', async () => {
    const payload = { ...validPayload, caixa_inicial: -5000, caixa_final: -6200 }

    await withApp({
      async criar(receivedPayload) {
        assert.deepEqual(receivedPayload, payload)
        return { ...createdFixture, caixa_inicial: -5000, caixa_final: -6200 }
      },
    }, async (app) => {
      const response = await app.inject({ method: 'POST', url: '/api/lancamentos', payload })

      assert.equal(response.statusCode, 201)
      assert.equal(response.json().caixa_inicial, -5000)
      assert.equal(response.json().caixa_final, -6200)
    })
  })

  test('aceita observacao omitida', async () => {
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

    await withApp({
      async criar(receivedPayload) {
        assert.deepEqual(receivedPayload, payload)
        return { ...createdFixture, valor: 5000, observacao: null }
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos',
        payload,
      })

      assert.equal(response.statusCode, 201)
      assert.equal(response.json().observacao, null)
    })
  })

  test('aceita valor com duas casas sujeito a precisao de ponto flutuante', async () => {
    const payload = { ...validPayload, valor: 1234.56 }

    await withApp({
      async criar(receivedPayload) {
        assert.deepEqual(receivedPayload, payload)
        return { ...createdFixture, valor: payload.valor }
      },
    }, async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/lancamentos',
        payload,
      })

      assert.equal(response.statusCode, 201)
      assert.equal(response.json().valor, 1234.56)
    })
  })

  test('aceita valor zero para categoria sem faturamento', async () => {
    const payload = { ...validPayload, valor: 0 }

    await withApp({
      async criar(receivedPayload) {
        assert.deepEqual(receivedPayload, payload)
        return { ...createdFixture, valor: 0 }
      },
    }, async (app) => {
      const response = await app.inject({ method: 'POST', url: '/api/lancamentos', payload })

      assert.equal(response.statusCode, 201)
      assert.equal(response.json().valor, 0)
    })
  })

  const invalidPayloads = [
    ['empresa ausente', { ...validPayload, empresa_id: undefined }],
    ['categoria ausente', { ...validPayload, categoria_id: undefined }],
    ['tipo ausente', { ...validPayload, tipo_lancamento: undefined }],
    ['tipo invalido', { ...validPayload, tipo_lancamento: 'RETIDO' }],
    ['data ausente', { ...validPayload, data_referencia: undefined }],
    ['valor ausente', { ...validPayload, valor: undefined }],
    ['valor negativo', { ...validPayload, valor: -1 }],
    ['valor com mais de duas casas', { ...validPayload, valor: 10.123 }],
    ['valor acima do banco', { ...validPayload, valor: 1000000000000 }],
    ['percentual ausente', { ...validPayload, percentual_imposto: undefined }],
    ['percentual negativo', { ...validPayload, percentual_imposto: -0.01 }],
    ['percentual acima de cem', { ...validPayload, percentual_imposto: 100.01 }],
    ['percentual com mais de duas casas', { ...validPayload, percentual_imposto: 7.123 }],
    ['estoque inicial ausente', { ...validPayload, estoque_inicial: undefined }],
    ['estoque final negativo', { ...validPayload, estoque_final: -0.01 }],
    ['caixa inicial ausente', { ...validPayload, caixa_inicial: undefined }],
    ['caixa final abaixo do limite', { ...validPayload, caixa_final: -1000000000000 }],
    ['data invalida', { ...validPayload, data_referencia: '2026-02-30' }],
    ['data fora do primeiro dia', { ...validPayload, data_referencia: '2026-08-20' }],
    ['status reservado', { ...validPayload, status: 'SUBSTITUIDO' }],
    ['lancamento anterior reservado', { ...validPayload, substitui_lancamento_id: 10 }],
    ['motivo reservado', { ...validPayload, motivo_substituicao: 'Correcao' }],
    ['data de substituicao reservada', { ...validPayload, substituido_em: null }],
  ]

  for (const [scenario, payload] of invalidPayloads) {
    test(`rejeita ${scenario}`, async () => {
      let serviceCalled = false

      await withApp({
        async criar() {
          serviceCalled = true
          return createdFixture
        },
      }, async (app) => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/lancamentos',
          payload,
        })

        assert.equal(response.statusCode, 400)
        assert.equal(response.json().erro.codigo, 'PARAMETROS_INVALIDOS')
        assert.equal(serviceCalled, false)
      })
    })
  }
})
