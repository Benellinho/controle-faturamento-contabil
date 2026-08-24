import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import {
  buildAnnualReport,
  createYearOptions,
  monthName,
} from '../../../src/pages/ControleFaturamento/controleAnual.js'

const lancamentos = [
  { id: 3, data_referencia: '2026-02-01', valor: 1000, percentual_imposto: 10, tipo_lancamento: 'NORMAL', status: 'ATIVO', categoria: { id: 2, nome: 'Serviços' } },
  { id: 4, data_referencia: '2026-02-01', valor: 500, percentual_imposto: 8, tipo_lancamento: 'COM_RT', status: 'ATIVO', categoria: { id: 2, nome: 'Serviços' } },
  { id: 2, data_referencia: '2026-01-01', valor: 500, percentual_imposto: 5, tipo_lancamento: 'NORMAL', status: 'SUBSTITUIDO', categoria: { id: 1, nome: 'Produtos' } },
  { id: 1, data_referencia: '2026-01-01', valor: 2000, percentual_imposto: 7.5, tipo_lancamento: 'NORMAL', status: 'ATIVO', categoria: { id: 1, nome: 'Produtos' } },
  { id: 5, data_referencia: '2026-01-01', valor: 600, percentual_imposto: 5, tipo_lancamento: 'COM_RT', status: 'ATIVO', categoria: { id: 1, nome: 'Produtos' } },
]

const categorias = [{ id: 2, nome: 'Serviços' }, { id: 1, nome: 'Produtos' }]

describe('controle anual de faturamento', () => {
  test('agrupa uma linha por mes com categorias normal e com RT', () => {
    const report = buildAnnualReport(lancamentos, categorias)

    assert.deepEqual(report.categories.map((category) => category.nome), ['Produtos', 'Serviços'])
    assert.deepEqual(report.rows.map((row) => row.month), [1, 2])
    assert.equal(report.rows[0].categories['1'].NORMAL.value, 2000)
    assert.equal(report.rows[0].categories['1'].NORMAL.taxAmount, 150)
    assert.deepEqual(report.rows[0].categories['1'].NORMAL.taxPercentages, [7.5])
    assert.equal(report.rows[0].categories['1'].COM_RT.value, 600)
    assert.equal(report.rows[0].monthTotal, 2600)
    assert.equal(report.rows[0].yearAccumulated, 2600)
    assert.equal(report.rows[1].monthTotal, 1500)
    assert.equal(report.rows[1].yearAccumulated, 4100)
    assert.equal(report.rows[1].taxTotal, 140)
    assert.equal(report.revenueTotal, 4100)
    assert.equal(report.taxTotal, 320)
    assert.equal(report.monthsWithRevenue, 2)
    assert.equal(report.categoryTotals['2'].COM_RT.taxAmount, 40)
  })

  test('mantem categorias cadastradas mesmo sem lancamentos no ano', () => {
    const report = buildAnnualReport([], [{ id: 7, nome: 'Revenda' }])

    assert.deepEqual(report.categories.map((category) => category.nome), ['Revenda'])
    assert.equal(report.categoryTotals['7'].NORMAL.value, 0)
    assert.equal(report.rows.length, 0)
  })

  test('gera opcoes anuais e nomes de meses em portugues', () => {
    assert.deepEqual(createYearOptions(2026), [2026, 2025, 2024, 2023, 2022, 2021, 2020])
    assert.equal(monthName(1), 'Janeiro')
    assert.equal(monthName(12), 'Dezembro')
  })

  test('tabela expande valores e impostos conforme as categorias', async () => {
    const source = await readFile(
      new URL('../../../src/pages/ControleFaturamento/ControleFaturamentoPage.jsx', import.meta.url),
      'utf8',
    )
    const styles = await readFile(
      new URL('../../../src/styles/global.css', import.meta.url),
      'utf8',
    )

    assert.match(source, /listarCategorias/)
    assert.match(source, /report\.categories\.flatMap/)
    assert.match(source, /\{category\.nome\} com RT/)
    assert.match(source, /% \{category\.nome\}/)
    assert.doesNotMatch(source, />Imposto \{category\.nome\}/)
    assert.match(source, /Acum\. \(mês\)/)
    assert.match(source, /Acum\. \(ano\)/)
    assert.match(source, /Valor impostos/)
    assert.match(source, /formatTaxPercentages\(entry\)/)
    assert.match(source, /formatCurrency\(entry\.taxAmount\)/)
    assert.match(source, /control-annual-table/)
    assert.doesNotMatch(source, /className="text-end/)
    assert.ok(source.indexOf('<section className="table-card"') < source.indexOf('<article className="control-metric">'))
    assert.match(styles, /\.table-card \.control-annual-table tbody td \{[\s\S]*?color: #000;[\s\S]*?font-weight: 400;/)
    assert.match(styles, /\.table-card \.control-annual-table th,[\s\S]*?padding-right: \.65rem;[\s\S]*?padding-left: \.65rem;/)
  })
})
