import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { formatCnpj, formatDate, formatDateTime, formatPercentage, formatReferenceMonth, formatTaxAmount } from '../../../src/utils/formatters.js'

describe('formatadores defensivos das telas P0', () => {
  test('data vazia ou invalida nao interrompe a renderizacao', () => {
    assert.equal(formatDate(''), '—')
    assert.equal(formatDate('data-invalida'), '—')
  })

  test('data e hora vazias ou invalidas nao interrompem a renderizacao', () => {
    assert.equal(formatDateTime(null), '—')
    assert.equal(formatDateTime('data-invalida'), '—')
  })

  test('formata a referencia mensal sem exibir o dia tecnico', () => {
    assert.equal(formatReferenceMonth('2026-08-01'), '08/2026')
    assert.equal(formatReferenceMonth(''), '—')
  })

  test('formata CNPJ para apresentacao', () => {
    assert.equal(formatCnpj('99999999000191'), '99.999.999/0001-91')
  })

  test('formata percentual com ate duas casas decimais', () => {
    assert.equal(formatPercentage(7.25), '7,25%')
    assert.equal(formatPercentage(7.1234), '7,12%')
    assert.equal(formatPercentage(3), '3,00%')
    assert.equal(formatPercentage('7,25'), '7,25%')
  })

  test('calcula o imposto sem armazenar valor derivado', () => {
    assert.equal(formatTaxAmount(30_000, 7.25), 'R$ 2.175,00')
  })
})
