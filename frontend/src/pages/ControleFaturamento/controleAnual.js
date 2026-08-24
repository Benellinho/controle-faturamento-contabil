const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  timeZone: 'UTC',
})

export function currentYear() {
  return new Date().getFullYear()
}

export function createYearOptions(referenceYear = currentYear()) {
  return Array.from({ length: 7 }, (_, index) => referenceYear - index)
}

export function monthName(month) {
  const label = monthFormatter.format(new Date(Date.UTC(2020, month - 1, 1)))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function buildAnnualReport(lancamentos) {
  const rows = [...lancamentos]
    .filter((item) => item.status === 'ATIVO')
    .map((item) => ({
      ...item,
      month: Number(item.data_referencia.slice(5, 7)),
      taxAmount: Number(item.valor) * Number(item.percentual_imposto) / 100,
    }))
    .sort((a, b) => (
      a.month - b.month
      || a.categoria.nome.localeCompare(b.categoria.nome, 'pt-BR')
      || a.id - b.id
    ))

  return {
    rows,
    revenueTotal: rows.reduce((total, item) => total + Number(item.valor), 0),
    taxTotal: rows.reduce((total, item) => total + item.taxAmount, 0),
    monthsWithRevenue: new Set(rows.map((item) => item.month)).size,
  }
}
