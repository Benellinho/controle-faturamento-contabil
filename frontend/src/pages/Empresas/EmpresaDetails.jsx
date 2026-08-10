import DetailItem from '../../components/details/DetailItem'
import DetailPageHeader from '../../components/details/DetailPageHeader'
import DetailSection from '../../components/details/DetailSection'
import RecordNotFound from '../../components/details/RecordNotFound'
import StatusBadge from '../../components/table/StatusBadge'
import { empresas } from '../../mocks/listData'
import { formatCnpj, formatDateTime } from '../../utils/formatters'

function EmpresaDetails({ onNavigate, recordId }) {
  const empresa = empresas.find((item) => item.id === Number(recordId))
  if (!empresa) return <RecordNotFound label="Empresa" onBack={() => onNavigate('empresas')} />

  return (
    <div className="detail-page">
      <DetailPageHeader
        actions={<StatusBadge status={empresa.ativa ? 'ATIVA' : 'INATIVA'} />}
        backLabel="Voltar para empresas"
        eyebrow="Empresa"
        onBack={() => onNavigate('empresas')}
        subtitle={`CNPJ ${formatCnpj(empresa.cnpj)}`}
        title={empresa.razao_social}
      />
      <DetailSection title="Dados da empresa">
        <DetailItem label="CNPJ" value={formatCnpj(empresa.cnpj)} />
        <DetailItem label="Razão social" value={empresa.razao_social} />
        <DetailItem label="Nome fantasia" value={empresa.nome_fantasia || '—'} />
        <DetailItem label="Situação" value={empresa.ativa ? 'Ativa' : 'Inativa'} />
      </DetailSection>
      <DetailSection title="Informações do cadastro">
        <DetailItem label="Criada em" value={formatDateTime(empresa.created_at)} />
        <DetailItem label="Atualizada em" value={formatDateTime(empresa.updated_at)} />
      </DetailSection>
    </div>
  )
}

export default EmpresaDetails
