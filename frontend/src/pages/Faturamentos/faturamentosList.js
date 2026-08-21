const filterFields = new Set(['empresa_id', 'categoria_id', 'data', 'status'])

export function createInitialFilters() {
  return {
    empresa_id: '',
    categoria_id: '',
    data: '',
    status: '',
  }
}

export function updateLancamentosFilter(filters, field, value) {
  if (!filterFields.has(field)) {
    throw new TypeError(`Filtro não suportado: ${field}`)
  }

  return {
    ...filters,
    [field]: value,
    ...(field === 'empresa_id' ? { categoria_id: '' } : {}),
  }
}

export function hasActiveLancamentosFilters(filters) {
  return Object.values(filters).some((value) => value !== '')
}
