import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  buildAnnualReport,
  createYearOptions,
  monthName,
} from '../../../src/pages/ControleFaturamento/controleAnual.js'

const lancamentos = [
  { id: 3, data_referencia: '2026-02-01', valor: 1000, percentual_imposto: 10, status: 'ATIVO', categoria: { nome: 'Serviços' } },
  { id: 2, data_referencia: '2026-01-01', valor: 500, percentual_imposto: 5, status: 'SUBSTITUIDO', categoria: { nome: 'Produtos' } },
  { id: 1, data_referencia: '2026-01-01', valor: 2000, percentual_imposto: 7.5, status: 'ATIVO', categoria: { nome: 'Produtos' } },
]

describe('controle anual de faturamento', () => {
  test('ordena os lancamentos ativos por mes e calcula totais', () => {
    const report = buildAnnualReport(lancamentos)

    assert.deepEqual(report.rows.map((item) => item.id), [1, 3])
    assert.equal(report.rows[0].taxAmount, 150)
    assert.equal(report.revenueTotal, 3000)
    assert.equal(report.taxTotal, 250)
    assert.equal(report.monthsWithRevenue, 2)
  })

  test('gera opcoes anuais e nomes de meses em portugues', () => {
    assert.deepEqual(createYearOptions(2026), [2026, 2025, 2024, 2023, 2022, 2021, 2020])
    assert.equal(monthName(1), 'Janeiro')
    assert.equal(monthName(12), 'Dezembro')
  })
})
