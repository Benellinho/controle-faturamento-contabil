import { apiRequest } from './api.js'

export function listarEmpresas(options) {
  return apiRequest('/api/empresas', options)
}

export function listarCategorias(empresaId, options) {
  return apiRequest(
    `/api/empresas/${encodeURIComponent(empresaId)}/categorias`,
    options,
  )
}
