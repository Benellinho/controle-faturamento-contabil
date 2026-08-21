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

export function formatPercentage(value) {
  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number)
    ? `${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    : '—'
}

export function formatTaxAmount(value, percentage) {
  const amount = Number(value)
  const rate = Number(percentage)
  return Number.isFinite(amount) && Number.isFinite(rate)
    ? formatCurrency(amount * rate / 100)
    : '—'
}

export function formatCnpj(value) {
  return String(value ?? '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCompetencia(year, month) {
  return `${String(month).padStart(2, '0')}/${year}`
}

export function formatReferenceMonth(value) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(value ?? ''))
  return match ? formatCompetencia(match[1], match[2]) : '—'
}

export function formatDateTime(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? dateTimeFormatter.format(date) : '—'
}

export function formatDate(value) {
  const date = value ? new Date(`${value}T00:00:00Z`) : null
  return date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : '—'
}
