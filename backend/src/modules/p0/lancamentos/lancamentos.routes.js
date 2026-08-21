import {
  criarLancamentoSchema,
  listarLancamentosSchema,
  obterLancamentoSchema,
  substituirLancamentoSchema,
} from './lancamentos.schema.js'

export async function lancamentosRoutes(app, options) {
  app.post('/', {
    schema: criarLancamentoSchema,
    handler: options.controller.criar,
  })

  app.get('/', {
    schema: listarLancamentosSchema,
    handler: options.controller.listar,
  })

  app.post('/:id/substituir', {
    schema: substituirLancamentoSchema,
    handler: options.controller.substituir,
  })

  app.get('/:id', {
    schema: obterLancamentoSchema,
    handler: options.controller.obterPorId,
  })
}
