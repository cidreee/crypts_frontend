import { useEffect, useState } from "react";
import type { Client } from "../../types/client";
import type { Payment } from "../../types/payment";

type SaleFormProps = {
  clients: Client[];
  saving?: boolean;
  onSubmit: (
    mode: "existing" | "new",
    clientData: number | Client,
    initialPayment?: Payment
  ) => void;
  onCancel: () => void;
};

type SaleFormData = {
  mode: "existing" | "new";

  clientId: string;

  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phoneNumber: string;

  hasInitialPayment: boolean;
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

function SaleForm({
  clients,
  saving = false,
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const [formData, setFormData] = useState<SaleFormData>({
    mode: clients.length > 0 ? "existing" : "new",

    clientId: "",

    firstName: "",
    lastName: "",
    phoneCountryCode: "+52",
    phoneNumber: "",

    hasInitialPayment: false,
    amount: "",
    paymentMethodId: "1",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (clients.length === 0) {
      setFormData((prev) => ({
        ...prev,
        mode: "new",
        clientId: "",
      }));

      return;
    }

    if (!formData.clientId) {
      setFormData((prev) => ({
        ...prev,
        mode: prev.mode,
        clientId: clients[0].id?.toString() ?? "",
      }));
    }
  }, [clients, formData.clientId]);

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
      const onlyNumbers = value.replace(/\D/g, "");

      setFormData((prev) => ({
        ...prev,
        phoneNumber: onlyNumbers,
      }));

      return;
    }

    if (name === "mode") {
      const selectedMode = value as "existing" | "new";

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
      [name]: value,
    }));
  };

  const buildPhoneNumber = () => {
    if (!formData.phoneNumber.trim()) {
      return null;
    }

    return `${formData.phoneCountryCode}${formData.phoneNumber}`;
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

    if (formData.phoneNumber.trim() !== "") {
      if (
        formData.phoneCountryCode === "+52" &&
        formData.phoneNumber.length !== 10
      ) {
        return "El número celular de México debe tener 10 dígitos.";
      }

      if (
        formData.phoneCountryCode === "+1" &&
        formData.phoneNumber.length !== 10
      ) {
        return "El número de Estados Unidos/Canadá debe tener 10 dígitos.";
      }
    }

    return "";
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

    if (!formData.paymentDate) {
      return "Selecciona la fecha del pago inicial.";
    }

    if (!formData.paymentMethodId) {
      return "Selecciona el método de pago.";
    }

    return "";
  };

  const buildInitialPayment = (): Payment | undefined => {
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
      const clientId = Number(formData.clientId);
      onSubmit("existing", clientId, initialPayment);
      return;
    }

    const newClient: Client = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: buildPhoneNumber(),
      isActive: true,
    };

    onSubmit("new", newClient, initialPayment);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
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
        <div className="form-group">
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

          <div className="form-group">
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
              <option value="1">Cash</option>
              <option value="2">Electronic funds transfer</option>
              <option value="3">Credit card</option>
              <option value="4">Debit card</option>
              <option value="5">Check</option>
              <option value="6">To be defined</option>
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