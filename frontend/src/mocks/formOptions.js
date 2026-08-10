export const empresasAtivas = [
  { id: 1, razao_social: 'Metalúrgica Horizonte Ltda.', nome_fantasia: 'Horizonte Metais', cnpj: '12345678000190', ativa: true, created_at: '2026-05-15T14:32:00', updated_at: '2026-08-02T09:15:00' },
  { id: 2, razao_social: 'Comercial Aurora Ltda.', nome_fantasia: 'Aurora Comercial', cnpj: '98765432000110', ativa: true, created_at: '2026-05-18T10:20:00', updated_at: '2026-07-25T16:40:00' },
  { id: 3, razao_social: 'Serviços Contábeis Pinheiros Ltda.', nome_fantasia: 'Pinheiros Serviços', cnpj: '45678912000155', ativa: true, created_at: '2026-06-03T08:45:00', updated_at: '2026-08-04T11:10:00' },
]

export const categoriasAtivas = [
  { id: 1, nome: 'Venda de mercadorias', descricao: 'Receitas com venda de produtos.', ativa: true, created_at: '2026-05-10T09:00:00', updated_at: '2026-05-10T09:00:00' },
  { id: 2, nome: 'Prestação de serviços', descricao: 'Receitas decorrentes de serviços.', ativa: true, created_at: '2026-05-10T09:05:00', updated_at: '2026-06-01T14:20:00' },
  { id: 3, nome: 'Outras receitas operacionais', descricao: 'Demais receitas ligadas à operação.', ativa: true, created_at: '2026-05-10T09:10:00', updated_at: '2026-05-10T09:10:00' },
]

export const competenciasDisponiveis = [
  { id: 101, empresa_id: 1, ano: 2026, mes: 8, status: 'ABERTA' },
  { id: 102, empresa_id: 1, ano: 2026, mes: 7, status: 'REABERTA' },
  { id: 201, empresa_id: 2, ano: 2026, mes: 8, status: 'ABERTA' },
  { id: 301, empresa_id: 3, ano: 2026, mes: 8, status: 'ABERTA' },
]
