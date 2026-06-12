import { useEffect, useState } from "react";
import type { Crypt, CryptPayload } from "../../types/crypt";
import { hasMoreThanTwoDecimals } from "../../utils/number";

type CryptFormProps = {
  crypt?: Crypt | null;
  saving?: boolean;
  onSubmit: (crypt: CryptPayload) => void;
  onCancel: () => void;
};

type CryptFormData = {
  section: string;
  letter: string;
  number: string;
  cost: string;
};

const emptyCryptFormData: CryptFormData = {
  section: "",
  letter: "",
  number: "",
  cost: "",
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
  };
}

function CryptForm({
  crypt,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "letter") {
      setFormData((prev) => ({
        ...prev,
        letter: value.trimStart().toUpperCase(),
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

    if (!Number.isInteger(section) || section <= 0) {
      return "La sección debe ser un número entero mayor a 0.";
    }

    if (!formData.letter.trim()) {
      return "La letra es obligatoria.";
    }

    if (/\s/.test(formData.letter.trim())) {
      return "La letra no debe contener espacios.";
    }

    if (!formData.number.trim()) {
      return "El número de cripta es obligatorio.";
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
      clientId: crypt?.clientId ?? null,
      isAvailable: crypt?.isAvailable ?? true,
      createdAt: crypt?.createdAt,
      section: Number(formData.section),
      letter: formData.letter.trim().toUpperCase(),
      number: formData.number.trim(),
      cost: Number(formData.cost),
    });
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {formError && <p className="error-message">{formError}</p>}

      <div className="form-group">
        <label>Sección</label>
        <input
          type="number"
          name="section"
          value={formData.section}
          onChange={handleChange}
          min="1"
          step="1"
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>Letra</label>
        <input
          type="text"
          name="letter"
          value={formData.letter}
          onChange={handleChange}
          maxLength={5}
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>Número</label>
        <input
          type="text"
          name="number"
          value={formData.number}
          onChange={handleChange}
          disabled={saving}
          required
        />
      </div>

      <div className="form-group">
        <label>Costo</label>
        <input
          type="number"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          disabled={saving}
          required
        />
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
          {saving ? "Guardando..." : crypt ? "Guardar cambios" : "Registrar cripta"}
        </button>
      </div>
    </form>
  );
}

export default CryptForm;
