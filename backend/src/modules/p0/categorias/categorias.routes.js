import { listarCategoriasSchema } from './categorias.schema.js'

export async function categoriasRoutes(app, options) {
  app.get('/:empresaId/categorias', {
    schema: listarCategoriasSchema,
    handler: options.controller.listarPorEmpresa,
  })
}
