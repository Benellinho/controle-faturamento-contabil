import { AppError } from '../../../lib/errors.js'

export function createLancamentosService(lancamentosRepository) {
  return {
    async listar(filters) {
      return lancamentosRepository.findAll(filters)
    },

    async obterPorId(id) {
      const lancamento = await lancamentosRepository.findById(id)

      if (!lancamento) {
        throw new AppError(
          404,
          'LANCAMENTO_NAO_ENCONTRADO',
          'O lancamento informado nao foi encontrado.',
        )
      }

      return lancamento
    },
  }
}
