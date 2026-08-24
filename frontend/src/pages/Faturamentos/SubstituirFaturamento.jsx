import { useEffect, useRef, useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal'
import RecordNotFound from '../../components/details/RecordNotFound'
import FormActions from '../../components/forms/FormActions'
import FormFeedback from '../../components/forms/FormFeedback'
import MoneyInput from '../../components/forms/MoneyInput'
import PercentageInput from '../../components/forms/PercentageInput'
import PageHeader from '../../components/layout/PageHeader'
import StatusBadge from '../../components/table/StatusBadge'
import { obterLancamento, substituirLancamento } from '../../services/lancamentosApi'
import { formatCnpj, formatCurrencyFromCents, formatPercentage, formatReferenceMonth } from '../../utils/formatters'
import { createSingleFlight, referenceDateFromMonth } from './faturamentoForm'
import {
  createSubstituicaoValues,
  replacementErrorMessage,
  submitSubstituicaoValues,
  validateSubstituicaoValues,
} from './substituicaoForm'

function SubstituirFaturamento({ onNavigate, recordId }) {
  const [lancamento, setLancamento] = useState(null)
  const [values, setValues] = useState(null)
  const [errors, setErrors] = useState({})
  const [detailError, setDetailError] = useState(null)
  const [apiError, setApiError] = useState('')
  const [replacementError, setReplacementError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const submission = useRef(createSingleFlight())

  useEffect(() => {
    const controller = new AbortController()

    if (!recordId) return () => controller.abort()

    obterLancamento(recordId, { signal: controller.signal })
      .then((data) => {
        setLancamento(data)
        setValues(createSubstituicaoValues(data))
        setDetailError(null)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetailError(error)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [recordId, reloadKey])

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setApiError('')
  }

  function handleReview(event) {
    event.preventDefault()
    const nextErrors = validateSubstituicaoValues(values)
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) setIsReviewOpen(true)
  }

  async function handleConfirm() {
    await submission.current.run(async () => {
      setIsSubmitting(true)
      setApiError('')
      setReplacementError(null)

      try {
        await submitSubstituicaoValues(recordId, values, {
          substituirLancamento,
          onCreated: (id) => onNavigate('faturamento-detalhes', id),
        })
        setIsReviewOpen(false)
      } catch (error) {
        setIsReviewOpen(false)

        if (error.status === 404 || error.status === 409) {
          setReplacementError(error)
        } else {
          setApiError(replacementErrorMessage(error))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  function retryDetail() {
    setIsLoading(true)
    setDetailError(null)
    setReloadKey((value) => value + 1)
  }

  if (!recordId || detailError?.status === 404) {
    return <RecordNotFound label="Lançamento" onBack={() => onNavigate('faturamentos')} />
  }

  if (isLoading) {
    return (
      <div className="form-page form-page-wide p-4 text-center" role="status">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Carregando lançamento...
      </div>
    )
  }

  if (detailError) {
    return (
      <div className="form-page form-page-wide">
        <PageHeader title="Falha ao carregar lançamento" description={detailError.message} />
        <button className="btn btn-outline-danger" type="button" onClick={retryDetail}>Tentar novamente</button>
      </div>
    )
  }

  if (replacementError || lancamento.status !== 'ATIVO') {
    const message = replacementError
      ? replacementErrorMessage(replacementError)
      : 'Este lançamento já foi substituído e não permite uma nova substituição.'

    return (
      <div className="form-page form-page-wide">
        <button className="detail-back" type="button" onClick={() => onNavigate('faturamento-detalhes', recordId)}>← Voltar ao detalhe</button>
        <PageHeader title="Substituição indisponível" description={message} />
        <div className="alert alert-warning" role="alert">
          Consulte o detalhe atualizado para navegar até o lançamento substituto.
        </div>
        <button className="btn btn-primary" type="button" onClick={() => onNavigate('faturamento-detalhes', recordId)}>Ver detalhe atualizado</button>
      </div>
    )
  }

  if (!values) return null

  return (
    <div className="form-page form-page-wide">
      <button className="detail-back" type="button" onClick={() => onNavigate('faturamento-detalhes', recordId)}>← Voltar ao detalhe</button>
      <PageHeader title="Substituir lançamento" description="Crie um novo registro sem alterar ou excluir o lançamento original." action={<StatusBadge status={lancamento.status} />} />

      <section className="form-card" aria-labelledby="substituicao-form-title">
        <div className="form-card-header">
          <div><h2 id="substituicao-form-title">Dados do lançamento substituto</h2><p>A empresa permanece a mesma. Revise os demais dados e informe o motivo.</p></div>
          <span className="required-note"><span className="required-mark">*</span> Campos obrigatórios</span>
        </div>
        <div className="form-card-body">
          <form noValidate onSubmit={handleReview}>
            <FormFeedback message={apiError} type="danger" />

            <fieldset className="form-section" disabled={isSubmitting}>
              <legend>Identificação</legend>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="substituicao-empresa">Empresa</label>
                  <input className="form-control" id="substituicao-empresa" readOnly value={`${lancamento.empresa.nome} — ${formatCnpj(lancamento.empresa.cnpj)}`} />
                  <div className="form-text">A empresa não pode ser alterada durante uma substituição.</div>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="substituicao-categoria">Categoria</label>
                  <input className="form-control" id="substituicao-categoria" readOnly value={lancamento.categoria.nome} />
                  <div className="form-text">{lancamento.tipo_lancamento === 'COM_RT' ? 'Com RT' : 'Normal'} — a categoria e o tipo não podem ser alterados durante uma substituição.</div>
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section" disabled={isSubmitting}>
              <legend>Dados corrigidos</legend>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="substituicao-data">Mês de referência <span className="required-mark">*</span></label>
                  <input className={`form-control ${errors.data_referencia ? 'is-invalid' : ''}`} id="substituicao-data" onChange={(event) => updateField('data_referencia', referenceDateFromMonth(event.target.value))} type="month" value={values.data_referencia.slice(0, 7)} />
                  {errors.data_referencia && <div className="invalid-feedback">{errors.data_referencia}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="substituicao-valor">Valor <span className="required-mark">*</span></label>
                  <MoneyInput id="substituicao-valor" invalid={Boolean(errors.valor)} onChange={(value) => updateField('valor', value)} value={values.valor} />
                  {errors.valor && <div className="invalid-feedback">{errors.valor}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="substituicao-imposto">% de imposto <span className="required-mark">*</span></label>
                  <div className="input-group">
                    <PercentageInput id="substituicao-imposto" invalid={Boolean(errors.percentual_imposto)} onChange={(value) => updateField('percentual_imposto', value)} value={values.percentual_imposto} />
                    <span className="input-group-text">%</span>
                    {errors.percentual_imposto && <div className="invalid-feedback">{errors.percentual_imposto}</div>}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="substituicao-observacao">Observação <span className="optional-label">Opcional</span></label>
                  <textarea className="form-control" id="substituicao-observacao" onChange={(event) => updateField('observacao', event.target.value)} rows="4" value={values.observacao} />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="substituicao-motivo">Motivo da substituição <span className="required-mark">*</span></label>
                  <textarea className={`form-control ${errors.motivo_substituicao ? 'is-invalid' : ''}`} id="substituicao-motivo" onChange={(event) => updateField('motivo_substituicao', event.target.value)} placeholder="Explique por que este lançamento está sendo substituído" rows="3" value={values.motivo_substituicao} />
                  {errors.motivo_substituicao && <div className="invalid-feedback">{errors.motivo_substituicao}</div>}
                </div>
              </div>
            </fieldset>

            <FormActions isSubmitting={isSubmitting} onCancel={() => onNavigate('faturamento-detalhes', recordId)} submitLabel="Revisar substituição" submittingLabel="Substituindo..." />
          </form>
        </div>
      </section>

      <ConfirmModal confirmLabel="Confirmar substituição" isOpen={isReviewOpen} isSubmitting={isSubmitting} onClose={() => setIsReviewOpen(false)} onConfirm={handleConfirm} title="Confirmar substituição">
        <dl className="review-list">
          <div><dt>Empresa</dt><dd>{lancamento.empresa.nome}</dd></div>
          <div><dt>Categoria</dt><dd>{lancamento.categoria.nome}</dd></div>
          <div><dt>Tipo</dt><dd>{lancamento.tipo_lancamento === 'COM_RT' ? 'Com RT' : 'Normal'}</dd></div>
          <div><dt>Mês de referência</dt><dd>{formatReferenceMonth(values.data_referencia)}</dd></div>
          <div><dt>Novo valor</dt><dd>{formatCurrencyFromCents(values.valor)}</dd></div>
          <div><dt>Percentual de imposto</dt><dd>{formatPercentage(values.percentual_imposto)}</dd></div>
          <div><dt>Observação</dt><dd>{values.observacao.trim() || '—'}</dd></div>
          <div><dt>Motivo</dt><dd>{values.motivo_substituicao.trim()}</dd></div>
        </dl>
        <div className="alert alert-warning mb-0" role="note">O lançamento original será preservado com status Substituído.</div>
      </ConfirmModal>
    </div>
  )
}

export default SubstituirFaturamento
