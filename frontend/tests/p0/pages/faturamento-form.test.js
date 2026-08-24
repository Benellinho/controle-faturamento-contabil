import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import {
  buildLancamentosLotePayload,
  createCategoriaItems,
  createInitialLancamentoValues,
  createSingleFlight,
  currentMonthReferenceDate,
  referenceDateFromMonth,
  submitLancamentoValues,
  validateLancamentoValues,
} from '../../../src/pages/Faturamentos/faturamentoForm.js'
import {
  completePercentageInput,
  maskPercentageInput,
} from '../../../src/components/forms/percentageInputMask.js'

const validValues = {
  empresa_id: '1',
  data_referencia: '2026-08-01',
  estoque_inicial: 1_000_000,
  estoque_final: 1_250_000,
  caixa_inicial: 500_000,
  caixa_final: 620_000,
  itens: [
    { categoria_id: '2', categoria_nome: 'Vendas', valor: 500_000, percentual_imposto: '7.25', observacao: ' Principal. ' },
    { categoria_id: '3', categoria_nome: 'Anexo III', valor: 150_000, percentual_imposto: '3', observacao: ' ' },
  ],
}

describe('regras do formulario de lancamentos em lote', () => {
  test('inicia com empresa, mes atual e lista de categorias vazia', () => {
    assert.deepEqual(createInitialLancamentoValues(new Date(2026, 7, 21)), {
      empresa_id: '',
      data_referencia: '2026-08-01',
      estoque_inicial: null,
      estoque_final: null,
      caixa_inicial: null,
      caixa_final: null,
      itens: [],
    })
    assert.equal(currentMonthReferenceDate(new Date(2027, 0, 15)), '2027-01-01')
    assert.equal(referenceDateFromMonth('2026-09'), '2026-09-01')
    assert.equal(createInitialLancamentoValues(new Date(2026, 7, 21), '12').empresa_id, '12')
    assert.equal(createInitialLancamentoValues(new Date(2026, 7, 21), 'inválida').empresa_id, '')
  })

  test('cria uma linha editavel para cada categoria da empresa', () => {
    assert.deepEqual(createCategoriaItems([{ id: 2, nome: 'Vendas' }, { id: 3, nome: 'Anexo III' }]), [
      { categoria_id: '2', categoria_nome: 'Vendas', valor: null, percentual_imposto: '', observacao: '' },
      { categoria_id: '3', categoria_nome: 'Anexo III', valor: null, percentual_imposto: '', observacao: '' },
    ])
  })

  test('exige empresa e ao menos uma categoria, mantendo o mes atual valido', () => {
    assert.deepEqual(Object.keys(validateLancamentoValues(createInitialLancamentoValues(new Date(2026, 7, 21)))).sort(), [
      'caixa_final',
      'caixa_inicial',
      'empresa_id',
      'estoque_final',
      'estoque_inicial',
      'itens',
    ])
  })

  test('valida valor e percentual de cada categoria', () => {
    const values = structuredClone(validValues)
    values.itens[0].valor = 0
    values.itens[1].percentual_imposto = '7.123'
    const errors = validateLancamentoValues(values)

    assert.ok(errors.itens['2'].valor)
    assert.ok(errors.itens['3'].percentual_imposto)
  })

  test('mascara imposto sem setas e limita a duas casas decimais', () => {
    assert.equal(maskPercentageInput('1'), '0,01')
    assert.equal(maskPercentageInput('0,012'), '0,12')
    assert.equal(maskPercentageInput('0,123'), '1,23')
    assert.equal(maskPercentageInput('1,2'), '0,12')
    assert.equal(maskPercentageInput('725'), '7,25')
    assert.equal(maskPercentageInput('100,00'), '100,00')
    assert.equal(completePercentageInput('7'), '0,07')
    assert.equal(completePercentageInput('7,2'), '0,72')
  })

  test('monta um unico payload com todas as categorias', () => {
    assert.deepEqual(buildLancamentosLotePayload(validValues), {
      empresa_id: 1,
      data_referencia: '2026-08-01',
      estoque_inicial: 10000,
      estoque_final: 12500,
      caixa_inicial: 5000,
      caixa_final: 6200,
      itens: [
        { categoria_id: 2, valor: 5000, percentual_imposto: 7.25, observacao: 'Principal.' },
        { categoria_id: 3, valor: 1500, percentual_imposto: 3 },
      ],
    })
  })

  test('encaminha o resultado completo da criacao em lote', async () => {
    let receivedPayload
    let redirectedResult
    const result = { total: 2, lancamentos: [{ id: 47 }, { id: 48 }] }

    await submitLancamentoValues(validValues, {
      createLancamentos: async (payload) => { receivedPayload = payload; return result },
      onCreated: (created) => { redirectedResult = created },
    })

    assert.equal(receivedPayload.itens.length, 2)
    assert.deepEqual(redirectedResult, result)
  })

  test('executa apenas uma submissao enquanto a primeira estiver pendente', async () => {
    const singleFlight = createSingleFlight()
    let releaseFirst
    let executions = 0

    const first = singleFlight.run(async () => {
      executions += 1
      await new Promise((resolve) => { releaseFirst = resolve })
      return 47
    })
    const duplicate = await singleFlight.run(async () => { executions += 1 })

    assert.deepEqual(duplicate, { executed: false })
    assert.equal(executions, 1)
    releaseFirst()
    assert.deepEqual(await first, { executed: true, value: 47 })
  })

  test('formulario usa lote, percentual e todas as categorias carregadas', async () => {
    const source = await readFile(new URL('../../../src/pages/Faturamentos/components/FaturamentoForm.jsx', import.meta.url), 'utf8')
    const percentageInputSource = await readFile(new URL('../../../src/components/forms/PercentageInput.jsx', import.meta.url), 'utf8')

    assert.match(source, /criarLancamentosLote/)
    assert.match(source, /initialEmpresaId/)
    assert.match(source, /hasLoadedCategorias && !isLoadingCategorias/)
    assert.match(source, /setHasLoadedCategorias\(true\)/)
    assert.match(source, /values\.itens\.map/)
    assert.match(source, /% de imposto/)
    assert.match(source, /<PercentageInput/)
    assert.match(source, /type="month"/)
    assert.match(source, /Estoque inicial/)
    assert.match(source, /Estoque final/)
    assert.match(source, /Caixa inicial/)
    assert.match(source, /Caixa final/)
    assert.doesNotMatch(source, /type="number"[^>]+percentual_imposto/)
    assert.match(source, /className="col-12 col-md-7"[\s\S]+categoria-\$\{item\.categoria_id\}-valor/)
    assert.match(source, /className="col-12 col-md-5"[\s\S]+categoria-\$\{item\.categoria_id\}-imposto/)
    assert.match(source, /className="col-12"[\s\S]+categoria-\$\{item\.categoria_id\}-observacao/)
    assert.doesNotMatch(percentageInputSource, /maxLength/)
    assert.match(percentageInputSource, /type="text"/)
    assert.match(source, /<FormActions[^>]+onCancel=\{onCancel\}/)
  })
})
