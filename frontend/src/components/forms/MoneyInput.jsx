import { formatCurrencyFromCents } from '../../utils/formatters'

function MoneyInput({ id, value, onChange, invalid, allowNegative = false, onKeyDown, ...props }) {
  const formattedValue = value === null ? '' : formatCurrencyFromCents(value)

  function handleChange(event) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 14)
    const absoluteValue = digits ? Number(digits) : null
    const isNegative = allowNegative && event.target.value.includes('-')

    onChange(absoluteValue === null ? null : isNegative ? -absoluteValue : absoluteValue)
  }

  function handleKeyDown(event) {
    if (allowNegative && event.key === '-') {
      event.preventDefault()
      onChange(value === null || value === 0 ? -0 : -Math.abs(value))
    }

    onKeyDown?.(event)
  }

  return (
    <input
      {...props}
      className={`form-control ${invalid ? 'is-invalid' : ''}`}
      id={id}
      inputMode={allowNegative ? 'decimal' : 'numeric'}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      value={formattedValue}
    />
  )
}

export default MoneyInput
