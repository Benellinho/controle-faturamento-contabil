const MAX_VALUE_IN_CENTS = 99_999_999_999_999

function isPositiveSafeId(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export function createInitialLancamentoValues() {
  return {
    empresa_id: '',
    categoria_id: '',
    data_referencia: '',
    valor: null,
    observacao: '',
  }
}

export function validateLancamentoValues(values) {
  const errors = {}

  if (!isPositiveSafeId(values.empresa_id)) {
    errors.empresa_id = 'Selecione a empresa do lançamento.'
  }
  if (!isPositiveSafeId(values.categoria_id)) {
    errors.categoria_id = 'Selecione a categoria do lançamento.'
  }
  if (!isValidIsoDate(values.data_referencia)) {
    errors.data_referencia = 'Informe uma data de referência válida.'
  }
  if (!Number.isSafeInteger(values.valor) || values.valor <= 0 || values.valor > MAX_VALUE_IN_CENTS) {
    errors.valor = 'Informe um valor maior que zero e dentro do limite permitido.'
  }

  return errors
}

export function buildLancamentoPayload(values) {
  const observacao = values.observacao.trim()

  return {
    empresa_id: Number(values.empresa_id),
    categoria_id: Number(values.categoria_id),
    data_referencia: values.data_referencia,
    valor: values.valor / 100,
    ...(observacao ? { observacao } : {}),
  }
}

export function createSingleFlight() {
  let isRunning = false

  return {
    async run(task) {
      if (isRunning) return { executed: false }

      isRunning = true

      try {
        return { executed: true, value: await task() }
      } finally {
        isRunning = false
      }
    },
  }
}

export async function submitLancamentoValues(values, { createLancamento, onCreated }) {
  const lancamento = await createLancamento(buildLancamentoPayload(values))
  onCreated(lancamento.id)
  return lancamento
}
