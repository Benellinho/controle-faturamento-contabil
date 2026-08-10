import DetailItem from '../../components/details/DetailItem'
import DetailPageHeader from '../../components/details/DetailPageHeader'
import DetailSection from '../../components/details/DetailSection'
import RecordNotFound from '../../components/details/RecordNotFound'
import StatusBadge from '../../components/table/StatusBadge'
import { usuarios } from '../../mocks/listData'
import { formatDateTime } from '../../utils/formatters'

function UsuarioDetails({ onNavigate, recordId }) {
  const usuario = usuarios.find((item) => item.id === recordId)
  if (!usuario) return <RecordNotFound label="Usuário" onBack={() => onNavigate('usuarios')} />

  return (
    <div className="detail-page">
      <DetailPageHeader
        actions={<StatusBadge status={usuario.ativo ? 'ATIVO' : 'INATIVO'} />}
        backLabel="Voltar para usuários"
        eyebrow="Usuário"
        onBack={() => onNavigate('usuarios')}
        subtitle={usuario.email}
        title={usuario.nome}
      />
      <DetailSection title="Dados do usuário">
        <DetailItem label="Nome" value={usuario.nome} />
        <DetailItem label="E-mail" value={usuario.email} />
        <DetailItem label="Cargo" value={usuario.cargo} />
        <DetailItem label="Situação" value={usuario.ativo ? 'Ativo' : 'Inativo'} />
      </DetailSection>
      <DetailSection title="Informações de acesso e cadastro">
        <DetailItem label="Último acesso" value={usuario.ultimo_login_at ? formatDateTime(usuario.ultimo_login_at) : '—'} />
        <DetailItem label="Criado em" value={formatDateTime(usuario.created_at)} />
        <DetailItem label="Atualizado em" value={formatDateTime(usuario.updated_at)} />
      </DetailSection>
    </div>
  )
}

export default UsuarioDetails
