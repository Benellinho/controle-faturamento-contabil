import {
  validateLancamentoValues,
} from './faturamentoForm.js'

export function createSubstituicaoValues(lancamento) {
  return {
    empresa_id: String(lancamento.empresa.id),
    categoria_id: String(lancamento.categoria.id),
    data_referencia: lancamento.data_referencia,
    valor: Math.round(Number(lancamento.valor) * 100),
    percentual_imposto: String(lancamento.percentual_imposto),
    observacao: lancamento.observacao ?? '',
    motivo_substituicao: '',
  }
}

export function validateSubstituicaoValues(values) {
  const batchErrors = validateLancamentoValues({
    empresa_id: values.empresa_id,
    data_referencia: values.data_referencia,
    itens: [{
      categoria_id: values.categoria_id,
      valor: values.valor,
      percentual_imposto: values.percentual_imposto,
    }],
  })
  const errors = {
    ...(batchErrors.empresa_id ? { empresa_id: batchErrors.empresa_id } : {}),
    ...(batchErrors.data_referencia ? { data_referencia: batchErrors.data_referencia } : {}),
    ...(batchErrors.itens?.[values.categoria_id] ?? {}),
  }

  if (!values.motivo_substituicao.trim()) {
    errors.motivo_substituicao = 'Informe o motivo da substituição.'
  }

  return errors
}

export function buildSubstituicaoPayload(values) {
  const observacao = values.observacao.trim()

  return {
    categoria_id: Number(values.categoria_id),
    data_referencia: values.data_referencia,
    valor: values.valor / 100,
    percentual_imposto: Number(String(values.percentual_imposto).replace(',', '.')),
    ...(observacao ? { observacao } : {}),
    motivo_substituicao: values.motivo_substituicao.trim(),
  }
}

export function replacementErrorMessage(error) {
  if (error?.status === 404) {
    return 'O lançamento original não foi encontrado. Ele pode ter sido removido ou o endereço está incorreto.'
  }
  if (error?.status === 409) {
    return 'Este lançamento não está mais ativo e não pode ser substituído novamente.'
  }

  return error?.message || 'Não foi possível substituir o lançamento.'
}

export async function submitSubstituicaoValues(
  originalId,
  values,
  { substituirLancamento, onCreated },
) {
  const result = await substituirLancamento(
    originalId,
    buildSubstituicaoPayload(values),
  )
  onCreated(result.novo_lancamento_id)
  return result
}
