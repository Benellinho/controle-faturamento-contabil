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

export function isValidTaxPercentage(value) {
  const normalized = String(value).replace(',', '.')
  const number = Number(normalized)
  if (value === '' || !Number.isFinite(number) || number < 0 || number > 100) return false
  return /^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)
}

export function referenceDateFromMonth(value) {
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : ''
}

export function currentMonthReferenceDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export function createInitialLancamentoValues(date = new Date(), empresaId = null) {
  const normalizedEmpresaId = Number(empresaId)

  return {
    empresa_id: Number.isSafeInteger(normalizedEmpresaId) && normalizedEmpresaId > 0
      ? String(normalizedEmpresaId)
      : '',
    data_referencia: currentMonthReferenceDate(date),
    estoque_inicial: null,
    estoque_final: null,
    caixa_inicial: null,
    caixa_final: null,
    itens: [],
  }
}

export function createCategoriaItems(categorias) {
  return categorias.flatMap((categoria) => ([
    {
      categoria_id: String(categoria.id),
      categoria_nome: categoria.nome,
      tipo_lancamento: 'NORMAL',
      tipo_nome: 'Normal',
      valor: 0,
      percentual_imposto: '',
      observacao: '',
    },
    {
      categoria_id: String(categoria.id),
      categoria_nome: categoria.nome,
      tipo_lancamento: 'COM_RT',
      tipo_nome: 'Com RT',
      valor: 0,
      percentual_imposto: '',
      observacao: '',
    },
  ]))
}

export function itemKey(item) {
  return `${item.categoria_id}-${item.tipo_lancamento}`
}

export function validateLancamentoValues(values) {
  const errors = {}

  if (!isPositiveSafeId(values.empresa_id)) {
    errors.empresa_id = 'Selecione a empresa dos lançamentos.'
  }
  if (!isValidIsoDate(values.data_referencia) || !values.data_referencia.endsWith('-01')) {
    errors.data_referencia = 'Informe um mês de referência válido.'
  }
  for (const field of ['estoque_inicial', 'estoque_final', 'caixa_inicial', 'caixa_final']) {
    if (!Number.isSafeInteger(values[field]) || values[field] < 0 || values[field] > MAX_VALUE_IN_CENTS) {
      errors[field] = 'Informe um valor igual ou maior que zero e dentro do limite permitido.'
    }
  }
  if (!Array.isArray(values.itens) || values.itens.length === 0) {
    errors.itens = 'A empresa precisa possuir ao menos uma categoria cadastrada.'
    return errors
  }

  const itemErrors = {}
  for (const item of values.itens) {
    const current = {}
    if (!isPositiveSafeId(item.categoria_id)) current.categoria_id = 'Categoria inválida.'
    if (!['NORMAL', 'COM_RT'].includes(item.tipo_lancamento)) current.tipo_lancamento = 'Tipo de lançamento inválido.'
    if (!Number.isSafeInteger(item.valor) || item.valor < 0 || item.valor > MAX_VALUE_IN_CENTS) {
      current.valor = 'Informe um valor igual ou maior que zero e dentro do limite permitido.'
    }
    if (!isValidTaxPercentage(item.percentual_imposto)) {
      current.percentual_imposto = 'Informe um percentual entre 0 e 100, com até duas casas.'
    }
    if (Object.keys(current).length) itemErrors[itemKey(item)] = current
  }

  if (Object.keys(itemErrors).length) errors.itens = itemErrors
  return errors
}

export function buildLancamentosLotePayload(values) {
  return {
    empresa_id: Number(values.empresa_id),
    data_referencia: values.data_referencia,
    estoque_inicial: values.estoque_inicial / 100,
    estoque_final: values.estoque_final / 100,
    caixa_inicial: values.caixa_inicial / 100,
    caixa_final: values.caixa_final / 100,
    itens: values.itens.map((item) => {
      const observacao = item.observacao.trim()
      return {
        categoria_id: Number(item.categoria_id),
        tipo_lancamento: item.tipo_lancamento,
        valor: item.valor / 100,
        percentual_imposto: Number(String(item.percentual_imposto).replace(',', '.')),
        ...(observacao ? { observacao } : {}),
      }
    }),
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

export async function submitLancamentoValues(values, { createLancamentos, onCreated }) {
  const result = await createLancamentos(buildLancamentosLotePayload(values))
  onCreated(result)
  return result
}
