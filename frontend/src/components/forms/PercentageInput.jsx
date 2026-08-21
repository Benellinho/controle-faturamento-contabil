import { completePercentageInput, maskPercentageInput } from './percentageInputMask'

function PercentageInput({ id, value, onChange, invalid, ...props }) {
  return (
    <input
      {...props}
      className={`form-control ${invalid ? 'is-invalid' : ''}`}
      id={id}
      inputMode="decimal"
      onBlur={() => onChange(completePercentageInput(value))}
      onChange={(event) => onChange(maskPercentageInput(event.target.value))}
      type="text"
      value={maskPercentageInput(value)}
    />
  )
}

export default PercentageInput
