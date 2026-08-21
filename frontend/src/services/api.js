function configuredApiUrl() {
  const value = (
    import.meta.env?.VITE_API_URL
    ?? globalThis.process?.env?.VITE_API_URL
    ?? ''
  ).trim()

  if (!value) {
    throw new ApiError(
      'A URL da API não foi configurada.',
      { codigo: 'CONFIGURACAO_API_AUSENTE' },
    )
  }

  return value.replace(/\/+$/, '')
}

function responseError(payload, status) {
  const error = payload?.erro

  return new ApiError(
    error?.mensagem || `A API retornou o status ${status}.`,
    {
      codigo: error?.codigo || 'ERRO_HTTP',
      status,
      detalhes: payload,
    },
  )
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message, options.causa ? { cause: options.causa } : undefined)
    this.name = 'ApiError'
    this.codigo = options.codigo || 'ERRO_API'
    this.status = options.status || 0
    this.detalhes = options.detalhes
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${configuredApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers)
  headers.set('accept', 'application/json')

  const requestOptions = {
    method: options.method || 'GET',
    headers,
    signal: options.signal,
  }

  if (options.body !== undefined) {
    headers.set('content-type', 'application/json')
    requestOptions.body = JSON.stringify(options.body)
  }

  let response

  try {
    response = await fetch(url, requestOptions)
  } catch (cause) {
    throw new ApiError(
      'Não foi possível conectar à API.',
      { codigo: 'FALHA_CONEXAO', causa: cause },
    )
  }

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch (cause) {
      throw new ApiError(
        'A API retornou uma resposta inválida.',
        {
          codigo: 'RESPOSTA_INVALIDA',
          status: response.status,
          causa: cause,
        },
      )
    }
  }

  if (!response.ok) throw responseError(payload, response.status)
  return payload
}
