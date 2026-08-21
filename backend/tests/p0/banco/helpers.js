import assert from 'node:assert/strict'
import { isSupabaseConfigured, supabase } from '../../../src/lib/supabase.js'

function identifyKeyRole(key) {
  if (key.startsWith('sb_secret_')) return 'service_role'
  if (key.startsWith('sb_publishable_')) return 'anon'

  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1] ?? '', 'base64url').toString('utf8'),
    )
    return payload.role ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export function getConfiguredSupabase() {
  assert.ok(
    isSupabaseConfigured,
    'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em backend/.env.',
  )

  let url

  assert.doesNotThrow(() => {
    url = new URL(process.env.SUPABASE_URL)
  }, 'SUPABASE_URL deve conter uma URL valida.')

  assert.ok(
    ['http:', 'https:'].includes(url.protocol),
    'SUPABASE_URL deve utilizar o protocolo HTTP ou HTTPS.',
  )

  assert.equal(
    identifyKeyRole(process.env.SUPABASE_SERVICE_ROLE_KEY),
    'service_role',
    'SUPABASE_SERVICE_ROLE_KEY deve conter uma Secret key ou a chave legada service_role, nao uma Publishable/anon key.',
  )

  return supabase
}

export async function executeQuery(query, context) {
  const { data, error, count } = await query

  assert.equal(
    error,
    null,
    `${context}: ${error?.message ?? 'falha desconhecida'}`,
  )

  return { data, count }
}

export function isValidCnpj(value) {
  const cnpj = String(value ?? '')

  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false
  }

  const calculateDigit = (base, weights) => {
    const sum = [...base].reduce(
      (total, digit, index) => total + Number(digit) * weights[index],
      0,
    )
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstDigit = calculateDigit(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )
  const secondDigit = calculateDigit(
    `${cnpj.slice(0, 12)}${firstDigit}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  return cnpj.endsWith(`${firstDigit}${secondDigit}`)
}
