import { databaseQueryError } from '../../../lib/errors.js'

export function createCategoriasRepository(client) {
  return {
    async findById(id) {
      if (!client) throw databaseQueryError('consultar a categoria')

      const { data, error } = await client
        .from('categorias')
        .select('id,empresa_id,nome')
        .eq('id', id)
        .maybeSingle()

      if (error) throw databaseQueryError('consultar a categoria', error)
      return data
    },

    async findByEmpresaId(empresaId) {
      if (!client) throw databaseQueryError('consultar as categorias')

      const { data, error } = await client
        .from('categorias')
        .select('id,nome')
        .eq('empresa_id', empresaId)
        .order('nome', { ascending: true })

      if (error) throw databaseQueryError('consultar as categorias', error)
      return data
    },
  }
}
