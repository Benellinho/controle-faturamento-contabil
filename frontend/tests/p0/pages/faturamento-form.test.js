import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import {
  buildLancamentoPayload,
  createInitialLancamentoValues,
  createSingleFlight,
  submitLancamentoValues,
  validateLancamentoValues,
} from '../../../src/pages/Faturamentos/faturamentoForm.js'

const validValues = {
  empresa_id: '1',
  categoria_id: '2',
  data_referencia: '2026-08-21',
  valor: 500_000,
  observacao: '  Lançamento de demonstração.  ',
}

describe('regras do formulario de novo lancamento', () => {
  test('inicia somente com os campos do contrato P0', () => {
    assert.deepEqual(createInitialLancamentoValues(), {
      empresa_id: '',
      categoria_id: '',
      data_referencia: '',
      valor: null,
      observacao: '',
    })
  })

  test('valida empresa, categoria, data e valor obrigatorios', () => {
    assert.deepEqual(Object.keys(validateLancamentoValues(createInitialLancamentoValues())).sort(), [
      'categoria_id',
      'data_referencia',
      'empresa_id',
      'valor',
    ])
  })

  test('rejeita data inexistente e valor acima do limite do backend', () => {
    const errors = validateLancamentoValues({
      ...validValues,
      data_referencia: '2026-02-30',
      valor: 100_000_000_000_000,
    })

    assert.ok(errors.data_referencia)
    assert.ok(errors.valor)
  })

  test('monta o payload exato e converte centavos para reais', () => {
    assert.deepEqual(buildLancamentoPayload(validValues), {
      empresa_id: 1,
      categoria_id: 2,
      data_referencia: '2026-08-21',
      valor: 5000,
      observacao: 'Lançamento de demonstração.',
    })
  })

  test('omite a observacao quando estiver vazia', () => {
    const payload = buildLancamentoPayload({ ...validValues, observacao: '   ' })

    assert.equal(Object.hasOwn(payload, 'observacao'), false)
  })

  test('encaminha o ID criado para o redirecionamento', async () => {
    let receivedPayload
    let redirectedId

    await submitLancamentoValues(validValues, {
      createLancamento: async (payload) => {
        receivedPayload = payload
        return { id: 47 }
      },
      onCreated: (id) => { redirectedId = id },
    })

    assert.equal(receivedPayload.valor, 5000)
    assert.equal(redirectedId, 47)
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

  test('cancelar usa botao comum e apenas chama a navegacao recebida', async () => {
    const source = await readFile(
      new URL('../../../src/pages/Faturamentos/components/FaturamentoForm.jsx', import.meta.url),
      'utf8',
    )

    assert.match(source, /<FormActions[^>]+onCancel=\{onCancel\}/)
    assert.doesNotMatch(source, /onCancel=.*criarLancamento/)
  })
})
