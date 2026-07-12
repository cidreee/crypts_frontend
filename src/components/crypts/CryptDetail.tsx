import { useEffect, useState } from "react";
import type { Client } from "../../types/client";
import type { Crypt, CryptPayload } from "../../types/crypt";
import type { CryptRemain } from "../../types/cryptRemain";
import type { Payment } from "../../types/payment";
import { formatCurrency } from "../../utils/currency";
import { formatBackendDate } from "../../utils/date";

type EditableCryptDetails = Pick<
  CryptPayload,
  "beneficiaryId" | "title" | "plateText"
>;

type CryptDetailProps = {
  crypt: Crypt;
  clients: Client[];
  payments: Payment[];
  remains: CryptRemain[];
  editing?: boolean;
  saving?: boolean;
  loadingPayments?: boolean;
  paymentsError?: string;
  loadingRemains?: boolean;
  remainsError?: string;
  purchaseDate?: string;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (details: EditableCryptDetails) => void;
};

type DetailEditForm = {
  beneficiaryId: string;
  title: string;
  plateText: string;
};

function formatDate(date?: string | null) {
  return formatBackendDate(date);
}

function formatNullableText(value?: string | null, fallback = "-") {
  return value?.trim() || fallback;
}

function formatClientName(client: Crypt["client"] | Crypt["beneficiary"]) {
  if (!client) return "-";

  return `${client.firstName} ${client.lastName}`.trim() || "-";
}

function formatPaymentClientName(payment: Payment) {
  if (!payment.paidByClient) return `Cliente ${payment.paidByClientId}`;

  return (
    `${payment.paidByClient.firstName} ${payment.paidByClient.lastName}`.trim() ||
    `Cliente ${payment.paidByClientId}`
  );
}

function getCryptCode(crypt: Crypt) {
  return `${crypt.section}-${crypt.letter}-${crypt.number}`;
}

function getStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) return "Disponible";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

  if (totalPaid <= 0) return "Sin pago";
  if (balanceDue > 0) return "Abonando";

  return "Liquidada";
}

function getInitialEditForm(crypt: Crypt): DetailEditForm {
  return {
    beneficiaryId:
      crypt.beneficiaryId?.toString() ?? crypt.beneficiary?.id?.toString() ?? "",
    title: crypt.title ?? "",
    plateText: crypt.plateText ?? "",
  };
}

function EmptyValue({ children }: { children: React.ReactNode }) {
  return <span className="detail-empty-value">{children}</span>;
}

function DetailItem({
  label,
  value,
  inactive = false,
}: {
  label: string;
  value: React.ReactNode;
  inactive?: boolean;
}) {
  return (
    <div className={`detail-item ${inactive ? "detail-item-inactive" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CryptDetail({
  crypt,
  clients,
  payments,
  remains,
  editing = false,
  saving = false,
  loadingPayments = false,
  paymentsError = "",
  loadingRemains = false,
  remainsError = "",
  purchaseDate,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}: CryptDetailProps) {
  const [editForm, setEditForm] = useState<DetailEditForm>(() =>
    getInitialEditForm(crypt)
  );
  const clientName = crypt.client
    ? formatClientName(crypt.client)
    : "Sin cliente";
  const beneficiaryClient =
    crypt.beneficiary ??
    clients.find((client) => client.id === crypt.beneficiaryId) ??
    null;
  const beneficiaryName = formatClientName(beneficiaryClient);
  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;
  const paymentsCount = crypt.balance?.paymentsCount ?? payments.length;
  const activeRemains = remains.filter((remain) => remain.isActive ?? true);

  useEffect(() => {
    setEditForm(getInitialEditForm(crypt));
  }, [crypt]);

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = () => {
    onSaveEdit({
      beneficiaryId: editForm.beneficiaryId
        ? Number(editForm.beneficiaryId)
        : null,
      title: editForm.title.trim() || null,
      plateText: editForm.plateText.trim() || null,
    });
  };

  return (
    <div className="crypt-detail">
      <div className="detail-toolbar">
        <div>
          <span>Cripta</span>
          <strong>{getCryptCode(crypt)}</strong>
        </div>

        {!editing ? (
          <button type="button" className="btn-secondary" onClick={onEdit}>
            Editar
          </button>
        ) : (
          <div className="detail-toolbar-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Ubicación</h3>
        </div>

        <div className="detail-grid detail-grid-compact">
          <DetailItem label="Sección" value={crypt.section} inactive={editing} />
          <DetailItem label="Letra" value={crypt.letter} inactive={editing} />
          <DetailItem label="Número" value={crypt.number} inactive={editing} />
          <DetailItem
            label="Estado"
            value={getStatusLabel(crypt)}
            inactive={editing}
          />
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Venta y documentos</h3>
        </div>

        <div className="detail-grid">
          <DetailItem label="Cliente" value={clientName} inactive={editing} />

          <div className={`detail-item ${editing ? "detail-item-editable" : ""}`}>
            <span>Beneficiario</span>
            {editing ? (
              <select
                name="beneficiaryId"
                value={editForm.beneficiaryId}
                onChange={handleEditChange}
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
            ) : (
              <strong>
                {beneficiaryName === "-" ? (
                  <EmptyValue>Sin beneficiario</EmptyValue>
                ) : (
                  beneficiaryName
                )}
              </strong>
            )}
          </div>

          <DetailItem
            label="Fecha de compra"
            value={formatDate(purchaseDate ?? crypt.purchasedAt)}
            inactive={editing}
          />

          <div className={`detail-item ${editing ? "detail-item-editable" : ""}`}>
            <span>Número de título</span>
            {editing ? (
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                placeholder="No entregado"
                maxLength={120}
                disabled={saving}
              />
            ) : (
              <strong>
                {crypt.title?.trim() ? (
                  crypt.title
                ) : (
                  <EmptyValue>No entregado</EmptyValue>
                )}
              </strong>
            )}
          </div>

          <div className={`detail-item ${editing ? "detail-item-editable" : ""}`}>
            <span>Texto de placa</span>
            {editing ? (
              <input
                type="text"
                name="plateText"
                value={editForm.plateText}
                onChange={handleEditChange}
                placeholder="No definida"
                maxLength={180}
                disabled={saving}
              />
            ) : (
              <strong>
                {formatNullableText(crypt.plateText, "No definida") ===
                "No definida" ? (
                  <EmptyValue>No definida</EmptyValue>
                ) : (
                  crypt.plateText
                )}
              </strong>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Finanzas</h3>
        </div>

        <div className="detail-grid detail-grid-compact">
          <DetailItem
            label="Costo"
            value={formatCurrency(crypt.cost)}
            inactive={editing}
          />
          <DetailItem
            label="Total pagado"
            value={formatCurrency(totalPaid)}
            inactive={editing}
          />
          <DetailItem
            label="Saldo"
            value={crypt.client ? formatCurrency(balanceDue) : "-"}
            inactive={editing}
          />
          <DetailItem
            label="Pagos"
            value={crypt.client ? paymentsCount : "-"}
            inactive={editing}
          />
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Restos en esta cripta</h3>
          <span className="remains-counter">{activeRemains.length}/4</span>
        </div>

        {loadingRemains && <p className="loading-message">Cargando restos...</p>}
        {remainsError && <p className="error-message">{remainsError}</p>}

        {!loadingRemains && !remainsError && activeRemains.length === 0 && (
          <p className="empty-message">No hay restos registrados.</p>
        )}

        {!loadingRemains && !remainsError && activeRemains.length > 0 && (
          <div className="remains-grid">
            {activeRemains.map((remain, index) => (
              <div className="remain-item" key={remain.id ?? index}>
                <span>Nombre</span>
                <strong>{remain.deceasedName?.trim() || "-"}</strong>

                <small>Registrado: {formatDate(remain.createdAt)}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Pagos de esta cripta</h3>
        </div>

        {loadingPayments && <p className="loading-message">Cargando pagos...</p>}
        {paymentsError && <p className="error-message">{paymentsError}</p>}

        {!loadingPayments && !paymentsError && payments.length === 0 && (
          <p className="empty-message">No hay pagos registrados.</p>
        )}

        {!loadingPayments && !paymentsError && payments.length > 0 && (
          <div className="table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Pagó</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{formatPaymentClientName(payment)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>
                      {payment.paymentMethod?.name ??
                        `Método ${payment.paymentMethodId}`}
                    </td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>
                      <span
                        className={
                          payment.isActive
                            ? "badge badge-active"
                            : "badge badge-inactive"
                        }
                      >
                        {payment.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default CryptDetail;
