import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Link } from "react-router-dom";
import type { Client, ClientPayload } from "../../types/client";
import type { Crypt, CryptPayload } from "../../types/crypt";
import type { CryptRemain } from "../../types/cryptRemain";
import type { Payment } from "../../types/payment";
import { getPaymentMethodLabel } from "../../constants/paymentMethods";
import { formatCurrency } from "../../utils/currency";
import { formatBackendDate } from "../../utils/date";
import { getEffectiveCryptBalanceDue } from "../../utils/cryptOwnership";
import {
  buildPhoneNumber,
  onlyDigits,
  validatePhoneNumber,
  type PhoneCountryCode,
} from "../../utils/phone";

type BeneficiaryEditMode = "none" | "existing" | "new";

export type EditableCryptDetails = Pick<
  CryptPayload,
  "beneficiaryId" | "title" | "plateText" | "cost"
> & {
  beneficiary?: ClientPayload;
};

export type CryptDetailHandle = {
  save: () => void;
};

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
  onSaveEdit: (details: EditableCryptDetails) => void;
  onEditPayment: (payment: Payment) => void;
  onDeleteRemain: (remain: CryptRemain) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type DetailEditForm = {
  beneficiaryMode: BeneficiaryEditMode;
  beneficiaryId: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  beneficiaryPhoneCountryCode: PhoneCountryCode;
  beneficiaryPhoneNumber: string;
  beneficiaryAlternatePhoneCountryCode: PhoneCountryCode;
  beneficiaryAlternatePhoneNumber: string;
  cost: string;
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

function getClientSearchUrl(client: Crypt["client"] | Crypt["beneficiary"]) {
  if (!client) return "";

  const searchValue =
    `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
    client.phoneNumber ||
    client.id?.toString() ||
    "";

  return `/clients?search=${encodeURIComponent(searchValue)}`;
}

function ClientDetailLink({
  client,
  fallback,
}: {
  client: Crypt["client"] | Crypt["beneficiary"];
  fallback: string;
}) {
  if (!client) {
    return <EmptyValue>{fallback}</EmptyValue>;
  }

  return (
    <Link className="table-inline-link" to={getClientSearchUrl(client)}>
      {formatClientName(client)}
    </Link>
  );
}

function formatPaymentClientName(payment: Payment) {
  if (!payment.paidByClient) return `Cliente ${payment.paidByClientId}`;

  return (
    `${payment.paidByClient.firstName} ${payment.paidByClient.lastName}`.trim() ||
    `Cliente ${payment.paidByClientId}`
  );
}

function getPaymentClientHistoryUrl(payment: Payment) {
  const searchParams = new URLSearchParams({ from: "crypts" });

  if (payment.cryptId) {
    searchParams.set("cryptId", payment.cryptId.toString());
  }

  return `/clients/${payment.paidByClientId}/payments?${searchParams.toString()}`;
}

function PaymentClientLink({ payment }: { payment: Payment }) {
  const clientName = formatPaymentClientName(payment);

  if (!payment.paidByClientId) {
    return <span>{clientName}</span>;
  }

  return (
    <Link className="table-inline-link" to={getPaymentClientHistoryUrl(payment)}>
      {clientName}
    </Link>
  );
}

function getStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) return "Disponible";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = getEffectiveCryptBalanceDue(crypt);

  if (totalPaid <= 0) return "Sin pago";
  if (balanceDue > 0) return "Abonando";

  return "Liquidada";
}

function getInitialEditForm(crypt: Crypt): DetailEditForm {
  const beneficiaryId =
    crypt.beneficiaryId?.toString() ?? crypt.beneficiary?.id?.toString() ?? "";

  return {
    beneficiaryMode: beneficiaryId ? "existing" : "none",
    beneficiaryId,
    beneficiaryFirstName: "",
    beneficiaryLastName: "",
    beneficiaryPhoneCountryCode: "+52",
    beneficiaryPhoneNumber: "",
    beneficiaryAlternatePhoneCountryCode: "+52",
    beneficiaryAlternatePhoneNumber: "",
    cost: crypt.cost?.toString() ?? "",
    title: crypt.title ?? "",
    plateText: crypt.plateText ?? "",
  };
}

function RequiredMark() {
  return (
    <span className="required-mark" title="Obligatorio">
      *
    </span>
  );
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

const CryptDetail = forwardRef<CryptDetailHandle, CryptDetailProps>(function CryptDetail({
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
  onSaveEdit,
  onEditPayment,
  onDeleteRemain,
  onDirtyChange,
}: CryptDetailProps, ref) {
  const [editForm, setEditForm] = useState<DetailEditForm>(() =>
    getInitialEditForm(crypt)
  );
  const [editFormError, setEditFormError] = useState("");
  const clientName = crypt.client
    ? formatClientName(crypt.client)
    : "Sin cliente";
  const currentClientId = crypt.clientId ?? crypt.client?.id ?? null;
  const canEditSaleDetails = Boolean(currentClientId);
  const beneficiaryOptions = clients.filter(
    (client) => client.id !== currentClientId
  );
  const beneficiaryClient =
    crypt.beneficiary ??
    clients.find((client) => client.id === crypt.beneficiaryId) ??
    null;
  const beneficiaryName = formatClientName(beneficiaryClient);
  const totalPaid =
    payments.length > 0
      ? payments.reduce((sum, payment) => {
          return payment.isActive === false ? sum : sum + payment.amount;
        }, 0)
      : crypt.balance?.totalPaid ?? 0;
  const balanceDue = getEffectiveCryptBalanceDue(crypt);
  const paymentsCount = crypt.balance?.paymentsCount ?? payments.length;
  const activeRemains = remains.filter((remain) => remain.isActive ?? true);

  useEffect(() => {
    setEditForm(getInitialEditForm(crypt));
    setEditFormError("");
  }, [crypt]);

  useEffect(() => {
    onDirtyChange?.(
      JSON.stringify(editForm) !== JSON.stringify(getInitialEditForm(crypt))
    );
  }, [crypt, editForm, onDirtyChange]);

  useEffect(() => {
    if (!editing) return;

    setEditForm((prev) => {
      if (prev.beneficiaryMode !== "existing") return prev;

      const selectedBeneficiaryId = Number(prev.beneficiaryId);
      const selectedBeneficiaryIsValid = beneficiaryOptions.some(
        (client) => client.id === selectedBeneficiaryId
      );

      if (selectedBeneficiaryIsValid) return prev;

      return {
        ...prev,
        beneficiaryMode: beneficiaryOptions.length > 0 ? "existing" : "none",
        beneficiaryId: beneficiaryOptions[0]?.id?.toString() ?? "",
      };
    });
  }, [beneficiaryOptions, editing]);

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setEditFormError("");

    if (
      name === "beneficiaryPhoneNumber" ||
      name === "beneficiaryAlternatePhoneNumber"
    ) {
      setEditForm((prev) => ({
        ...prev,
        [name]: onlyDigits(value),
      }));

      return;
    }

    if (name === "beneficiaryMode") {
      const mode = value as BeneficiaryEditMode;

      setEditForm((prev) => ({
        ...prev,
        beneficiaryMode: mode,
        beneficiaryId:
          mode === "existing"
            ? beneficiaryOptions[0]?.id?.toString() ?? ""
            : "",
      }));

      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]:
        name === "beneficiaryPhoneCountryCode" ||
        name === "beneficiaryAlternatePhoneCountryCode"
          ? (value as PhoneCountryCode)
          : value,
    }));
  };

  const handleSaveEdit = () => {
    const cost = Number(editForm.cost);

    if (!Number.isFinite(cost) || cost <= 0) {
      setEditFormError("El costo de la cripta debe ser mayor a 0.");
      return;
    }

    if (!canEditSaleDetails) {
      onSaveEdit({
        beneficiaryId: crypt.beneficiaryId ?? null,
        title: crypt.title ?? null,
        plateText: crypt.plateText ?? null,
        cost,
      });
      return;
    }

    if (editForm.beneficiaryMode === "existing") {
      const beneficiaryId = Number(editForm.beneficiaryId);

      if (!beneficiaryId) {
        setEditFormError("Selecciona un beneficiario.");
        return;
      }

      if (beneficiaryId === currentClientId) {
        setEditFormError("El beneficiario no puede ser el cliente actual.");
        return;
      }
    }

    if (editForm.beneficiaryMode === "new") {
      if (!editForm.beneficiaryFirstName.trim()) {
        setEditFormError("El nombre del beneficiario es obligatorio.");
        return;
      }

      if (!editForm.beneficiaryLastName.trim()) {
        setEditFormError("El apellido del beneficiario es obligatorio.");
        return;
      }

      const phoneError = validatePhoneNumber({
        phoneCountryCode: editForm.beneficiaryPhoneCountryCode,
        phoneNumber: editForm.beneficiaryPhoneNumber,
      });

      if (phoneError) {
        setEditFormError(phoneError);
        return;
      }

      const alternatePhoneError = validatePhoneNumber({
        phoneCountryCode: editForm.beneficiaryAlternatePhoneCountryCode,
        phoneNumber: editForm.beneficiaryAlternatePhoneNumber,
      });

      if (alternatePhoneError) {
        setEditFormError(alternatePhoneError);
        return;
      }
    }

    if (!editForm.plateText.trim()) {
      setEditFormError("El texto de placa es obligatorio.");
      return;
    }

    onSaveEdit({
      beneficiaryId: editForm.beneficiaryMode === "existing" && editForm.beneficiaryId
        ? Number(editForm.beneficiaryId)
        : null,
      beneficiary:
        editForm.beneficiaryMode === "new"
          ? {
              firstName: editForm.beneficiaryFirstName.trim(),
              lastName: editForm.beneficiaryLastName.trim(),
              phoneNumber: buildPhoneNumber({
                phoneCountryCode: editForm.beneficiaryPhoneCountryCode,
                phoneNumber: editForm.beneficiaryPhoneNumber,
              }),
              alternatePhoneNumber: buildPhoneNumber({
                phoneCountryCode: editForm.beneficiaryAlternatePhoneCountryCode,
                phoneNumber: editForm.beneficiaryAlternatePhoneNumber,
              }),
              isActive: true,
            }
          : undefined,
      title: editForm.title.trim() || null,
      plateText: editForm.plateText.trim() || null,
      cost,
    });
  };

  useImperativeHandle(ref, () => ({
    save: handleSaveEdit,
  }));

  return (
    <div className="crypt-detail">
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

        {editing && !canEditSaleDetails && (
          <p className="empty-message">
            Esta cripta no tiene cliente asignado. Solo se puede editar el costo.
          </p>
        )}

        {editing && editFormError && (
          <p className="error-message">{editFormError}</p>
        )}

        <div className="detail-grid">
          <DetailItem
            label="Cliente"
            value={
              <ClientDetailLink client={crypt.client} fallback={clientName} />
            }
            inactive={editing}
          />

          <div
            className={`detail-item ${
              editing && canEditSaleDetails ? "detail-item-editable" : ""
            }`}
          >
            <span>Beneficiario</span>
            {editing && canEditSaleDetails ? (
              <div className="nested-edit-fields">
                <select
                  name="beneficiaryMode"
                  value={editForm.beneficiaryMode}
                  onChange={handleEditChange}
                  disabled={saving}
                >
                  <option value="none">Sin beneficiario</option>
                  {beneficiaryOptions.length > 0 && (
                    <option value="existing">Beneficiario existente</option>
                  )}
                  <option value="new">Beneficiario nuevo</option>
                </select>

                {editForm.beneficiaryMode === "existing" && (
                  <div className="form-mode-panel detail-mode-panel">
                    <div className="form-mode-panel-title">
                      Beneficiario existente
                    </div>

                    <select
                      name="beneficiaryId"
                      value={editForm.beneficiaryId}
                      onChange={handleEditChange}
                      disabled={saving || beneficiaryOptions.length === 0}
                      required
                    >
                      {beneficiaryOptions.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                          {client.phoneNumber ? ` - ${client.phoneNumber}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editForm.beneficiaryMode === "new" && (
                  <div className="form-mode-panel detail-mode-panel">
                    <div className="form-mode-panel-title">
                      Datos del beneficiario nuevo
                    </div>

                  <div className="inline-form-grid">
                    <label>
                      Nombre <RequiredMark />
                      <input
                        type="text"
                        name="beneficiaryFirstName"
                        value={editForm.beneficiaryFirstName}
                        onChange={handleEditChange}
                        disabled={saving}
                        required
                      />
                    </label>

                    <label>
                      Apellido <RequiredMark />
                      <input
                        type="text"
                        name="beneficiaryLastName"
                        value={editForm.beneficiaryLastName}
                        onChange={handleEditChange}
                        disabled={saving}
                        required
                      />
                    </label>

                    <label className="inline-form-grid-full">
                      Celular <RequiredMark />
                      <div className="phone-input-group">
                        <select
                          name="beneficiaryPhoneCountryCode"
                          value={editForm.beneficiaryPhoneCountryCode}
                          onChange={handleEditChange}
                          disabled={saving}
                          aria-label="Codigo de pais del beneficiario"
                        >
                          <option value="+52">+52 Mexico</option>
                          <option value="+1">+1 USA/Canada</option>
                        </select>

                        <input
                          type="tel"
                          name="beneficiaryPhoneNumber"
                          value={editForm.beneficiaryPhoneNumber}
                          onChange={handleEditChange}
                          disabled={saving}
                          placeholder="4491234567"
                          maxLength={10}
                          required
                        />
                      </div>
                    </label>

                    <label className="inline-form-grid-full">
                      Segundo celular opcional
                      <div className="phone-input-group">
                        <select
                          name="beneficiaryAlternatePhoneCountryCode"
                          value={editForm.beneficiaryAlternatePhoneCountryCode}
                          onChange={handleEditChange}
                          disabled={saving}
                          aria-label="Codigo de pais del segundo telefono del beneficiario"
                        >
                          <option value="+52">+52 Mexico</option>
                          <option value="+1">+1 USA/Canada</option>
                        </select>

                        <input
                          type="tel"
                          name="beneficiaryAlternatePhoneNumber"
                          value={editForm.beneficiaryAlternatePhoneNumber}
                          onChange={handleEditChange}
                          disabled={saving}
                          placeholder="4491234567"
                          maxLength={10}
                        />
                      </div>
                    </label>
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <strong>
                {beneficiaryName === "-" ? (
                  <EmptyValue>Sin beneficiario</EmptyValue>
                ) : (
                  <ClientDetailLink
                    client={beneficiaryClient}
                    fallback={beneficiaryName}
                  />
                )}
              </strong>
            )}
          </div>

          <DetailItem
            label="Fecha de compra"
            value={formatDate(purchaseDate ?? crypt.purchasedAt)}
            inactive={editing}
          />

          <div
            className={`detail-item ${
              editing && canEditSaleDetails ? "detail-item-editable" : ""
            }`}
          >
            <span>Número de título</span>
            {editing && canEditSaleDetails ? (
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

          <div
            className={`detail-item ${
              editing && canEditSaleDetails ? "detail-item-editable" : ""
            }`}
          >
            <span>
              Texto de placa {editing && canEditSaleDetails && <RequiredMark />}
            </span>
            {editing && canEditSaleDetails ? (
              <input
                type="text"
                name="plateText"
                value={editForm.plateText}
                onChange={handleEditChange}
                placeholder="No definida"
                maxLength={180}
                disabled={saving}
                required
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
          <div className={`detail-item ${editing ? "detail-item-editable" : ""}`}>
            <span>
              Costo {editing && <RequiredMark />}
            </span>
            {editing ? (
              <input
                type="number"
                name="cost"
                value={editForm.cost}
                onChange={handleEditChange}
                min="0.01"
                step="0.01"
                disabled={saving}
                required
              />
            ) : (
              <strong>{formatCurrency(crypt.cost)}</strong>
            )}
          </div>
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
                <div>
                  <span>Nombre</span>
                  <strong>{remain.deceasedName?.trim() || "-"}</strong>

                  <small>Registrado: {formatDate(remain.createdAt)}</small>
                </div>

                <button
                  type="button"
                  className="btn-danger btn-remain-delete"
                  onClick={() => onDeleteRemain(remain)}
                  disabled={!remain.id}
                >
                  Eliminar
                </button>
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
                  <th className="table-sticky-right table-sticky-action-compact">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>
                      <PaymentClientLink payment={payment} />
                    </td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>
                      {getPaymentMethodLabel(
                        payment.paymentMethodId,
                        payment.paymentMethod?.name
                      )}
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
                    <td className="table-sticky-right table-sticky-action-compact">
                      <button
                        type="button"
                        className="table-icon-action"
                        title="Editar pago"
                        aria-label="Editar pago"
                        onClick={() => onEditPayment(payment)}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
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
});

export default CryptDetail;
