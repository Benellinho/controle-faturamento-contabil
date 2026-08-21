export function createEmpresasController(empresasService) {
  return {
    async listar(request, reply) {
      const empresas = await empresasService.listar()
      return reply.status(200).send(empresas)
    },
  }
}
