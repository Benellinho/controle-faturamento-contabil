import { apiRequest } from './api.js'

function lancamentosQuery(filters = {}) {
  const query = new URLSearchParams()
  const allowedFilters = ['empresa_id', 'categoria_id', 'data', 'status']

  for (const key of allowedFilters) {
    const value = filters[key]

    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  }

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function listarLancamentos(filters, options) {
  return apiRequest(`/api/lancamentos${lancamentosQuery(filters)}`, options)
}

export function obterLancamento(id, options) {
  return apiRequest(`/api/lancamentos/${encodeURIComponent(id)}`, options)
}

export function criarLancamento(payload, options = {}) {
  return apiRequest('/api/lancamentos', {
    ...options,
    method: 'POST',
    body: payload,
  })
}

export function substituirLancamento(id, payload, options = {}) {
  return apiRequest(`/api/lancamentos/${encodeURIComponent(id)}/substituir`, {
    ...options,
    method: 'POST',
    body: payload,
  })
}
