import { useEffect, useState } from "react";
import type { Client } from "../../types/client";
import type { Crypt, CryptPayload } from "../../types/crypt";
import { hasMoreThanTwoDecimals } from "../../utils/number";

type CryptFormProps = {
  crypt?: Crypt | null;
  clients?: Client[];
  saving?: boolean;
  onSubmit: (crypt: CryptPayload) => void;
  onCancel: () => void;
};

type CryptFormData = {
  section: string;
  letter: string;
  number: string;
  cost: string;
  beneficiaryId: string;
  title: string;
  plateText: string;
};

const emptyCryptFormData: CryptFormData = {
  section: "",
  letter: "",
  number: "",
  cost: "",
  beneficiaryId: "",
  title: "",
  plateText: "",
};

function getCryptFormData(crypt?: Crypt | null): CryptFormData {
  if (!crypt) {
    return emptyCryptFormData;
  }

  return {
    section: crypt.section.toString(),
    letter: crypt.letter,
    number: crypt.number,
    cost: crypt.cost.toString(),
    beneficiaryId:
      crypt.beneficiaryId?.toString() ?? crypt.beneficiary?.id?.toString() ?? "",
    title: crypt.title ?? "",
    plateText: crypt.plateText ?? "",
  };
}

function getCurrencyInputValue(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = sanitized.split(".");
  const decimals = decimalParts.join("").slice(0, 2);

  if (sanitized.includes(".")) {
    return `${integerPart}.${decimals}`;
  }

  return integerPart;
}

function RequiredMark() {
  return (
    <span className="required-mark" title="Obligatorio">
      *
    </span>
  );
}

function CryptForm({
  crypt,
  clients = [],
  saving = false,
  onSubmit,
  onCancel,
}: CryptFormProps) {
  const [formData, setFormData] = useState<CryptFormData>(() =>
    getCryptFormData(crypt)
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(getCryptFormData(crypt));
    setFormError("");
  }, [crypt]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "section") {
      setFormData((prev) => ({
        ...prev,
        section: value.replace(/\D/g, ""),
      }));

      return;
    }

    if (name === "letter") {
      setFormData((prev) => ({
        ...prev,
        letter: value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ]/g, "").toUpperCase(),
      }));

      return;
    }

    if (name === "number") {
      setFormData((prev) => ({
        ...prev,
        number: value.replace(/\D/g, ""),
      }));

      return;
    }

    if (name === "cost") {
      setFormData((prev) => ({
        ...prev,
        cost: getCurrencyInputValue(value),
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const section = Number(formData.section);
    const cost = Number(formData.cost);

    if (!formData.section.trim()) {
      return "La sección es obligatoria.";
    }

    if (!/^\d+$/.test(formData.section.trim())) {
      return "La sección solo debe contener números.";
    }

    if (!Number.isInteger(section) || section <= 0) {
      return "La sección debe ser un número entero mayor a 0.";
    }

    if (!formData.letter.trim()) {
      return "La letra es obligatoria.";
    }

    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ]+$/.test(formData.letter.trim())) {
      return "La letra solo debe contener caracteres.";
    }

    if (/\s/.test(formData.letter.trim())) {
      return "La letra no debe contener espacios.";
    }

    if (!formData.number.trim()) {
      return "El número de cripta es obligatorio.";
    }

    if (!/^\d+$/.test(formData.number.trim())) {
      return "El número de cripta solo debe contener números.";
    }

    if (!formData.cost.trim()) {
      return "El costo es obligatorio.";
    }

    if (Number.isNaN(cost) || cost <= 0) {
      return "El costo debe ser mayor a 0.";
    }

    if (hasMoreThanTwoDecimals(formData.cost)) {
      return "El costo no puede tener más de 2 decimales.";
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

    onSubmit({
      id: crypt?.id,
      clientId: crypt?.clientId ?? crypt?.client?.id ?? null,
      beneficiaryId: formData.beneficiaryId
        ? Number(formData.beneficiaryId)
        : null,
      saleCryptStatusId: crypt?.saleCryptStatusId ?? null,
      isAvailable: crypt?.isAvailable ?? true,
      createdAt: crypt?.createdAt,
      section: Number(formData.section),
      letter: formData.letter.trim().toUpperCase(),
      number: formData.number.trim(),
      cost: Number(formData.cost),
      title: formData.title.trim() || null,
      plateText: formData.plateText.trim() || null,
    });
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <fieldset className="form-section">
        <legend>Ubicación y costo</legend>

        <div className="form-group">
          <label>
            Sección <RequiredMark />
          </label>
          <input
            type="text"
            name="section"
            value={formData.section}
            onChange={handleChange}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Número de sección"
            disabled={saving}
            required
          />
        </div>

        <div className="form-group">
          <label>
            Letra <RequiredMark />
          </label>
          <input
            type="text"
            name="letter"
            value={formData.letter}
            onChange={handleChange}
            maxLength={5}
            placeholder="Letra"
            disabled={saving}
            required
          />
        </div>

        <div className="form-group">
          <label>
            Número <RequiredMark />
          </label>
          <input
            type="text"
            name="number"
            value={formData.number}
            onChange={handleChange}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Número de cripta"
            disabled={saving}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="crypt-cost">
            Costo <RequiredMark />
          </label>
          <div className="currency-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="crypt-cost"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              inputMode="decimal"
              placeholder="0.00"
              disabled={saving}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Datos de venta</legend>

        <div className="form-group form-group-full">
          <label htmlFor="crypt-beneficiary">Beneficiario</label>
          <select
            id="crypt-beneficiary"
            name="beneficiaryId"
            value={formData.beneficiaryId}
            onChange={handleChange}
            disabled={saving || clients.length === 0}
          >
            <option value="">Sin beneficiario</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
                {client.phoneNumber ? ` - ${client.phoneNumber}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="crypt-title">Número de título</label>
          <input
            id="crypt-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Sin título entregado"
            maxLength={120}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="crypt-plate-text">Texto de placa</label>
          <input
            id="crypt-plate-text"
            type="text"
            name="plateText"
            value={formData.plateText}
            onChange={handleChange}
            placeholder="Nombre para la placa"
            maxLength={180}
            disabled={saving}
          />
        </div>
      </fieldset>

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
            : crypt
            ? "Guardar cambios"
            : "Registrar cripta"}
        </button>
      </div>
    </form>
  );
}

export default CryptForm;
