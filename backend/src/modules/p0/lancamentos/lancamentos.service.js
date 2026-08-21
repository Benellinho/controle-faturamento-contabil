import { AppError } from '../../../lib/errors.js'

export function createLancamentosService({
  lancamentosRepository,
  empresasRepository,
  categoriasRepository,
}) {
  return {
    async substituir(id, payload) {
      const motivo = payload.motivo_substituicao.trim()

      if (!motivo) {
        throw new AppError(
          400,
          'MOTIVO_SUBSTITUICAO_INVALIDO',
          'O motivo da substituicao deve ser informado.',
        )
      }

      return lancamentosRepository.replace(id, {
        ...payload,
        motivo_substituicao: motivo,
      })
    },

    async criar(payload) {
      const empresaExiste = await empresasRepository.existsById(payload.empresa_id)

      if (!empresaExiste) {
        throw new AppError(
          404,
          'EMPRESA_NAO_ENCONTRADA',
          'A empresa informada nao foi encontrada.',
        )
      }

      const categoria = await categoriasRepository.findById(payload.categoria_id)

      if (!categoria) {
        throw new AppError(
          404,
          'CATEGORIA_NAO_ENCONTRADA',
          'A categoria informada nao foi encontrada.',
        )
      }

      if (categoria.empresa_id !== payload.empresa_id) {
        throw new AppError(
          400,
          'CATEGORIA_NAO_PERTENCE_EMPRESA',
          'A categoria informada nao pertence a empresa selecionada.',
        )
      }

      return lancamentosRepository.create(payload)
    },

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
