export function createCategoriasController(categoriasService) {
  return {
    async listarPorEmpresa(request, reply) {
      const categorias = await categoriasService.listarPorEmpresa(
        request.params.empresaId,
      )
      return reply.status(200).send(categorias)
    },
  }
}
