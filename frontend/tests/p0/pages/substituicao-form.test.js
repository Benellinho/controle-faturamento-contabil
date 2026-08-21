import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import {
  buildSubstituicaoPayload,
  createSubstituicaoValues,
  replacementErrorMessage,
  submitSubstituicaoValues,
  validateSubstituicaoValues,
} from '../../../src/pages/Faturamentos/substituicaoForm.js'

const lancamento = {
  id: 31,
  empresa: { id: 1, nome: 'Empresa Exemplo', cnpj: '11222333000181' },
  categoria: { id: 2, nome: 'Vendas' },
  data_referencia: '2026-08-21',
  valor: 5000,
  observacao: 'Valor original.',
}

describe('regras do formulario de substituicao', () => {
  test('preenche os dados atuais e mantem o motivo vazio', () => {
    assert.deepEqual(createSubstituicaoValues(lancamento), {
      empresa_id: '1',
      categoria_id: '2',
      data_referencia: '2026-08-21',
      valor: 500_000,
      observacao: 'Valor original.',
      motivo_substituicao: '',
    })
  })

  test('exige um motivo diferente de espacos', () => {
    const values = createSubstituicaoValues(lancamento)
    values.motivo_substituicao = '   '

    assert.ok(validateSubstituicaoValues(values).motivo_substituicao)
  })

  test('monta payload sem permitir a alteracao da empresa', () => {
    const values = {
      ...createSubstituicaoValues(lancamento),
      categoria_id: '3',
      data_referencia: '2026-08-22',
      valor: 550_000,
      observacao: '  Valor corrigido. ',
      motivo_substituicao: '  Correção do valor. ',
    }

    assert.deepEqual(buildSubstituicaoPayload(values), {
      categoria_id: 3,
      data_referencia: '2026-08-22',
      valor: 5500,
      observacao: 'Valor corrigido.',
      motivo_substituicao: 'Correção do valor.',
    })
  })

  test('chama o endpoint do original e abre o novo lancamento', async () => {
    const values = {
      ...createSubstituicaoValues(lancamento),
      motivo_substituicao: 'Correção do valor.',
    }
    let receivedId
    let receivedPayload
    let redirectedId

    await submitSubstituicaoValues(31, values, {
      substituirLancamento: async (id, payload) => {
        receivedId = id
        receivedPayload = payload
        return { lancamento_original_id: id, novo_lancamento_id: 32 }
      },
      onCreated: (id) => { redirectedId = id },
    })

    assert.equal(receivedId, 31)
    assert.equal(Object.hasOwn(receivedPayload, 'empresa_id'), false)
    assert.equal(redirectedId, 32)
  })

  test('apresenta mensagens especificas para 404 e 409', () => {
    assert.match(replacementErrorMessage({ status: 404 }), /não foi encontrado/)
    assert.match(replacementErrorMessage({ status: 409 }), /não está mais ativo/)
  })

  test('detalhe oferece substituicao somente para status ATIVO', async () => {
    const source = await readFile(
      new URL('../../../src/pages/Faturamentos/FaturamentoDetails.jsx', import.meta.url),
      'utf8',
    )

    assert.match(source, /lancamento\.status === 'ATIVO'/)
    assert.match(source, /onNavigate\('substituir-faturamento', lancamento\.id\)/)
    assert.doesNotMatch(source, /Editar lançamento|Excluir lançamento/)
  })

  test('detalhe navega pelos IDs anterior e substituto retornados pela API', async () => {
    const source = await readFile(
      new URL('../../../src/pages/Faturamentos/FaturamentoDetails.jsx', import.meta.url),
      'utf8',
    )

    assert.match(source, /onNavigate\('faturamento-detalhes', lancamento\.lancamento_anterior_id\)/)
    assert.match(source, /onNavigate\('faturamento-detalhes', lancamento\.lancamento_substituto_id\)/)
  })

  test('aplicacao registra a rota interna da substituicao', async () => {
    const source = await readFile(
      new URL('../../../src/App.jsx', import.meta.url),
      'utf8',
    )

    assert.match(source, /'substituir-faturamento': SubstituirFaturamento/)
    assert.match(source, /'substituir-faturamento': 'faturamentos'/)
  })
})
