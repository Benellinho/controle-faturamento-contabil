import { AppError, databaseQueryError } from '../../../lib/errors.js'

const listColumns = `
  id,
  data_referencia,
  valor,
  percentual_imposto,
  tipo_lancamento,
  estoque_inicial,
  estoque_final,
  caixa_inicial,
  caixa_final,
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
  tipo_lancamento,
  data_referencia,
  valor,
  percentual_imposto,
  estoque_inicial,
  estoque_final,
  caixa_inicial,
  caixa_final,
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
    percentual_imposto: Number(row.percentual_imposto),
    tipo_lancamento: row.tipo_lancamento,
    estoque_inicial: row.estoque_inicial === null ? null : Number(row.estoque_inicial),
    estoque_final: row.estoque_final === null ? null : Number(row.estoque_final),
    caixa_inicial: row.caixa_inicial === null ? null : Number(row.caixa_inicial),
    caixa_final: row.caixa_final === null ? null : Number(row.caixa_final),
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
    percentual_imposto: Number(row.percentual_imposto),
    estoque_inicial: Number(row.estoque_inicial),
    estoque_final: Number(row.estoque_final),
    caixa_inicial: Number(row.caixa_inicial),
    caixa_final: Number(row.caixa_final),
  }
}

function batchCreationError(error) {
  const errors = {
    EMPRESA_NAO_ENCONTRADA: new AppError(404, 'EMPRESA_NAO_ENCONTRADA', 'A empresa informada nao foi encontrada.'),
    CATEGORIAS_INCOMPLETAS: new AppError(400, 'CATEGORIAS_INCOMPLETAS', 'Informe os campos Normal e com RT de todas as categorias da empresa.'),
    CAMPOS_CATEGORIA_DUPLICADOS: new AppError(400, 'CAMPOS_CATEGORIA_DUPLICADOS', 'O mesmo campo da categoria nao pode aparecer mais de uma vez no lote.'),
    PARAMETROS_INVALIDOS: new AppError(400, 'PARAMETROS_INVALIDOS', 'Os parametros informados sao invalidos.'),
  }

  return errors[error?.message] ?? databaseQueryError('criar os lancamentos em lote', error)
}

function replacementError(error) {
  const errors = {
    LANCAMENTO_NAO_ENCONTRADO: new AppError(
      404,
      'LANCAMENTO_NAO_ENCONTRADO',
      'O lancamento informado nao foi encontrado.',
    ),
    LANCAMENTO_NAO_ATIVO: new AppError(
      409,
      'LANCAMENTO_NAO_ATIVO',
      'Somente um lancamento ativo pode ser substituido.',
    ),
    CATEGORIA_NAO_PERTENCE_EMPRESA: new AppError(
      400,
      'CATEGORIA_NAO_PERTENCE_EMPRESA',
      'A categoria informada nao pertence a empresa do lancamento.',
    ),
    MOTIVO_SUBSTITUICAO_INVALIDO: new AppError(
      400,
      'MOTIVO_SUBSTITUICAO_INVALIDO',
      'O motivo da substituicao deve ser informado.',
    ),
    PARAMETROS_INVALIDOS: new AppError(
      400,
      'PARAMETROS_INVALIDOS',
      'Os parametros informados sao invalidos.',
    ),
  }

  return errors[error?.message]
    ?? databaseQueryError('substituir o lancamento', error)
}

export function createLancamentosRepository(client) {
  return {
    async replace(id, payload) {
      if (!client) throw databaseQueryError('substituir o lancamento')

      const { data, error } = await client.rpc('substituir_lancamento_p0', {
        p_lancamento_original_id: id,
        p_categoria_id: payload.categoria_id,
        p_data_referencia: payload.data_referencia,
        p_valor: payload.valor,
        p_percentual_imposto: payload.percentual_imposto,
        p_observacao: payload.observacao ?? null,
        p_motivo_substituicao: payload.motivo_substituicao,
      })

      if (error) throw replacementError(error)

      const result = Array.isArray(data) ? data[0] : data
      if (!result) throw databaseQueryError('substituir o lancamento')

      return {
        mensagem: 'Lançamento substituído com sucesso.',
        lancamento_original_id: result.lancamento_original_id,
        novo_lancamento_id: result.novo_lancamento_id,
      }
    },

    async create(payload) {
      if (!client) throw databaseQueryError('criar o lancamento')

      const row = {
        empresa_id: payload.empresa_id,
        categoria_id: payload.categoria_id,
        data_referencia: payload.data_referencia,
        valor: payload.valor,
        percentual_imposto: payload.percentual_imposto,
        tipo_lancamento: payload.tipo_lancamento,
        estoque_inicial: payload.estoque_inicial,
        estoque_final: payload.estoque_final,
        caixa_inicial: payload.caixa_inicial,
        caixa_final: payload.caixa_final,
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

    async createBatch(payload) {
      if (!client) throw databaseQueryError('criar os lancamentos em lote')

      const { data, error } = await client.rpc('criar_lancamentos_lote_p0', {
        p_empresa_id: payload.empresa_id,
        p_data_referencia: payload.data_referencia,
        p_estoque_inicial: payload.estoque_inicial,
        p_estoque_final: payload.estoque_final,
        p_caixa_inicial: payload.caixa_inicial,
        p_caixa_final: payload.caixa_final,
        p_itens: payload.itens.map((item) => ({
          categoria_id: item.categoria_id,
          tipo_lancamento: item.tipo_lancamento,
          valor: item.valor,
          percentual_imposto: item.percentual_imposto,
          observacao: item.observacao ?? null,
        })),
      })

      if (error) throw batchCreationError(error)

      const lancamentos = (data ?? []).map((item) => ({
        id: item.id,
        categoria_id: item.categoria_id,
        tipo_lancamento: item.tipo_lancamento,
      }))

      return {
        mensagem: 'Lançamentos criados com sucesso.',
        total: lancamentos.length,
        lancamentos,
      }
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
      if (filters.ano !== undefined) {
        query = query
          .gte('data_referencia', `${filters.ano}-01-01`)
          .lte('data_referencia', `${filters.ano}-12-31`)
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
