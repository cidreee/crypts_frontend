import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Payment, PaymentPayload } from "../../types/payment";
import {
  getTodayLocalDate,
  toDateInputValue,
} from "../../utils/date";
import { validatePaymentValues } from "../../utils/paymentValidation";
import PaymentFields from "./PaymentFields";

type PaymentFormProps = {
  payment?: Payment | null;
  cryptId?: number;
  paidByClientId?: number | null;
  saving?: boolean;
  maxAmount?: number | null;
  serverError?: string;
  onSubmit: (payment: PaymentPayload) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
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
    paymentDate: toDateInputValue(payment.paymentDate),
  };
}

function PaymentForm({
  payment,
  cryptId,
  paidByClientId,
  saving = false,
  maxAmount,
  serverError = "",
  onSubmit,
  onCancel,
  onDirtyChange,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>(() =>
    getPaymentFormData(payment)
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(getPaymentFormData(payment));
    setFormError("");
  }, [payment]);

  useEffect(() => {
    onDirtyChange?.(
      JSON.stringify(formData) !== JSON.stringify(getPaymentFormData(payment))
    );
  }, [formData, onDirtyChange, payment]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError("");
  };

  const fillMaxAmount = () => {
    if (maxAmount == null) return;

    setFormData((prev) => ({
      ...prev,
      amount: maxAmount.toString(),
    }));
  };

  const validateForm = () => {
    return validatePaymentValues(formData, {
      maxAmount,
      amountRequiredMessage: "El monto es obligatorio.",
      invalidAmountMessage: "El monto debe ser un número válido.",
      positiveAmountMessage: "El monto debe ser mayor a 0.",
      decimalsMessage: "El monto no puede tener más de 2 decimales.",
      maxAmountMessage: `El monto no puede ser mayor al saldo pendiente: ${maxAmount}.`,
      dateRequiredMessage: "La fecha de pago es obligatoria.",
      futureDateMessage: "La fecha de pago no puede ser futura.",
      methodRequiredMessage: "Selecciona un método de pago.",
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (saving) return;

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const finalCryptId = payment?.cryptId ?? cryptId;
    const finalPaidByClientId = payment?.paidByClientId ?? paidByClientId;

    if (!finalCryptId) {
      setFormError("No se encontró la cripta para registrar el pago.");
      return;
    }

    if (!finalPaidByClientId) {
      setFormError("No se encontrÃ³ el cliente actual de la cripta.");
      return;
    }

    await onSubmit({
      id: payment?.id,
      cryptId: finalCryptId,
      paidByClientId: finalPaidByClientId,
      amount: Number(formData.amount),
      paymentMethodId: Number(formData.paymentMethodId),
      paymentDate: formData.paymentDate,
      isActive: payment?.isActive ?? true,
    });
  };

  const visibleError = formError || serverError;

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {visibleError && <p className="error-message">{visibleError}</p>}

      <PaymentFields
        idPrefix="payment"
        amountLabel="Monto"
        helperLabel="Pendiente por pagar"
        shortcutLabel="Pagar todo"
        amount={formData.amount}
        paymentDate={formData.paymentDate}
        paymentMethodId={formData.paymentMethodId}
        maxAmount={maxAmount}
        disabled={saving}
        onChange={handleChange}
        onAmountShortcut={fillMaxAmount}
      />

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
