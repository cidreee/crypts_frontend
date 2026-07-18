import Modal from "./Modal";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmClassName = "btn-primary",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      closeDisabled={confirming}
    >
      <p className="confirm-message">{message}</p>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={confirming}
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          className={confirmClassName}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming ? "Procesando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
