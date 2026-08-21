export function createLancamentosController(lancamentosService) {
  return {
    async criarLote(request, reply) {
      const resultado = await lancamentosService.criarLote({ ...request.body })
      return reply.status(201).send(resultado)
    },

    async substituir(request, reply) {
      const resultado = await lancamentosService.substituir(
        request.params.id,
        { ...request.body },
      )
      return reply.status(201).send(resultado)
    },

    async criar(request, reply) {
      const lancamento = await lancamentosService.criar({ ...request.body })
      return reply.status(201).send(lancamento)
    },

    async listar(request, reply) {
      const lancamentos = await lancamentosService.listar({ ...request.query })
      return reply.status(200).send(lancamentos)
    },

    async obterPorId(request, reply) {
      const lancamento = await lancamentosService.obterPorId(request.params.id)
      return reply.status(200).send(lancamento)
    },
  }
}
