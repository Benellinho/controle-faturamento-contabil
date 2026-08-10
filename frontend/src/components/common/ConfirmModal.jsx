function ConfirmModal({ children, isOpen, onClose, onConfirm, isSubmitting, title, confirmLabel = 'Confirmar' }) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5" id="confirm-modal-title">{title}</h2>
              <button className="btn-close" disabled={isSubmitting} type="button" onClick={onClose} aria-label="Fechar" />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" disabled={isSubmitting} type="button" onClick={onClose}>Voltar</button>
              <button className="btn btn-primary" disabled={isSubmitting} type="button" onClick={onConfirm}>
                {isSubmitting && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
                {isSubmitting ? 'Confirmando...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}

export default ConfirmModal
