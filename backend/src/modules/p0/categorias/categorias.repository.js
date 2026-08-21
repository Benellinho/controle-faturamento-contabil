import { databaseQueryError } from '../../../lib/errors.js'

export function createCategoriasRepository(client) {
  return {
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
