import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Client, ClientPayload } from "../../types/client";
import type { PaymentPayload } from "../../types/payment";
import PaymentFields from "../payment/PaymentFields";
import {
  buildPhoneNumber,
  onlyDigits,
  validatePhoneNumber,
  type PhoneCountryCode,
} from "../../utils/phone";
import { getTodayLocalDate } from "../../utils/date";
import { validatePaymentValues } from "../../utils/paymentValidation";

type SaleMode = "existing" | "new";

type SaleFormProps = {
  clients: Client[];
  saving?: boolean;
  maxInitialPayment?: number | null;
  onSubmit: (
    mode: SaleMode,
    clientData: number | ClientPayload,
    initialPayment: PaymentPayload
  ) => void;
  onCancel: () => void;
};

type SaleFormData = {
  mode: SaleMode;
  clientId: string;
  firstName: string;
  lastName: string;
  phoneCountryCode: PhoneCountryCode;
  phoneNumber: string;
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

function getInitialFormData(clients: Client[]): SaleFormData {
  const firstClientId = clients[0]?.id?.toString() ?? "";

  return {
    mode: firstClientId ? "existing" : "new",
    clientId: firstClientId,
    firstName: "",
    lastName: "",
    phoneCountryCode: "+52",
    phoneNumber: "",
    amount: "",
    paymentMethodId: "1",
    paymentDate: getTodayLocalDate(),
  };
}

function SaleForm({
  clients,
  saving = false,
  maxInitialPayment,
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const [formData, setFormData] = useState<SaleFormData>(() =>
    getInitialFormData(clients)
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData((prev) => {
      if (clients.length === 0) {
        return {
          ...prev,
          mode: "new",
          clientId: "",
        };
      }

      if (prev.clientId) {
        return prev;
      }

      return {
        ...prev,
        clientId: clients[0].id?.toString() ?? "",
      };
    });
  }, [clients]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormError("");

    if (name === "phoneNumber") {
      setFormData((prev) => ({
        ...prev,
        phoneNumber: onlyDigits(value),
      }));

      return;
    }

    if (name === "mode") {
      const selectedMode = value as SaleMode;

      setFormData((prev) => ({
        ...prev,
        mode: selectedMode,
        clientId:
          selectedMode === "existing"
            ? clients[0]?.id?.toString() ?? ""
            : "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phoneCountryCode" ? (value as PhoneCountryCode) : value,
    }));
  };

  const fillInitialPayment = () => {
    if (maxInitialPayment == null) return;

    setFormData((prev) => ({
      ...prev,
      amount: maxInitialPayment.toString(),
    }));
  };

  const validateClientData = () => {
    if (formData.mode === "existing") {
      const clientId = Number(formData.clientId);

      if (!clientId) {
        return "Selecciona un cliente.";
      }

      return "";
    }

    if (!formData.firstName.trim()) {
      return "El nombre del cliente es obligatorio.";
    }

    if (!formData.lastName.trim()) {
      return "El apellido del cliente es obligatorio.";
    }

    return validatePhoneNumber(formData);
  };

  const validateInitialPayment = () => {
    return validatePaymentValues(formData, {
      maxAmount: maxInitialPayment,
      amountRequiredMessage: "Ingresa el monto del pago inicial.",
      invalidAmountMessage:
        "El monto del pago inicial debe ser un número válido.",
      positiveAmountMessage: "El monto del pago inicial debe ser mayor a 0.",
      decimalsMessage:
        "El monto del pago inicial no puede tener más de 2 decimales.",
      maxAmountMessage: "El pago inicial no puede ser mayor al costo de la cripta.",
      dateRequiredMessage: "Selecciona la fecha del pago inicial.",
      futureDateMessage: "La fecha del pago inicial no puede ser futura.",
      methodRequiredMessage: "Selecciona el método de pago.",
    });
  };

  const buildInitialPayment = (): PaymentPayload => {
    return {
      cryptId: 0,
      amount: Number(formData.amount),
      paymentMethodId: Number(formData.paymentMethodId),
      paymentDate: formData.paymentDate,
      isActive: true,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (saving) return;

    const clientValidationMessage = validateClientData();

    if (clientValidationMessage) {
      setFormError(clientValidationMessage);
      return;
    }

    const paymentValidationMessage = validateInitialPayment();

    if (paymentValidationMessage) {
      setFormError(paymentValidationMessage);
      return;
    }

    const initialPayment = buildInitialPayment();

    if (formData.mode === "existing") {
      onSubmit("existing", Number(formData.clientId), initialPayment);
      return;
    }

    onSubmit(
      "new",
      {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: buildPhoneNumber(formData),
        isActive: true,
      },
      initialPayment
    );
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group form-group-full">
        <label htmlFor="sale-client-mode">Tipo de cliente</label>

        <select
          id="sale-client-mode"
          name="mode"
          value={formData.mode}
          onChange={handleChange}
          disabled={saving}
        >
          {clients.length > 0 && (
            <option value="existing">Cliente existente</option>
          )}

          <option value="new">Cliente nuevo</option>
        </select>
      </div>

      {formData.mode === "existing" && (
        <div className="form-group form-group-full">
          <label htmlFor="sale-client-id">Cliente</label>

          <select
            id="sale-client-id"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            disabled={saving}
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
                {client.phoneNumber ? ` - ${client.phoneNumber}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.mode === "new" && (
        <>
          <div className="form-group">
            <label htmlFor="sale-first-name">Nombre</label>
            <input
              type="text"
              id="sale-first-name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sale-last-name">Apellido</label>
            <input
              type="text"
              id="sale-last-name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="sale-phone-number">Celular</label>

            <div className="phone-input-group">
              <select
                name="phoneCountryCode"
                value={formData.phoneCountryCode}
                onChange={handleChange}
                disabled={saving}
                aria-label="Código de país"
              >
                <option value="+52">+52 México</option>
                <option value="+1">+1 USA/Canadá</option>
              </select>

              <input
                type="tel"
                id="sale-phone-number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={saving}
                placeholder="4491234567"
                maxLength={10}
              />
            </div>
          </div>
        </>
      )}

      <PaymentFields
        idPrefix="sale"
        amountLabel="Monto a pagar"
        helperLabel="Pendiente por pagar"
        shortcutLabel="Pagar todo"
        amount={formData.amount}
        paymentDate={formData.paymentDate}
        paymentMethodId={formData.paymentMethodId}
        maxAmount={maxInitialPayment}
        disabled={saving}
        onChange={handleChange}
        onAmountShortcut={fillInitialPayment}
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
          {saving ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
    </form>
  );
}

export default SaleForm;
