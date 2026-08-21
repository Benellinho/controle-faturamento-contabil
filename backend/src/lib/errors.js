export class AppError extends Error {
  constructor(statusCode, code, message, options = {}) {
    super(message, options)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function databaseQueryError(context, cause) {
  return new AppError(
    500,
    'FALHA_CONSULTA_BANCO',
    `Nao foi possivel ${context}.`,
    { cause },
  )
}
