import {
  listarLancamentosSchema,
  obterLancamentoSchema,
} from './lancamentos.schema.js'

export async function lancamentosRoutes(app, options) {
  app.get('/', {
    schema: listarLancamentosSchema,
    handler: options.controller.listar,
  })

  app.get('/:id', {
    schema: obterLancamentoSchema,
    handler: options.controller.obterPorId,
  })
}
