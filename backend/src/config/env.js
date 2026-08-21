function readPort(value) {
  const port = Number(value ?? 3000)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um número inteiro entre 1 e 65535')
  }

  return port
}

export function readFrontendOrigins(value) {
  const configuredOrigins = (value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (!configuredOrigins.length) {
    throw new Error('FRONTEND_URL deve informar ao menos uma origem')
  }

  return [...new Set(configuredOrigins.map((origin) => {
    let url

    try {
      url = new URL(origin)
    } catch {
      throw new Error(`Origem inválida em FRONTEND_URL: ${origin}`)
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin.replace(/\/$/, '')) {
      throw new Error(`Origem inválida em FRONTEND_URL: ${origin}`)
    }

    return url.origin
  }))]
}

export const env = Object.freeze({
  port: readPort(process.env.PORT),
  frontendOrigins: readFrontendOrigins(process.env.FRONTEND_URL),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
})
