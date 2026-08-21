import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildApp } from '../../../src/app.js'
import { AppError } from '../../../src/lib/errors.js'
import { createLancamentosRepository } from '../../../src/modules/p0/lancamentos/lancamentos.repository.js'
import { createLancamentosService } from '../../../src/modules/p0/lancamentos/lancamentos.service.js'

const validPayload = {
  empresa_id: 1,
  categoria_id: 2,
  data_referencia: '2026-08-20',
  valor: 5000.55,
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

function createService(overrides = {}) {
  const calls = {
    create: 0,
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
})

describe('repository de criacao de lancamentos', () => {
  test('grava somente dados permitidos e define os campos de controle', async () => {
    let insertedRow
    let selectedColumns
    const databaseRow = {
      id: 31,
      empresa_id: 1,
      categoria_id: 2,
      data_referencia: '2026-08-20',
      valor: '5000.55',
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
    assert.deepEqual(created, createdFixture)
  })
})

describe('endpoint de criacao de lancamentos', () => {
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

  test('aceita observacao omitida', async () => {
    const payload = {
      empresa_id: 1,
      categoria_id: 2,
      data_referencia: '2026-08-20',
      valor: 5000,
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

  const invalidPayloads = [
    ['empresa ausente', { ...validPayload, empresa_id: undefined }],
    ['categoria ausente', { ...validPayload, categoria_id: undefined }],
    ['data ausente', { ...validPayload, data_referencia: undefined }],
    ['valor ausente', { ...validPayload, valor: undefined }],
    ['valor zero', { ...validPayload, valor: 0 }],
    ['valor negativo', { ...validPayload, valor: -1 }],
    ['valor com mais de duas casas', { ...validPayload, valor: 10.123 }],
    ['valor acima do banco', { ...validPayload, valor: 1000000000000 }],
    ['data invalida', { ...validPayload, data_referencia: '2026-02-30' }],
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
