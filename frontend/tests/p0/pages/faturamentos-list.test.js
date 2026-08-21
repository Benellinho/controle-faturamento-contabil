import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  createInitialFilters,
  hasActiveLancamentosFilters,
  updateLancamentosFilter,
} from '../../../src/pages/Faturamentos/faturamentosList.js'

describe('filtros da listagem de lancamentos P0', () => {
  test('inicia com os quatro filtros vazios', () => {
    assert.deepEqual(createInitialFilters(), {
      empresa_id: '',
      categoria_id: '',
      data: '',
      status: '',
    })
  })

  test('limpa a categoria quando a empresa muda', () => {
    const filters = {
      ...createInitialFilters(),
      empresa_id: '1',
      categoria_id: '10',
      status: 'ATIVO',
    }

    assert.deepEqual(updateLancamentosFilter(filters, 'empresa_id', '2'), {
      empresa_id: '2',
      categoria_id: '',
      data: '',
      status: 'ATIVO',
    })
  })

  test('preserva os demais filtros quando outro campo muda', () => {
    const filters = {
      empresa_id: '2',
      categoria_id: '20',
      data: '2026-08-21',
      status: '',
    }

    assert.deepEqual(updateLancamentosFilter(filters, 'status', 'SUBSTITUIDO'), {
      ...filters,
      status: 'SUBSTITUIDO',
    })
  })

  test('identifica se existe algum filtro ativo', () => {
    assert.equal(hasActiveLancamentosFilters(createInitialFilters()), false)
    assert.equal(hasActiveLancamentosFilters({
      ...createInitialFilters(),
      data: '2026-08-21',
    }), true)
  })

  test('rejeita campos fora do contrato P0', () => {
    assert.throws(
      () => updateLancamentosFilter(createInitialFilters(), 'competencia', '2026-08'),
      /Filtro não suportado/,
    )
  })
})
