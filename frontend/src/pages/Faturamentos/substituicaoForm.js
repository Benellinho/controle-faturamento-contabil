import {
  buildLancamentoPayload,
  validateLancamentoValues,
} from './faturamentoForm.js'

export function createSubstituicaoValues(lancamento) {
  return {
    empresa_id: String(lancamento.empresa.id),
    categoria_id: String(lancamento.categoria.id),
    data_referencia: lancamento.data_referencia,
    valor: Math.round(Number(lancamento.valor) * 100),
    observacao: lancamento.observacao ?? '',
    motivo_substituicao: '',
  }
}

export function validateSubstituicaoValues(values) {
  const errors = validateLancamentoValues(values)

  if (!values.motivo_substituicao.trim()) {
    errors.motivo_substituicao = 'Informe o motivo da substituição.'
  }

  return errors
}

export function buildSubstituicaoPayload(values) {
  const payload = buildLancamentoPayload(values)

  return {
    categoria_id: payload.categoria_id,
    data_referencia: payload.data_referencia,
    valor: payload.valor,
    ...(payload.observacao ? { observacao: payload.observacao } : {}),
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
