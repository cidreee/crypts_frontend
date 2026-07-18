import { useMemo, useState } from "react";
import type { Crypt } from "../../types/crypt";
import { formatBackendDate, getBackendDateTime } from "../../utils/date";
import {
  getEffectiveCryptBalanceDue,
  getEffectiveCryptTotalAmount,
  getEffectiveCryptTotalPaid,
} from "../../utils/cryptOwnership";
import Modal from "../common/Modal";

type ColumnKey =
  | "crypt"
  | "clientId"
  | "client"
  | "clientPhone"
  | "beneficiaryId"
  | "beneficiary"
  | "beneficiaryPhone"
  | "purchaseDate"
  | "totalAmount"
  | "totalPaid"
  | "balanceDue"
  | "remainsCount"
  | "remainsNames";

type ExportColumn = {
  key: ColumnKey;
  label: string;
  width: number;
  getValue: (crypt: Crypt) => string | number;
};

type CryptExportModalProps = {
  crypts: Crypt[];
  onClose: () => void;
};

const getFullName = (person: Crypt["client"] | Crypt["beneficiary"]) =>
  person ? `${person.firstName} ${person.lastName}`.trim() : "";

const getActiveRemains = (crypt: Crypt) =>
  (crypt.cryptRemains ?? []).filter((remain) => remain.isActive ?? true);

const columns: ExportColumn[] = [
  {
    key: "crypt",
    label: "Cripta",
    width: 18,
    getValue: (crypt) => `${crypt.section}-${crypt.letter}-${crypt.number}`,
  },
  { key: "clientId", label: "ID cliente", width: 12, getValue: (crypt) => crypt.clientId ?? crypt.client?.id ?? "" },
  { key: "client", label: "Cliente", width: 28, getValue: (crypt) => getFullName(crypt.client) },
  { key: "clientPhone", label: "Teléfono cliente", width: 18, getValue: (crypt) => crypt.client?.phoneNumber ?? "" },
  { key: "beneficiaryId", label: "ID beneficiario", width: 15, getValue: (crypt) => crypt.beneficiaryId ?? crypt.beneficiary?.id ?? "" },
  { key: "beneficiary", label: "Beneficiario", width: 28, getValue: (crypt) => getFullName(crypt.beneficiary) },
  { key: "beneficiaryPhone", label: "Teléfono beneficiario", width: 20, getValue: (crypt) => crypt.beneficiary?.phoneNumber ?? "" },
  { key: "purchaseDate", label: "Fecha de compra", width: 17, getValue: (crypt) => formatBackendDate(crypt.purchasedAt, "") },
  { key: "totalAmount", label: "Total cripta", width: 16, getValue: getEffectiveCryptTotalAmount },
  { key: "totalPaid", label: "Total pagado", width: 16, getValue: getEffectiveCryptTotalPaid },
  { key: "balanceDue", label: "Saldo pendiente", width: 17, getValue: getEffectiveCryptBalanceDue },
  { key: "remainsCount", label: "Cantidad de restos", width: 17, getValue: (crypt) => getActiveRemains(crypt).length },
  {
    key: "remainsNames",
    label: "Nombres de los restos",
    width: 42,
    getValue: (crypt) =>
      getActiveRemains(crypt)
        .map((remain) => remain.deceasedName?.trim())
        .filter(Boolean)
        .join(", "),
  },
];

function CryptExportModal({ crypts, onClose }: CryptExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(() =>
    columns.map((column) => column.key)
  );
  const [availability, setAvailability] = useState("all");
  const [section, setSection] = useState("all");
  const [balance, setBalance] = useState("all");
  const [remains, setRemains] = useState("all");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
  const [purchaseDateTo, setPurchaseDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const sections = useMemo(
    () =>
      Array.from(new Set(crypts.map((crypt) => crypt.section))).sort(
        (first, second) => first - second
      ),
    [crypts]
  );

  const filteredCrypts = useMemo(() => {
    const fromTime = purchaseDateFrom
      ? new Date(`${purchaseDateFrom}T00:00:00`).getTime()
      : null;
    const toTime = purchaseDateTo
      ? new Date(`${purchaseDateTo}T23:59:59`).getTime()
      : null;

    return crypts.filter((crypt) => {
      const isAvailable = Boolean(crypt.isAvailable);
      const balanceDue = getEffectiveCryptBalanceDue(crypt);
      const remainsCount = getActiveRemains(crypt).length;
      const purchaseTime = getBackendDateTime(crypt.purchasedAt);

      return (
        (availability === "all" ||
          (availability === "available" && isAvailable) ||
          (availability === "occupied" && !isAvailable)) &&
        (section === "all" || crypt.section === Number(section)) &&
        (balance === "all" ||
          (balance === "due" && balanceDue > 0) ||
          (balance === "paid" && !isAvailable && balanceDue <= 0)) &&
        (remains === "all" ||
          (remains === "with" && remainsCount > 0) ||
          (remains === "without" && remainsCount === 0)) &&
        (fromTime === null ||
          (purchaseTime !== null && purchaseTime >= fromTime)) &&
        (toTime === null ||
          (purchaseTime !== null && purchaseTime <= toTime))
      );
    });
  }, [availability, balance, crypts, purchaseDateFrom, purchaseDateTo, remains, section]);

  const handleColumnChange = (key: ColumnKey) => {
    setSelectedColumns((current) =>
      current.includes(key)
        ? current.filter((columnKey) => columnKey !== key)
        : [...current, key]
    );
    setExportError("");
  };

  const handleExport = async () => {
    const activeColumns = columns.filter((column) =>
      selectedColumns.includes(column.key)
    );

    if (activeColumns.length === 0) {
      setExportError("Selecciona al menos una columna para exportar.");
      return;
    }

    if (filteredCrypts.length === 0) {
      setExportError("No hay criptas que coincidan con los filtros.");
      return;
    }

    try {
      setExporting(true);
      setExportError("");

      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const rows = [
        activeColumns.map((column) => ({
          value: column.label,
          fontWeight: "bold" as const,
          backgroundColor: "#e9e1d5",
        })),
        ...filteredCrypts.map((crypt) =>
          activeColumns.map((column) => ({ value: column.getValue(crypt) }))
        ),
      ];

      await writeXlsxFile(rows, {
        columns: activeColumns.map((column) => ({ width: column.width })),
        sheet: "Criptas",
      }).toFile(`criptas-${new Date().toISOString().slice(0, 10)}.xlsx`);
      onClose();
    } catch (error) {
      console.error("Error exporting crypts:", error);
      setExportError("No se pudo generar el archivo de Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen
      title="Exportar criptas a Excel"
      onClose={onClose}
      closeDisabled={exporting}
      size="wide"
    >
      <div className="export-modal-content">
        <section>
          <div className="detail-section-title">
            <h3>Columnas</h3>
            <button
              type="button"
              className="btn-secondary export-select-all"
              onClick={() =>
                setSelectedColumns(
                  selectedColumns.length === columns.length
                    ? []
                    : columns.map((column) => column.key)
                )
              }
            >
              {selectedColumns.length === columns.length
                ? "Quitar todas"
                : "Seleccionar todas"}
            </button>
          </div>

          <div className="export-columns-grid">
            {columns.map((column) => (
              <label className="export-column-option" key={column.key}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.key)}
                  onChange={() => handleColumnChange(column.key)}
                  disabled={exporting}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="detail-section-title">
            <h3>Filtros opcionales</h3>
          </div>

          <div className="filters-container export-filters">
            <div className="form-group">
              <label>Disponibilidad</label>
              <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                <option value="all">Todas</option>
                <option value="available">Disponibles</option>
                <option value="occupied">Ocupadas</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sección</label>
              <select value={section} onChange={(event) => setSection(event.target.value)}>
                <option value="all">Todas</option>
                {sections.map((sectionNumber) => (
                  <option key={sectionNumber} value={sectionNumber}>{sectionNumber}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Saldo</label>
              <select value={balance} onChange={(event) => setBalance(event.target.value)}>
                <option value="all">Todos</option>
                <option value="due">Con saldo pendiente</option>
                <option value="paid">Liquidadas</option>
              </select>
            </div>
            <div className="form-group">
              <label>Restos</label>
              <select value={remains} onChange={(event) => setRemains(event.target.value)}>
                <option value="all">Todos</option>
                <option value="with">Con restos</option>
                <option value="without">Sin restos</option>
              </select>
            </div>
            <div className="form-group">
              <label>Compra desde</label>
              <input type="date" value={purchaseDateFrom} onChange={(event) => setPurchaseDateFrom(event.target.value)} />
            </div>
            <div className="form-group">
              <label>Compra hasta</label>
              <input type="date" value={purchaseDateTo} onChange={(event) => setPurchaseDateTo(event.target.value)} />
            </div>
          </div>
        </section>

        <p className="export-results-count">
          Se exportarán <strong>{filteredCrypts.length}</strong> criptas y{" "}
          <strong>{selectedColumns.length}</strong> columnas.
        </p>
        {exportError && <p className="error-message">{exportError}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={exporting}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Generando Excel..." : "Exportar a Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CryptExportModal;
