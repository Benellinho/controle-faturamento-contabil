const listNavigation = Object.freeze({ page: 'faturamentos', recordId: null })

function validRecordId(value) {
  const recordId = Number(value)
  return Number.isSafeInteger(recordId) && recordId > 0 ? recordId : null
}

export function navigationFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  if (normalizedPath === '/' || normalizedPath === '/lancamentos') return { ...listNavigation }
  if (normalizedPath === '/lancamentos/novo') return { page: 'novo-faturamento', recordId: null }

  const replacementMatch = normalizedPath.match(/^\/lancamentos\/(\d+)\/substituir$/)
  if (replacementMatch) {
    const recordId = validRecordId(replacementMatch[1])
    if (recordId) return { page: 'substituir-faturamento', recordId }
  }

  const detailsMatch = normalizedPath.match(/^\/lancamentos\/(\d+)$/)
  if (detailsMatch) {
    const recordId = validRecordId(detailsMatch[1])
    if (recordId) return { page: 'faturamento-detalhes', recordId }
  }

  return { ...listNavigation }
}

export function pathForNavigation(page, recordId = null) {
  if (page === 'faturamentos') return '/lancamentos'
  if (page === 'novo-faturamento') return '/lancamentos/novo'

  const validId = validRecordId(recordId)
  if (!validId) return null
  if (page === 'faturamento-detalhes') return `/lancamentos/${validId}`
  if (page === 'substituir-faturamento') return `/lancamentos/${validId}/substituir`

  return null
}
