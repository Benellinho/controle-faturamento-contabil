import { databaseQueryError } from '../../../lib/errors.js'

export function createEmpresasRepository(client) {
  return {
    async findAll() {
      if (!client) throw databaseQueryError('consultar as empresas')

      const { data, error } = await client
        .from('empresas')
        .select('id,nome,cnpj')
        .order('nome', { ascending: true })

      if (error) throw databaseQueryError('consultar as empresas', error)
      return data
    },

    async existsById(id) {
      if (!client) throw databaseQueryError('consultar a empresa')

      const { data, error } = await client
        .from('empresas')
        .select('id')
        .eq('id', id)
        .maybeSingle()

      if (error) throw databaseQueryError('consultar a empresa', error)
      return data !== null
    },
  }
}
