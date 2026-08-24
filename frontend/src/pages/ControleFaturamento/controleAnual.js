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

function categoryKey(category) {
  return String(category.id ?? category.nome)
}

function createEntry() {
  return { value: 0, taxAmount: 0, taxPercentages: [] }
}

function addTaxPercentage(entry, percentage) {
  if (!entry.taxPercentages.includes(percentage)) {
    entry.taxPercentages.push(percentage)
    entry.taxPercentages.sort((a, b) => a - b)
  }
}

export function buildAnnualReport(lancamentos, categorias = []) {
  const activeEntries = lancamentos.filter((item) => item.status === 'ATIVO')
  const categoryMap = new Map()

  for (const category of categorias) {
    categoryMap.set(categoryKey(category), { id: category.id, nome: category.nome, key: categoryKey(category) })
  }
  for (const item of activeEntries) {
    const key = categoryKey(item.categoria)
    if (!categoryMap.has(key)) categoryMap.set(key, { ...item.categoria, key })
  }

  const reportCategories = [...categoryMap.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const rowsByMonth = new Map()
  const categoryTotals = Object.fromEntries(reportCategories.map((category) => [
    category.key,
    { NORMAL: createEntry(), COM_RT: createEntry() },
  ]))

  for (const item of activeEntries) {
    const month = Number(item.data_referencia.slice(5, 7))
    const key = categoryKey(item.categoria)
    const type = item.tipo_lancamento === 'COM_RT' ? 'COM_RT' : 'NORMAL'
    const value = Number(item.valor)
    const taxPercentage = Number(item.percentual_imposto)
    const taxAmount = value * taxPercentage / 100

    if (!rowsByMonth.has(month)) {
      rowsByMonth.set(month, { month, categories: {}, monthTotal: 0, yearAccumulated: 0, taxTotal: 0 })
    }

    const row = rowsByMonth.get(month)
    row.categories[key] ??= { NORMAL: createEntry(), COM_RT: createEntry() }
    const entry = row.categories[key][type]
    entry.value += value
    entry.taxAmount += taxAmount
    addTaxPercentage(entry, taxPercentage)
    row.monthTotal += value
    row.taxTotal += taxAmount

    const totalEntry = categoryTotals[key][type]
    totalEntry.value += value
    totalEntry.taxAmount += taxAmount
    addTaxPercentage(totalEntry, taxPercentage)
  }

  const rows = [...rowsByMonth.values()].sort((a, b) => a.month - b.month)
  let yearAccumulated = 0
  for (const row of rows) {
    yearAccumulated += row.monthTotal
    row.yearAccumulated = yearAccumulated
  }

  return {
    categories: reportCategories,
    categoryTotals,
    rows,
    revenueTotal: rows.reduce((total, row) => total + row.monthTotal, 0),
    taxTotal: rows.reduce((total, row) => total + row.taxTotal, 0),
    monthsWithRevenue: rows.length,
  }
}
