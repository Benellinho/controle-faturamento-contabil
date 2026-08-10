import DetailItem from '../../components/details/DetailItem'
import DetailPageHeader from '../../components/details/DetailPageHeader'
import DetailSection from '../../components/details/DetailSection'
import RecordNotFound from '../../components/details/RecordNotFound'
import StatusBadge from '../../components/table/StatusBadge'
import { categorias, empresas, faturamentos } from '../../mocks/listData'
import { formatCompetencia, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const returnLabels = {
  controle: 'Voltar para controle de faturamento',
  historico: 'Voltar para histórico de cancelamentos',
  faturamentos: 'Voltar para faturamentos',
}

function FaturamentoDetails({ onNavigate, recordId, returnPage = 'faturamentos' }) {
  const faturamento = faturamentos.find((item) => item.id === Number(recordId))
  const backPage = returnLabels[returnPage] ? returnPage : 'faturamentos'
  if (!faturamento) return <RecordNotFound label="Faturamento" onBack={() => onNavigate(backPage)} />

  const empresa = empresas.find((item) => item.id === faturamento.empresa_id)
  const categoria = categorias.find((item) => item.id === faturamento.categoria_id)
  const [year, month] = faturamento.competencia.split('-')
  const competencia = formatCompetencia(year, month)

  return (
    <div className="detail-page">
      <DetailPageHeader
        actions={<StatusBadge status={faturamento.status} />}
        backLabel={returnLabels[backPage]}
        eyebrow="Faturamento"
        onBack={() => onNavigate(backPage)}
        subtitle={`Competência ${competencia}`}
        title={empresa?.razao_social ?? 'Empresa não encontrada'}
      />

      <DetailSection title="Dados do lançamento">
        <DetailItem label="Empresa" value={empresa?.razao_social} />
        <DetailItem label="Categoria" value={categoria?.nome} />
        <DetailItem label="Competência" value={competencia} />
        <DetailItem label="Tipo" value={faturamento.tipo === 'FATURAMENTO' ? 'Faturamento' : 'Devolução / estorno'} />
        <DetailItem label="Data de referência" value={formatDate(faturamento.data_referencia)} />
        <DetailItem className="col-12 col-md-6 detail-highlight" label="Valor do lançamento" value={formatCurrency(faturamento.valor)} />
        <DetailItem label="Estoque inicial" value={formatCurrency(faturamento.estoque_inicial)} />
        <DetailItem label="Estoque final" value={formatCurrency(faturamento.estoque_final)} />
        <DetailItem className="col-12" label="Observação" value={faturamento.observacao || '—'} />
      </DetailSection>

      <DetailSection title="Informações do registro">
        <DetailItem label="Lançado em" value={formatDateTime(faturamento.created_at)} />
        <DetailItem label="Lançado por" value={faturamento.criado_por} />
      </DetailSection>

      {faturamento.status === 'CANCELADO' && (
        <DetailSection title="Cancelamento">
          <DetailItem label="Cancelado em" value={formatDateTime(faturamento.cancelado_em)} />
          <DetailItem label="Cancelado por" value={faturamento.cancelado_por} />
          <DetailItem className="col-12" label="Motivo" value={faturamento.motivo_cancelamento} />
          <DetailItem className="col-12" label="Lançamento substituto" value={<button className="detail-link" type="button" onClick={() => onNavigate('faturamento-detalhes', faturamento.substituto_id)}>Visualizar lançamento substituto →</button>} />
        </DetailSection>
      )}

      {faturamento.substitui_lancamento_id && (
        <DetailSection title="Relação de correção">
          <DetailItem className="col-12" label="Lançamento original" value={<button className="detail-link" type="button" onClick={() => onNavigate('faturamento-detalhes', faturamento.substitui_lancamento_id)}>Visualizar lançamento cancelado →</button>} />
        </DetailSection>
      )}

      <p className="immutable-note">Este lançamento não pode ser alterado após a confirmação.</p>
    </div>
  )
}

export default FaturamentoDetails
