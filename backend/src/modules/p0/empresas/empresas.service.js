export function createEmpresasService(empresasRepository) {
  return {
    async listar() {
      return empresasRepository.findAll()
    },
  }
}
