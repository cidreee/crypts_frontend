import { useEffect, useState } from "react";
import type { Client } from "../../types/client";

type ClientFormProps = {
  selectedClient: Client | null;
  saving?: boolean;
  onCreateClient: (client: Client) => Promise<boolean>;
  onUpdateClient: (id: number, client: Client) => Promise<boolean>;
  onCancel: () => void;
};

type ClientFormData = {
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  isActive: boolean;
};

function ClientForm({
  selectedClient,
  saving = false,
  onCreateClient,
  onUpdateClient,
  onCancel,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: "",
    lastName: "",
    phoneCountryCode: "+52",
    phoneNumber: "",
    isActive: true,
  });

  const [formError, setFormError] = useState("");

  const splitPhoneNumber = (phone?: string | null) => {
    if (!phone) {
      return {
        phoneCountryCode: "+52",
        phoneNumber: "",
      };
    }

    if (phone.startsWith("+52")) {
      return {
        phoneCountryCode: "+52",
        phoneNumber: phone.replace("+52", ""),
      };
    }

    if (phone.startsWith("+1")) {
      return {
        phoneCountryCode: "+1",
        phoneNumber: phone.replace("+1", ""),
      };
    }

    return {
      phoneCountryCode: "+52",
      phoneNumber: phone.replace(/\D/g, ""),
    };
  };

  useEffect(() => {
    if (selectedClient) {
      const phone = splitPhoneNumber(selectedClient.phoneNumber);

      setFormData({
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        phoneCountryCode: phone.phoneCountryCode,
        phoneNumber: phone.phoneNumber,
        isActive: selectedClient.isActive,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        phoneCountryCode: "+52",
        phoneNumber: "",
        isActive: true,
      });
    }

    setFormError("");
  }, [selectedClient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const onlyNumbers = value.replace(/\D/g, "");

      setFormData((prev) => ({
        ...prev,
        phoneNumber: onlyNumbers,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return "El nombre es obligatorio.";
    }

    if (!formData.lastName.trim()) {
      return "El apellido es obligatorio.";
    }

    if (formData.phoneNumber.trim() !== "") {
      if (formData.phoneCountryCode === "+52" && formData.phoneNumber.length !== 10) {
        return "El número celular de México debe tener 10 dígitos.";
      }

      if (formData.phoneCountryCode === "+1" && formData.phoneNumber.length !== 10) {
        return "El número de Estados Unidos/Canadá debe tener 10 dígitos.";
      }
    }

    return "";
  };

  const buildFullPhoneNumber = () => {
    if (!formData.phoneNumber.trim()) {
      return null;
    }

    return `${formData.phoneCountryCode}${formData.phoneNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const clientToSave: Client = {
      id: selectedClient?.id,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: buildFullPhoneNumber(),
      isActive: formData.isActive,
      createdAt: selectedClient?.createdAt,
    };

    let success = false;

    if (selectedClient?.id) {
      success = await onUpdateClient(selectedClient.id, clientToSave);
    } else {
      success = await onCreateClient(clientToSave);
    }

    if (success) {
      onCancel();
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
        <label>Nombre</label>
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
        <label>Apellido</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          disabled={saving}
          required
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

      <div className="form-group">
        <label>Estado</label>
        <select
          name="isActive"
          value={formData.isActive ? "true" : "false"}
          onChange={handleChange}
          disabled={saving}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
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