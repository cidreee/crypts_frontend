import { useEffect, useState } from "react";
import type { Crypt } from "../../types/crypt";

type CryptFormProps = {
  crypt: Crypt;
  saving?: boolean;
  onSubmit: (crypt: Crypt) => void;
  onCancel: () => void;
};

type CryptFormData = {
  section: string;
  letter: string;
  number: string;
  cost: string;
};

function CryptForm({
  crypt,
  saving = false,
  onSubmit,
  onCancel,
}: CryptFormProps) {
  const [formData, setFormData] = useState<CryptFormData>({
    section: "",
    letter: "",
    number: "",
    cost: "",
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData({
      section: crypt.section.toString(),
      letter: crypt.letter,
      number: crypt.number,
      cost: crypt.cost.toString(),
    });

    setFormError("");
  }, [crypt]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "letter") {
      setFormData((prev) => ({
        ...prev,
        letter: value.toUpperCase(),
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

    if (Number.isNaN(section) || section <= 0) {
      return "La sección debe ser un número mayor a 0.";
    }

    if (!formData.letter.trim()) {
      return "La letra es obligatoria.";
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
      ...crypt,
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
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default CryptForm;