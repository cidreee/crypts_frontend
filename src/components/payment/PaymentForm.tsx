import { useEffect, useState } from "react";
import type { Payment } from "../../types/payment";

type PaymentFormProps = {
  payment?: Payment | null;
  cryptId?: number;
  saving?: boolean;
  onSubmit: (payment: Payment) => void;
  onCancel: () => void;
};

type PaymentFormData = {
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

function PaymentForm({
  payment,
  cryptId,
  saving = false,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: "",
    paymentMethodId: "1",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount.toString(),
        paymentMethodId: payment.paymentMethodId.toString(),
        paymentDate: payment.paymentDate,
      });
    } else {
      setFormData({
        amount: "",
        paymentMethodId: "1",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }

    setFormError("");
  }, [payment]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const amount = Number(formData.amount);

    if (!formData.amount.trim()) {
      return "El monto es obligatorio.";
    }

    if (Number.isNaN(amount)) {
      return "El monto debe ser un número válido.";
    }

    if (amount <= 0) {
      return "El monto debe ser mayor a 0.";
    }

    if (!formData.paymentDate) {
      return "La fecha de pago es obligatoria.";
    }

    if (!formData.paymentMethodId) {
      return "Selecciona un método de pago.";
    }

    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const finalCryptId = payment?.cryptId ?? cryptId;

    if (!finalCryptId) {
      setFormError("No se encontró la cripta para registrar el pago.");
      return;
    }

    const paymentToSubmit: Payment = {
      ...payment,
      cryptId: finalCryptId,
      amount: Number(formData.amount),
      paymentMethodId: Number(formData.paymentMethodId),
      paymentDate: formData.paymentDate,
      isActive: payment?.isActive ?? true,
    };

    onSubmit(paymentToSubmit);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
        <label>Monto</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>Fecha de pago</label>
        <input
          type="date"
          name="paymentDate"
          value={formData.paymentDate}
          onChange={handleChange}
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>Método de pago</label>
        <select
          name="paymentMethodId"
          value={formData.paymentMethodId}
          onChange={handleChange}
          disabled={saving}
          required
        >
          <option value="1">Cash</option>
          <option value="2">Electronic funds transfer</option>
          <option value="3">Credit card</option>
          <option value="4">Debit card</option>
          <option value="5">Check</option>
          <option value="6">To be defined</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar pago"}
        </button>
      </div>
    </form>
  );
}

export default PaymentForm;