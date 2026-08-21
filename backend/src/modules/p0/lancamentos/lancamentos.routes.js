import {
  criarLancamentoSchema,
  listarLancamentosSchema,
  obterLancamentoSchema,
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

  app.get('/:id', {
    schema: obterLancamentoSchema,
    handler: options.controller.obterPorId,
  })
}
