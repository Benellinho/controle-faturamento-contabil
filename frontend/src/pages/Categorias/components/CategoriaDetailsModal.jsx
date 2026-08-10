import DetailItem from '../../../components/details/DetailItem'
import StatusBadge from '../../../components/table/StatusBadge'
import { formatDateTime } from '../../../utils/formatters'

function CategoriaDetailsModal({ categoria, onClose }) {
  if (!categoria) return null

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="categoria-details-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header align-items-start">
              <div><span className="detail-eyebrow">Categoria</span><h2 className="modal-title fs-5 mt-1" id="categoria-details-title">{categoria.nome}</h2></div>
              <button className="btn-close" type="button" onClick={onClose} aria-label="Fechar" />
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-end mb-4"><StatusBadge status={categoria.ativa ? 'ATIVA' : 'INATIVA'} /></div>
              <div className="row g-4">
                <DetailItem className="col-12" label="Nome" value={categoria.nome} />
                <DetailItem className="col-12" label="Descrição" value={categoria.descricao || '—'} />
                <DetailItem label="Criada em" value={formatDateTime(categoria.created_at)} />
                <DetailItem label="Atualizada em" value={formatDateTime(categoria.updated_at)} />
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={onClose}>Fechar</button></div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}

export default CategoriaDetailsModal
