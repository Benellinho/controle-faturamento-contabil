import { useEffect, useRef } from 'react'

function ConfirmModal({ children, isOpen, onClose, onConfirm, isSubmitting, title, confirmLabel = 'Confirmar' }) {
  const modalRef = useRef(null)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const previouslyFocused = document.activeElement
    cancelButtonRef.current?.focus()

    return () => previouslyFocused?.focus?.()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = [...(modalRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [])]

      if (focusableElements.length === 0) {
        event.preventDefault()
        modalRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="modal d-block" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5" id="confirm-modal-title">{title}</h2>
              <button className="btn-close" disabled={isSubmitting} type="button" onClick={onClose} aria-label="Fechar" />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" ref={cancelButtonRef} disabled={isSubmitting} type="button" onClick={onClose}>Voltar</button>
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
