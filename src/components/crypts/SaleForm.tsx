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
type BeneficiaryMode = "none" | "existing" | "new";
type InitialPaymentPayload = Omit<PaymentPayload, "paidByClientId">;

export type SaleDetails = {
  beneficiary?: ClientPayload;
  beneficiaryId?: number | null;
  title?: string | null;
  plateText?: string | null;
};

type SaleFormProps = {
  clients: Client[];
  saving?: boolean;
  maxInitialPayment?: number | null;
  onSubmit: (
    mode: SaleMode,
    clientData: number | ClientPayload,
    initialPayment: InitialPaymentPayload,
    saleDetails: SaleDetails
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
  alternatePhoneCountryCode: PhoneCountryCode;
  alternatePhoneNumber: string;
  beneficiaryMode: BeneficiaryMode;
  beneficiaryId: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  beneficiaryPhoneCountryCode: PhoneCountryCode;
  beneficiaryPhoneNumber: string;
  beneficiaryAlternatePhoneCountryCode: PhoneCountryCode;
  beneficiaryAlternatePhoneNumber: string;
  title: string;
  plateText: string;
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
    alternatePhoneCountryCode: "+52",
    alternatePhoneNumber: "",
    beneficiaryMode: "none",
    beneficiaryId: firstClientId,
    beneficiaryFirstName: "",
    beneficiaryLastName: "",
    beneficiaryPhoneCountryCode: "+52",
    beneficiaryPhoneNumber: "",
    beneficiaryAlternatePhoneCountryCode: "+52",
    beneficiaryAlternatePhoneNumber: "",
    title: "",
    plateText: "",
    amount: "",
    paymentMethodId: "1",
    paymentDate: getTodayLocalDate(),
  };
}

function RequiredMark() {
  return (
    <span className="required-mark" title="Obligatorio">
      *
    </span>
  );
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
          beneficiaryMode:
            prev.beneficiaryMode === "existing" ? "none" : prev.beneficiaryMode,
          beneficiaryId: "",
        };
      }

      return {
        ...prev,
        clientId: prev.clientId || clients[0].id?.toString() || "",
        beneficiaryId:
          prev.beneficiaryId || clients[0].id?.toString() || "",
      };
    });
  }, [clients]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormError("");

    if (
      name === "phoneNumber" ||
      name === "alternatePhoneNumber" ||
      name === "beneficiaryPhoneNumber" ||
      name === "beneficiaryAlternatePhoneNumber"
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: onlyDigits(value),
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

    if (name === "beneficiaryMode") {
      const selectedMode = value as BeneficiaryMode;

      setFormData((prev) => ({
        ...prev,
        beneficiaryMode: selectedMode,
        beneficiaryId:
          selectedMode === "existing" ? clients[0]?.id?.toString() ?? "" : "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "phoneCountryCode" ||
        name === "alternatePhoneCountryCode" ||
        name === "beneficiaryPhoneCountryCode" ||
        name === "beneficiaryAlternatePhoneCountryCode"
          ? (value as PhoneCountryCode)
          : value,
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
      return Number(formData.clientId) ? "" : "Selecciona un cliente.";
    }

    if (!formData.firstName.trim()) {
      return "El nombre del cliente es obligatorio.";
    }

    if (!formData.lastName.trim()) {
      return "El apellido del cliente es obligatorio.";
    }

    const phoneError = validatePhoneNumber(formData);

    if (phoneError) {
      return phoneError;
    }

    return validatePhoneNumber({
      phoneCountryCode: formData.alternatePhoneCountryCode,
      phoneNumber: formData.alternatePhoneNumber,
    });
  };

  const validateBeneficiaryData = () => {
    if (formData.beneficiaryMode === "none") return "";

    if (formData.beneficiaryMode === "existing") {
      return Number(formData.beneficiaryId)
        ? ""
        : "Selecciona un beneficiario.";
    }

    if (!formData.beneficiaryFirstName.trim()) {
      return "El nombre del beneficiario es obligatorio.";
    }

    if (!formData.beneficiaryLastName.trim()) {
      return "El apellido del beneficiario es obligatorio.";
    }

    const phoneError = validatePhoneNumber({
      phoneCountryCode: formData.beneficiaryPhoneCountryCode,
      phoneNumber: formData.beneficiaryPhoneNumber,
    });

    if (phoneError) {
      return phoneError;
    }

    return validatePhoneNumber({
      phoneCountryCode: formData.beneficiaryAlternatePhoneCountryCode,
      phoneNumber: formData.beneficiaryAlternatePhoneNumber,
    });
  };

  const validateInitialPayment = () => {
    return validatePaymentValues(formData, {
      maxAmount: maxInitialPayment,
      amountRequiredMessage: "Ingresa el monto del pago inicial.",
      invalidAmountMessage:
        "El monto del pago inicial debe ser un numero valido.",
      positiveAmountMessage: "El monto del pago inicial debe ser mayor a 0.",
      decimalsMessage:
        "El monto del pago inicial no puede tener mas de 2 decimales.",
      maxAmountMessage: "El pago inicial no puede ser mayor al costo de la cripta.",
      dateRequiredMessage: "Selecciona la fecha del pago inicial.",
      futureDateMessage: "La fecha del pago inicial no puede ser futura.",
      methodRequiredMessage: "Selecciona el metodo de pago.",
    });
  };

  const buildInitialPayment = (): InitialPaymentPayload => {
    return {
      cryptId: 0,
      amount: Number(formData.amount),
      paymentMethodId: Number(formData.paymentMethodId),
      paymentDate: formData.paymentDate,
      isActive: true,
    };
  };

  const buildSaleDetails = (): SaleDetails => {
    const title = formData.title.trim();
    const plateText = formData.plateText.trim();

    return {
      beneficiaryId:
        formData.beneficiaryMode === "existing"
          ? Number(formData.beneficiaryId)
          : null,
      beneficiary:
        formData.beneficiaryMode === "new"
          ? {
              firstName: formData.beneficiaryFirstName.trim(),
              lastName: formData.beneficiaryLastName.trim(),
              phoneNumber: buildPhoneNumber({
                phoneCountryCode: formData.beneficiaryPhoneCountryCode,
                phoneNumber: formData.beneficiaryPhoneNumber,
              }),
              alternatePhoneNumber: buildPhoneNumber({
                phoneCountryCode: formData.beneficiaryAlternatePhoneCountryCode,
                phoneNumber: formData.beneficiaryAlternatePhoneNumber,
              }),
              isActive: true,
            }
          : undefined,
      title: title || null,
      plateText: plateText || null,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (saving) return;

    if (!formData.plateText.trim()) {
      setFormError("El texto de placa es obligatorio.");
      return;
    }

    const clientValidationMessage = validateClientData();

    if (clientValidationMessage) {
      setFormError(clientValidationMessage);
      return;
    }

    const beneficiaryValidationMessage = validateBeneficiaryData();

    if (beneficiaryValidationMessage) {
      setFormError(beneficiaryValidationMessage);
      return;
    }

    const paymentValidationMessage = validateInitialPayment();

    if (paymentValidationMessage) {
      setFormError(paymentValidationMessage);
      return;
    }

    const initialPayment = buildInitialPayment();
    const saleDetails = buildSaleDetails();

    if (formData.mode === "existing") {
      onSubmit("existing", Number(formData.clientId), initialPayment, saleDetails);
      return;
    }

    onSubmit(
      "new",
      {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: buildPhoneNumber(formData),
        alternatePhoneNumber: buildPhoneNumber({
          phoneCountryCode: formData.alternatePhoneCountryCode,
          phoneNumber: formData.alternatePhoneNumber,
        }),
        isActive: true,
      },
      initialPayment,
      saleDetails
    );
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <fieldset className="form-section">
        <legend>Cliente</legend>

        <div className="form-group form-group-full">
          <label htmlFor="sale-client-mode">
            Tipo de cliente <RequiredMark />
          </label>

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
          <div className="form-mode-panel form-mode-panel-full">
            <div className="form-mode-panel-title">Cliente existente</div>

            <div className="form-group form-group-full">
            <label htmlFor="sale-client-id">
              Cliente <RequiredMark />
            </label>

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
          </div>
        )}

        {formData.mode === "new" && (
          <div className="form-mode-panel form-mode-panel-full">
            <div className="form-mode-panel-title">Datos del cliente nuevo</div>

            <div className="form-group">
              <label htmlFor="sale-first-name">
                Nombre <RequiredMark />
              </label>
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
              <label htmlFor="sale-last-name">
                Apellido <RequiredMark />
              </label>
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
              <label htmlFor="sale-phone-number">
                Celular <RequiredMark />
              </label>

              <div className="phone-input-group">
                <select
                  name="phoneCountryCode"
                  value={formData.phoneCountryCode}
                  onChange={handleChange}
                  disabled={saving}
                  aria-label="Codigo de pais"
                >
                  <option value="+52">+52 Mexico</option>
                  <option value="+1">+1 USA/Canada</option>
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
                  required
                />
              </div>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="sale-alternate-phone-number">
                Segundo celular opcional
              </label>

              <div className="phone-input-group">
                <select
                  name="alternatePhoneCountryCode"
                  value={formData.alternatePhoneCountryCode}
                  onChange={handleChange}
                  disabled={saving}
                  aria-label="Codigo de pais del segundo telefono"
                >
                  <option value="+52">+52 Mexico</option>
                  <option value="+1">+1 USA/Canada</option>
                </select>

                <input
                  type="tel"
                  id="sale-alternate-phone-number"
                  name="alternatePhoneNumber"
                  value={formData.alternatePhoneNumber}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="4491234567"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Beneficiario</legend>

        <div className="form-group form-group-full">
          <label htmlFor="sale-beneficiary-mode">Tipo de beneficiario</label>
          <select
            id="sale-beneficiary-mode"
            name="beneficiaryMode"
            value={formData.beneficiaryMode}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="none">Sin beneficiario</option>
            {clients.length > 0 && (
              <option value="existing">Beneficiario existente</option>
            )}
            <option value="new">Beneficiario nuevo</option>
          </select>
        </div>

        {formData.beneficiaryMode === "existing" && (
          <div className="form-mode-panel form-mode-panel-full">
            <div className="form-mode-panel-title">Beneficiario existente</div>

            <div className="form-group form-group-full">
            <label htmlFor="sale-beneficiary-id">
              Beneficiario <RequiredMark />
            </label>

            <select
              id="sale-beneficiary-id"
              name="beneficiaryId"
              value={formData.beneficiaryId}
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
          </div>
        )}

        {formData.beneficiaryMode === "new" && (
          <div className="form-mode-panel form-mode-panel-full">
            <div className="form-mode-panel-title">
              Datos del beneficiario nuevo
            </div>

            <div className="form-group">
              <label htmlFor="sale-beneficiary-first-name">
                Nombre <RequiredMark />
              </label>
              <input
                type="text"
                id="sale-beneficiary-first-name"
                name="beneficiaryFirstName"
                value={formData.beneficiaryFirstName}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sale-beneficiary-last-name">
                Apellido <RequiredMark />
              </label>
              <input
                type="text"
                id="sale-beneficiary-last-name"
                name="beneficiaryLastName"
                value={formData.beneficiaryLastName}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="sale-beneficiary-phone-number">
                Celular <RequiredMark />
              </label>

              <div className="phone-input-group">
                <select
                  name="beneficiaryPhoneCountryCode"
                  value={formData.beneficiaryPhoneCountryCode}
                  onChange={handleChange}
                  disabled={saving}
                  aria-label="Codigo de pais del beneficiario"
                >
                  <option value="+52">+52 Mexico</option>
                  <option value="+1">+1 USA/Canada</option>
                </select>

                <input
                  type="tel"
                  id="sale-beneficiary-phone-number"
                  name="beneficiaryPhoneNumber"
                  value={formData.beneficiaryPhoneNumber}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="4491234567"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="sale-beneficiary-alternate-phone-number">
                Segundo celular opcional
              </label>

              <div className="phone-input-group">
                <select
                  name="beneficiaryAlternatePhoneCountryCode"
                  value={formData.beneficiaryAlternatePhoneCountryCode}
                  onChange={handleChange}
                  disabled={saving}
                  aria-label="Codigo de pais del segundo telefono del beneficiario"
                >
                  <option value="+52">+52 Mexico</option>
                  <option value="+1">+1 USA/Canada</option>
                </select>

                <input
                  type="tel"
                  id="sale-beneficiary-alternate-phone-number"
                  name="beneficiaryAlternatePhoneNumber"
                  value={formData.beneficiaryAlternatePhoneNumber}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="4491234567"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Datos de la cripta</legend>

        <div className="form-group">
          <label htmlFor="sale-title">Numero de titulo</label>
          <input
            type="text"
            id="sale-title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={saving}
            placeholder="Sin titulo entregado"
            maxLength={120}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sale-plate-text">
            Texto de placa <RequiredMark />
          </label>
          <input
            type="text"
            id="sale-plate-text"
            name="plateText"
            value={formData.plateText}
            onChange={handleChange}
            disabled={saving}
            placeholder="Nombre para la placa"
            maxLength={180}
            required
          />
        </div>
      </fieldset>

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
