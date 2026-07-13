import { useEffect, useState } from "react";
import type {
  Client,
  ClientPayload,
  UpdateClientPayload,
} from "../../types/client";
import {
  buildPhoneNumber,
  onlyDigits,
  splitPhoneNumber,
  validatePhoneNumber,
  type PhoneCountryCode,
} from "../../utils/phone";

type ClientFormProps = {
  selectedClient: Client | null;
  saving?: boolean;
  onCreateClient: (client: ClientPayload) => Promise<boolean>;
  onUpdateClient: (id: number, client: UpdateClientPayload) => Promise<boolean>;
  onCancel: () => void;
};

type ClientFormData = {
  firstName: string;
  lastName: string;
  phoneCountryCode: PhoneCountryCode;
  phoneNumber: string;
  alternatePhoneCountryCode: PhoneCountryCode;
  alternatePhoneNumber: string;
};

function RequiredMark() {
  return (
    <span className="required-mark" title="Obligatorio">
      *
    </span>
  );
}

const emptyClientFormData: ClientFormData = {
  firstName: "",
  lastName: "",
  phoneCountryCode: "+52",
  phoneNumber: "",
  alternatePhoneCountryCode: "+52",
  alternatePhoneNumber: "",
};

function getClientFormData(client: Client | null): ClientFormData {
  if (!client) {
    return emptyClientFormData;
  }

  const phone = splitPhoneNumber(client.phoneNumber);
  const alternatePhone = splitPhoneNumber(client.alternatePhoneNumber);

  return {
    firstName: client.firstName,
    lastName: client.lastName,
    phoneCountryCode: phone.phoneCountryCode,
    phoneNumber: phone.phoneNumber,
    alternatePhoneCountryCode: alternatePhone.phoneCountryCode,
    alternatePhoneNumber: alternatePhone.phoneNumber,
  };
}

function ClientForm({
  selectedClient,
  saving = false,
  onCreateClient,
  onUpdateClient,
  onCancel,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(() =>
    getClientFormData(selectedClient)
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(getClientFormData(selectedClient));
    setFormError("");
  }, [selectedClient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber" || name === "alternatePhoneNumber") {
      setFormData((prev) => ({
        ...prev,
        [name]: onlyDigits(value),
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "phoneCountryCode" || name === "alternatePhoneCountryCode"
          ? (value as PhoneCountryCode)
          : value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return "El nombre es obligatorio.";
    }

    if (!formData.lastName.trim()) {
      return "El apellido es obligatorio.";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const clientToSave: UpdateClientPayload = {
      id: selectedClient?.id,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: buildPhoneNumber(formData),
      alternatePhoneNumber: buildPhoneNumber({
        phoneCountryCode: formData.alternatePhoneCountryCode,
        phoneNumber: formData.alternatePhoneNumber,
      }),
      isActive: selectedClient?.isActive ?? true,
      createdAt: selectedClient?.createdAt,
    };

    const success = selectedClient?.id
      ? await onUpdateClient(selectedClient.id, clientToSave)
      : await onCreateClient(clientToSave);

    if (success) {
      onCancel();
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
        <label>
          Nombre <RequiredMark />
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>
          Apellido <RequiredMark />
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          disabled={saving}
          required
        />
      </div>

      <div className="form-group form-group-full">
        <label>
          Celular <RequiredMark />
        </label>

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
            required
          />
        </div>
      </div>

      <div className="form-group form-group-full">
        <label>Segundo celular opcional</label>

        <div className="phone-input-group">
          <select
            name="alternatePhoneCountryCode"
            value={formData.alternatePhoneCountryCode}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="+52">+52 México</option>
            <option value="+1">+1 USA/Canadá</option>
          </select>

          <input
            type="tel"
            name="alternatePhoneNumber"
            value={formData.alternatePhoneNumber}
            onChange={handleChange}
            disabled={saving}
            placeholder="4491234567"
            maxLength={10}
          />
        </div>
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
          {saving
            ? "Guardando..."
            : selectedClient
            ? "Guardar cambios"
            : "Registrar cliente"}
        </button>
      </div>
    </form>
  );
}

export default ClientForm;
