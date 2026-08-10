import { categoriasAtivas, empresasAtivas } from './formOptions'

export const empresas = [
  ...empresasAtivas,
  { id: 4, razao_social: 'Indústria Vale Verde S.A.', nome_fantasia: 'Vale Verde', cnpj: '11222333000181', ativa: false, created_at: '2026-04-20T13:12:00', updated_at: '2026-07-30T17:08:00' },
]

export const usuarios = [
  { id: 'u1', nome: 'Mariana Barros', email: 'mariana@escritorio.com.br', cargo: 'Contadora', ativo: true, ultimo_login_at: '2026-08-10T07:48:00', created_at: '2026-05-10T08:00:00', updated_at: '2026-07-20T10:15:00' },
  { id: 'u2', nome: 'Rafael Nunes', email: 'rafael@escritorio.com.br', cargo: 'Analista', ativo: true, ultimo_login_at: '2026-08-09T16:22:00', created_at: '2026-05-12T10:30:00', updated_at: '2026-06-18T09:45:00' },
  { id: 'u3', nome: 'Camila Souza', email: 'camila@escritorio.com.br', cargo: 'Assistente', ativo: true, ultimo_login_at: null, created_at: '2026-07-01T14:10:00', updated_at: '2026-07-01T14:10:00' },
  { id: 'u4', nome: 'Carlos Mendes', email: 'carlos@escritorio.com.br', cargo: 'Analista', ativo: false, ultimo_login_at: '2026-06-28T11:05:00', created_at: '2026-05-15T09:20:00', updated_at: '2026-07-02T15:30:00' },
]

export const categorias = [
  ...categoriasAtivas,
  { id: 4, nome: 'Receitas financeiras', descricao: 'Categoria mantida apenas para consulta histórica.', ativa: false, created_at: '2026-05-10T09:15:00', updated_at: '2026-07-12T08:35:00' },
]

export const faturamentos = [
  { id: 1001, competencia: '2026-08', empresa_id: 1, categoria_id: 1, tipo: 'FATURAMENTO', valor: 125480.2, estoque_inicial: 48000, estoque_final: 53200, observacao: 'Faturamento mensal consolidado.', status: 'ATIVO', data_referencia: '2026-08-08', criado_por: 'Mariana Barros', created_at: '2026-08-08T08:35:00' },
  { id: 1002, competencia: '2026-08', empresa_id: 2, categoria_id: 2, tipo: 'FATURAMENTO', valor: 68400, estoque_inicial: 15200, estoque_final: 13800, observacao: null, status: 'ATIVO', data_referencia: '2026-08-06', criado_por: 'Rafael Nunes', created_at: '2026-08-06T10:12:00' },
  { id: 1003, competencia: '2026-07', empresa_id: 1, categoria_id: 1, tipo: 'FATURAMENTO', valor: 118930.5, estoque_inicial: 45000, estoque_final: 50100, observacao: 'Valor original posteriormente corrigido.', status: 'CANCELADO', data_referencia: '2026-07-09', criado_por: 'Mariana Barros', created_at: '2026-07-09T09:20:00', cancelado_em: '2026-08-01T14:32:00', cancelado_por: 'Mariana Barros', motivo_cancelamento: 'Valor informado incorretamente.', substituto_id: 1004 },
  { id: 1004, competencia: '2026-07', empresa_id: 1, categoria_id: 1, tipo: 'FATURAMENTO', valor: 116750.5, estoque_inicial: 45000, estoque_final: 49800, observacao: 'Substitui o lançamento cancelado.', status: 'ATIVO', data_referencia: '2026-07-09', criado_por: 'Mariana Barros', created_at: '2026-08-01T14:32:00', substitui_lancamento_id: 1003 },
  { id: 1005, competencia: '2026-08', empresa_id: 3, categoria_id: 3, tipo: 'DEVOLUCAO_ESTORNO', valor: 3250, estoque_inicial: 8200, estoque_final: 7900, observacao: 'Estorno referente ao período atual.', status: 'ATIVO', data_referencia: '2026-08-05', criado_por: 'Camila Souza', created_at: '2026-08-05T15:18:00' },
]

export const cancelamentos = [
  { id: 1003, competencia: '2026-07', empresa_id: 1, categoria_id: 1, valor: 118930.5, motivo: 'Valor informado incorretamente.', cancelado_em: '2026-08-01T14:32:00', usuario: 'Mariana Barros', substituto_id: 1004 },
]
