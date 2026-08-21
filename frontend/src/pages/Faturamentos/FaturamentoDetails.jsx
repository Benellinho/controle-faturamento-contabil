import { useEffect, useState } from 'react'
import DetailItem from '../../components/details/DetailItem'
import DetailPageHeader from '../../components/details/DetailPageHeader'
import DetailSection from '../../components/details/DetailSection'
import RecordNotFound from '../../components/details/RecordNotFound'
import StatusBadge from '../../components/table/StatusBadge'
import { obterLancamento } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const returnLabels = {
  controle: 'Voltar para controle de faturamento',
  historico: 'Voltar para histórico',
  faturamentos: 'Voltar para lançamentos',
}

function FaturamentoDetails({ onNavigate, recordId, returnPage = 'faturamentos' }) {
  const [lancamento, setLancamento] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const backPage = returnLabels[returnPage] ? returnPage : 'faturamentos'

  useEffect(() => {
    const controller = new AbortController()

    if (!recordId) {
      return () => controller.abort()
    }

    obterLancamento(recordId, { signal: controller.signal })
      .then(setLancamento)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [recordId, reloadKey])

  if (!recordId) {
    return <RecordNotFound label="Lançamento" onBack={() => onNavigate(backPage)} />
  }

  if (isLoading) {
    return (
      <div className="detail-page p-4 text-center" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando lançamento...
      </div>
    )
  }

  if (error?.status === 404) {
    return <RecordNotFound label="Lançamento" onBack={() => onNavigate(backPage)} />
  }

  if (error) {
    return (
      <div className="detail-page">
        <DetailPageHeader backLabel={returnLabels[backPage]} eyebrow="Lançamento" onBack={() => onNavigate(backPage)} title="Falha ao carregar" />
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{error.message}</p>
          <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => { setIsLoading(true); setError(null); setReloadKey((value) => value + 1) }}>Tentar novamente</button>
        </div>
      </div>
    )
  }

  if (!lancamento) return null

  return (
    <div className="detail-page">
      <DetailPageHeader
        actions={(
          <>
            <StatusBadge status={lancamento.status} />
            {lancamento.status === 'ATIVO' && (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => onNavigate('substituir-faturamento', lancamento.id)}>Substituir lançamento</button>
            )}
          </>
        )}
        backLabel={returnLabels[backPage]}
        eyebrow="Lançamento"
        onBack={() => onNavigate(backPage)}
        subtitle={`Data de referência ${formatDate(lancamento.data_referencia)}`}
        title={lancamento.empresa.nome}
      />

      <DetailSection title="Dados do lançamento">
        <DetailItem label="Empresa" value={lancamento.empresa.nome} />
        <DetailItem label="CNPJ" value={formatCnpj(lancamento.empresa.cnpj)} />
        <DetailItem label="Categoria" value={lancamento.categoria.nome} />
        <DetailItem label="Data de referência" value={formatDate(lancamento.data_referencia)} />
        <DetailItem className="col-12 col-md-6 detail-highlight" label="Valor do lançamento" value={formatCurrency(lancamento.valor)} />
        <DetailItem className="col-12" label="Observação" value={lancamento.observacao || '—'} />
      </DetailSection>

      <DetailSection title="Informações do registro">
        <DetailItem label="Status" value={<StatusBadge status={lancamento.status} />} />
        <DetailItem label="Criado em" value={formatDateTime(lancamento.criado_em)} />
        {lancamento.substituido_em && <DetailItem label="Substituído em" value={formatDateTime(lancamento.substituido_em)} />}
        {lancamento.motivo_substituicao && <DetailItem className="col-12" label="Motivo da substituição" value={lancamento.motivo_substituicao} />}
      </DetailSection>

      {(lancamento.lancamento_anterior_id || lancamento.lancamento_substituto_id) && (
        <DetailSection title="Histórico de substituições">
          {lancamento.lancamento_anterior_id && (
            <DetailItem className="col-12 col-md-6" label="Lançamento anterior" value={<button className="detail-link" type="button" onClick={() => onNavigate('faturamento-detalhes', lancamento.lancamento_anterior_id)}>Ver lançamento anterior</button>} />
          )}
          {lancamento.lancamento_substituto_id && (
            <DetailItem className="col-12 col-md-6" label="Próximo lançamento" value={<button className="detail-link" type="button" onClick={() => onNavigate('faturamento-detalhes', lancamento.lancamento_substituto_id)}>Ver próximo lançamento</button>} />
          )}
        </DetailSection>
      )}

      <p className="immutable-note">Este lançamento não pode ser editado ou excluído após a confirmação.</p>
    </div>
  )
}

export default FaturamentoDetails
