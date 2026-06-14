import { useEffect, useState } from "react";
import { PAYMENT_METHODS } from "../../constants/paymentMethods";
import type { Client, ClientPayload } from "../../types/client";
import type { PaymentPayload } from "../../types/payment";
import {
  buildPhoneNumber,
  onlyDigits,
  validatePhoneNumber,
  type PhoneCountryCode,
} from "../../utils/phone";
import { getTodayLocalDate, isFutureDate } from "../../utils/date";
import { hasMoreThanTwoDecimals } from "../../utils/number";

type SaleMode = "existing" | "new";

type SaleFormProps = {
  clients: Client[];
  saving?: boolean;
  maxInitialPayment?: number | null;
  onSubmit: (
    mode: SaleMode,
    clientData: number | ClientPayload,
    initialPayment?: PaymentPayload
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
  hasInitialPayment: boolean;
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

function getTodayDate() {
  return getTodayLocalDate();
}

function getInitialFormData(clients: Client[]): SaleFormData {
  const firstClientId = clients[0]?.id?.toString() ?? "";

  return {
    mode: firstClientId ? "existing" : "new",
    clientId: firstClientId,
    firstName: "",
    lastName: "",
    phoneCountryCode: "+52",
    phoneNumber: "",
    hasInitialPayment: false,
    amount: "",
    paymentMethodId: "1",
    paymentDate: getTodayDate(),
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
        mode: prev.mode,
        clientId: clients[0].id?.toString() ?? "",
      };
    });
  }, [clients]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormError("");

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

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
    if (!formData.hasInitialPayment) {
      return "";
    }

    const amount = Number(formData.amount);

    if (!formData.amount.trim()) {
      return "Ingresa el monto del pago inicial.";
    }

    if (Number.isNaN(amount)) {
      return "El monto del pago inicial debe ser un número válido.";
    }

    if (amount <= 0) {
      return "El monto del pago inicial debe ser mayor a 0.";
    }

    if (hasMoreThanTwoDecimals(formData.amount)) {
      return "El monto del pago inicial no puede tener más de 2 decimales.";
    }

    if (maxInitialPayment != null && amount > maxInitialPayment) {
      return "El pago inicial no puede ser mayor al costo de la cripta.";
    }

    if (!formData.paymentDate) {
      return "Selecciona la fecha del pago inicial.";
    }

    if (isFutureDate(formData.paymentDate)) {
      return "La fecha del pago inicial no puede ser futura.";
    }

    if (!formData.paymentMethodId) {
      return "Selecciona el método de pago.";
    }

    return "";
  };

  const buildInitialPayment = (): PaymentPayload | undefined => {
    if (!formData.hasInitialPayment) {
      return undefined;
    }

    return {
      cryptId: 0,
      amount: Number(formData.amount),
      paymentMethodId: Number(formData.paymentMethodId),
      paymentDate: formData.paymentDate,
      isActive: true,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const newClient: ClientPayload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: buildPhoneNumber(formData),
      isActive: true,
    };

    onSubmit("new", newClient, initialPayment);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group form-group-full">
        <label>Tipo de cliente</label>

        <select
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
          <label>Cliente</label>

          <select
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
            <label>Nombre</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={saving}
              required={formData.mode === "new"}
            />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={saving}
              required={formData.mode === "new"}
            />
          </div>

          <div className="form-group form-group-full">
            <label>Celular</label>

            <div className="phone-input-group">
              <select
                name="phoneCountryCode"
                value={formData.phoneCountryCode}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="+52">+52 México</option>
                <option value="+1">+1 USA/Canadá</option>
              </select>

              <input
                type="tel"
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

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="hasInitialPayment"
            checked={formData.hasInitialPayment}
            onChange={handleChange}
            disabled={saving}
          />
          Registrar pago inicial
        </label>
      </div>

      {formData.hasInitialPayment && (
        <>
          <div className="form-group">
            <label>Monto del pago inicial</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              max={maxInitialPayment ?? undefined}
              step="0.01"
              disabled={saving}
              required={formData.hasInitialPayment}
            />
          </div>

          <div className="form-group">
            <label>Fecha de pago</label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              max={getTodayDate()}
              disabled={saving}
              required={formData.hasInitialPayment}
            />
          </div>

          <div className="form-group">
            <label>Método de pago</label>
            <select
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleChange}
              disabled={saving}
              required={formData.hasInitialPayment}
            >
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod.id} value={paymentMethod.id}>
                  {paymentMethod.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

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
