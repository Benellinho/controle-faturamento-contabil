import { databaseQueryError } from '../../../lib/errors.js'

const listColumns = `
  id,
  data_referencia,
  valor,
  status,
  criado_em,
  empresa:empresas!lancamentos_empresa_id_fkey(id,nome,cnpj),
  categoria:categorias!lancamentos_categoria_id_fkey(id,nome)
`

const detailColumns = `
  ${listColumns},
  observacao,
  substitui_lancamento_id,
  motivo_substituicao,
  substituido_em
`

const creationColumns = `
  id,
  empresa_id,
  categoria_id,
  data_referencia,
  valor,
  observacao,
  status,
  substitui_lancamento_id,
  motivo_substituicao,
  criado_em,
  substituido_em
`

function normalizeListItem(row) {
  return {
    id: row.id,
    data_referencia: row.data_referencia,
    empresa: row.empresa,
    categoria: row.categoria,
    valor: Number(row.valor),
    status: row.status,
    criado_em: row.criado_em,
  }
}

function normalizeDetail(row, substitutoId) {
  return {
    ...normalizeListItem(row),
    observacao: row.observacao,
    substitui_lancamento_id: row.substitui_lancamento_id,
    motivo_substituicao: row.motivo_substituicao,
    lancamento_anterior_id: row.substitui_lancamento_id,
    lancamento_substituto_id: substitutoId,
    substituido_em: row.substituido_em,
  }
}

function normalizeCreated(row) {
  return {
    ...row,
    valor: Number(row.valor),
  }
}

export function createLancamentosRepository(client) {
  return {
    async create(payload) {
      if (!client) throw databaseQueryError('criar o lancamento')

      const row = {
        empresa_id: payload.empresa_id,
        categoria_id: payload.categoria_id,
        data_referencia: payload.data_referencia,
        valor: payload.valor,
        observacao: payload.observacao ?? null,
        status: 'ATIVO',
        substitui_lancamento_id: null,
        motivo_substituicao: null,
        substituido_em: null,
      }

      const { data, error } = await client
        .from('lancamentos')
        .insert(row)
        .select(creationColumns)
        .single()

      if (error) throw databaseQueryError('criar o lancamento', error)
      return normalizeCreated(data)
    },

    async findAll(filters) {
      if (!client) throw databaseQueryError('consultar os lancamentos')

      let query = client
        .from('lancamentos')
        .select(listColumns)
        .order('data_referencia', { ascending: false })
        .order('id', { ascending: false })

      if (filters.empresa_id !== undefined) {
        query = query.eq('empresa_id', filters.empresa_id)
      }
      if (filters.categoria_id !== undefined) {
        query = query.eq('categoria_id', filters.categoria_id)
      }
      if (filters.data !== undefined) {
        query = query.eq('data_referencia', filters.data)
      }
      if (filters.status !== undefined) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw databaseQueryError('consultar os lancamentos', error)
      return data.map(normalizeListItem)
    },

    async findById(id) {
      if (!client) throw databaseQueryError('consultar o lancamento')

      const { data: lancamento, error: lancamentoError } = await client
        .from('lancamentos')
        .select(detailColumns)
        .eq('id', id)
        .maybeSingle()

      if (lancamentoError) {
        throw databaseQueryError('consultar o lancamento', lancamentoError)
      }
      if (!lancamento) return null

      const { data: substituto, error: substitutoError } = await client
        .from('lancamentos')
        .select('id')
        .eq('substitui_lancamento_id', id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (substitutoError) {
        throw databaseQueryError('consultar o historico do lancamento', substitutoError)
      }

      return normalizeDetail(lancamento, substituto?.id ?? null)
    },
  }
}
