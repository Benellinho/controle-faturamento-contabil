import { formatCurrencyFromCents } from '../../utils/formatters'

function MoneyInput({ id, value, onChange, invalid, ...props }) {
  const formattedValue = value === null ? '' : formatCurrencyFromCents(value)

  function handleChange(event) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 14)
    onChange(digits ? Number(digits) : null)
  }

  return (
    <input
      {...props}
      className={`form-control ${invalid ? 'is-invalid' : ''}`}
      id={id}
      inputMode="numeric"
      onChange={handleChange}
      value={formattedValue}
    />
  )
}

export default MoneyInput
