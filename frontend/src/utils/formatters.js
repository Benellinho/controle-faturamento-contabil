const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

export function formatCurrency(value) {
  return currencyFormatter.format(value)
}

export function formatCurrencyFromCents(value) {
  return currencyFormatter.format(value / 100)
}

export function formatCnpj(value) {
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCompetencia(year, month) {
  return `${String(month).padStart(2, '0')}/${year}`
}

export function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}
