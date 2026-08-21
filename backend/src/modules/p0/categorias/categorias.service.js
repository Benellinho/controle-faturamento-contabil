import { AppError } from '../../../lib/errors.js'

export function createCategoriasService({ categoriasRepository, empresasRepository }) {
  return {
    async listarPorEmpresa(empresaId) {
      const empresaExiste = await empresasRepository.existsById(empresaId)

      if (!empresaExiste) {
        throw new AppError(
          404,
          'EMPRESA_NAO_ENCONTRADA',
          'A empresa informada nao foi encontrada.',
        )
      }

      return categoriasRepository.findByEmpresaId(empresaId)
    },
  }
}
