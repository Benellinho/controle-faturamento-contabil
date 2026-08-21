export function maskPercentageInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''

  const significantDigits = digits.replace(/^0+(?=\d)/, '')
  const paddedDigits = significantDigits.padStart(3, '0')
  const integer = paddedDigits.slice(0, -2).replace(/^0+(?=\d)/, '')
  const decimals = paddedDigits.slice(-2)

  return `${integer},${decimals}`
}

export function completePercentageInput(value) {
  const masked = maskPercentageInput(value)
  if (!masked) return ''

  return masked
}
