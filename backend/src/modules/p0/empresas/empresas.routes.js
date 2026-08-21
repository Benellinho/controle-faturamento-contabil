import { listarEmpresasSchema } from './empresas.schema.js'

export async function empresasRoutes(app, options) {
  app.get('/', {
    schema: listarEmpresasSchema,
    handler: options.controller.listar,
  })
}
