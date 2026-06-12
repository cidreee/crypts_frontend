import { useEffect, useState } from "react";
import { PAYMENT_METHODS } from "../../constants/paymentMethods";
import type { Payment, PaymentPayload } from "../../types/payment";
import { getTodayLocalDate, isFutureDate } from "../../utils/date";
import { hasMoreThanTwoDecimals } from "../../utils/number";

type PaymentFormProps = {
  payment?: Payment | null;
  cryptId?: number;
  saving?: boolean;
  maxAmount?: number | null;
  onSubmit: (payment: PaymentPayload) => void;
  onCancel: () => void;
};

type PaymentFormData = {
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

function getPaymentFormData(payment?: Payment | null): PaymentFormData {
  if (!payment) {
    return {
      amount: "",
      paymentMethodId: "1",
      paymentDate: getTodayLocalDate(),
    };
  }

  return {
    amount: payment.amount.toString(),
    paymentMethodId: payment.paymentMethodId.toString(),
    paymentDate: payment.paymentDate,
  };
}

function PaymentForm({
  payment,
  cryptId,
  saving = false,
  maxAmount,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>(() =>
    getPaymentFormData(payment)
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(getPaymentFormData(payment));
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

    if (hasMoreThanTwoDecimals(formData.amount)) {
      return "El monto no puede tener más de 2 decimales.";
    }

    if (maxAmount != null && amount > maxAmount) {
      return "El monto no puede ser mayor al saldo pendiente.";
    }

    if (!formData.paymentDate) {
      return "La fecha de pago es obligatoria.";
    }

    if (isFutureDate(formData.paymentDate)) {
      return "La fecha de pago no puede ser futura.";
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

    const paymentToSubmit: PaymentPayload = {
      id: payment?.id,
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
          max={maxAmount ?? undefined}
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
          max={getTodayLocalDate()}
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
          {PAYMENT_METHODS.map((paymentMethod) => (
            <option key={paymentMethod.id} value={paymentMethod.id}>
              {paymentMethod.label}
            </option>
          ))}
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
