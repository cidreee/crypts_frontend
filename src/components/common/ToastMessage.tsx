type ToastMessageProps = {
  type: "success" | "error";
  message?: string;
  onClose?: () => void;
};

function ToastMessage({ type, message, onClose }: ToastMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`toast-message toast-message-${type}`} role="status">
      <span>{message}</span>

      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar mensaje">
          x
        </button>
      )}
    </div>
  );
}

export default ToastMessage;
