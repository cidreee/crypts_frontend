import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { apiService } from "../services/apiService";
import { usePayments } from "../hooks/usePayments";
import type { Client } from "../types/client";
import type { Crypt } from "../types/crypt";
import type { Payment, PaymentPayload } from "../types/payment";
import { formatCurrency } from "../utils/currency";
import { formatBackendDate } from "../utils/date";
import { getApiErrorMessage } from "../utils/apiError";
import {
  getCryptBeneficiaryId,
  getCryptCurrentClientId,
  getEffectiveCryptBalanceDue,
  getEffectiveCryptTotalAmount,
  getEffectiveCryptTotalPaid,
  getTransferDebtAmount,
  getLatestIncomingTransferForClient,
  getLatestOutgoingTransferForClient,
  getTransferReason,
  getTransferToClientId,
  getTransferDate,
} from "../utils/cryptOwnership";
import PaymentHistoryTable from "../components/clients/PaymentHistoryTable";
import PaymentForm from "../components/payment/PaymentForm";
import Modal from "../components/common/Modal";
import ToastMessage from "../components/common/ToastMessage";
import PageLoader from "../components/common/PageLoader";

type ClientCryptBalanceRow = {
  crypt: Crypt;
  role: string;
  origin: string;
  totalAmount: number | null;
  totalPaid: number | null;
  balanceDue: number | null;
  date?: string | null;
  note?: string;
  badgeClassName: string;
};

function getCryptCode(crypt: Crypt) {
  return `${crypt.section}-${crypt.letter}-${crypt.number}`;
}

function ClientPaymentHistoryPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const numericClientId = Number(clientId);

  const cryptIdParam = searchParams.get("cryptId");
  const fromParam = searchParams.get("from");

  const initialCryptId =
    cryptIdParam && !Number.isNaN(Number(cryptIdParam))
      ? Number(cryptIdParam)
      : undefined;

  const {
    payments,
    selectedCryptId,
    loading,
    error,
    handleCryptFilterChange,
  } = usePayments(numericClientId, initialCryptId);

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [crypts, setCrypts] = useState<Crypt[]>([]);
  const [cryptsLoading, setCryptsLoading] = useState(false);
  const [cryptsError, setCryptsError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const loadClient = useCallback(async () => {
    if (!numericClientId || Number.isNaN(numericClientId)) return;

    try {
      setClientLoading(true);
      setClientError("");

      const data = await apiService.clients.getClientBalanceById(
        numericClientId
      );

      setClient(data);
    } catch (err) {
      console.error("Error loading client:", err);
      setClientError(
        getApiErrorMessage(err, "No se pudo cargar la información del cliente.")
      );
    } finally {
      setClientLoading(false);
    }
  }, [numericClientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const loadCrypts = useCallback(async () => {
    if (!numericClientId || Number.isNaN(numericClientId)) return;

    try {
      setCryptsLoading(true);
      setCryptsError("");

      const data = await apiService.crypts.getAll();

      setCrypts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading crypt balances:", err);
      setCryptsError(
        getApiErrorMessage(err, "No se pudieron cargar los balances por cripta.")
      );
      setCrypts([]);
    } finally {
      setCryptsLoading(false);
    }
  }, [numericClientId]);

  useEffect(() => {
    loadCrypts();
  }, [loadCrypts]);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setClientsError("");

      const data = await apiService.clients.getClientsBalance();

      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading clients for transfer names:", err);
      setClientsError(
        getApiErrorMessage(err, "No se pudieron cargar los nombres de clientes.")
      );
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const cryptOptions = useMemo(() => {
    const map = new Map<number, string>();

    payments.forEach((payment) => {
      if (!map.has(payment.cryptId)) {
        const label = payment.crypt
          ? `${payment.crypt.section}-${payment.crypt.letter}-${payment.crypt.number}`
          : `Cripta ${payment.cryptId}`;

        map.set(payment.cryptId, label);
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [payments]);

  const totalFilteredPaid = useMemo(() => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const clientNameById = useMemo(() => {
    return clients.reduce<Record<number, string>>((names, currentClient) => {
      if (!currentClient.id) return names;

      const fullName =
        `${currentClient.firstName} ${currentClient.lastName}`.trim();

      names[currentClient.id] = fullName || `Cliente ${currentClient.id}`;

      return names;
    }, {});
  }, [clients]);

  const getClientDisplayName = useCallback(
    (id?: number | null) => {
      if (!id) return "-";

      return clientNameById[id] ?? `Cliente ${id}`;
    },
    [clientNameById]
  );

  const clientCryptBalances = useMemo<ClientCryptBalanceRow[]>(() => {
    if (!numericClientId || Number.isNaN(numericClientId)) return [];

    const rows = crypts.reduce<ClientCryptBalanceRow[]>((balanceRows, crypt) => {
        const currentClientId = getCryptCurrentClientId(crypt);
        const incomingTransfer = getLatestIncomingTransferForClient(
          crypt,
          numericClientId
        );
        const outgoingTransfer = getLatestOutgoingTransferForClient(
          crypt,
          numericClientId
        );
        const isCurrentOwner = currentClientId === numericClientId;
        const isBeneficiary = getCryptBeneficiaryId(crypt) === numericClientId;

        if (isCurrentOwner && incomingTransfer) {
          balanceRows.push({
            crypt,
            role: "Cliente actual",
            origin: "Deuda heredada",
            totalAmount: getEffectiveCryptTotalAmount(crypt),
            totalPaid: getEffectiveCryptTotalPaid(crypt),
            balanceDue: getEffectiveCryptBalanceDue(crypt),
            date: getTransferDate(incomingTransfer),
            note: `Heredada de ${getClientDisplayName(
              incomingTransfer.fromClientId
            )}${
              getTransferReason(incomingTransfer)
                ? `: ${getTransferReason(incomingTransfer)}`
                : ""
            }`,
            badgeClassName: "badge-inherited",
          });

          return balanceRows;
        }

        if (isCurrentOwner) {
          balanceRows.push({
            crypt,
            role: "Cliente actual",
            origin: "Precio de cripta",
            totalAmount: crypt.balance?.totalAmount ?? crypt.cost,
            totalPaid: crypt.balance?.totalPaid ?? 0,
            balanceDue: crypt.balance?.balanceDue ?? crypt.cost,
            date: crypt.purchasedAt,
            badgeClassName: "badge-direct",
          });

          return balanceRows;
        }

        if (outgoingTransfer) {
          balanceRows.push({
            crypt,
            role: "Cliente anterior",
            origin: "Deuda transferida",
            totalAmount: getTransferDebtAmount(outgoingTransfer) ?? 0,
            totalPaid: null,
            balanceDue: getTransferDebtAmount(outgoingTransfer) ?? 0,
            date: getTransferDate(outgoingTransfer),
            note: `Transferida a ${getClientDisplayName(
              getTransferToClientId(outgoingTransfer)
            )}${
              getTransferReason(outgoingTransfer)
                ? `: ${getTransferReason(outgoingTransfer)}`
                : ""
            }`,
            badgeClassName: "badge-inherited",
          });

          return balanceRows;
        }

        if (isBeneficiary) {
          balanceRows.push({
            crypt,
            role: "Beneficiario",
            origin: "Beneficiario asignado",
            totalAmount: null,
            totalPaid: null,
            balanceDue: null,
            date: null,
            badgeClassName: "badge-role-beneficiary",
          });
        }

        return balanceRows;
      }, []);

    return rows.sort((firstRow, secondRow) =>
      getCryptCode(firstRow.crypt).localeCompare(
        getCryptCode(secondRow.crypt),
        "es-MX",
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  }, [crypts, getClientDisplayName, numericClientId]);

  const handleBack = () => {
    if (fromParam === "crypts") {
      navigate("/crypts");
      return;
    }

    navigate("/clients");
  };

  const handleFilterChange = async (cryptId?: number) => {
    const newParams = new URLSearchParams(searchParams);

    if (cryptId) {
      newParams.set("cryptId", cryptId.toString());
    } else {
      newParams.delete("cryptId");
    }

    if (fromParam) {
      newParams.set("from", fromParam);
    }

    setSearchParams(newParams);
    await handleCryptFilterChange(cryptId);
  };

  const handleClearFilters = async () => {
    await handleFilterChange(undefined);
  };

  const handleEditPayment = (payment: Payment) => {
    setPageError("");
    setPageMessage("");
    setSelectedPayment(payment);
  };

  const handleUpdatePayment = async (payment: PaymentPayload) => {
    if (!payment.id || savingPayment) return;

    try {
      setSavingPayment(true);
      setPageError("");
      setPageMessage("");

      await apiService.payments.update(payment.id, payment);

      setSelectedPayment(null);
      setPageMessage("Pago actualizado correctamente.");

      await handleCryptFilterChange(selectedCryptId);
      await loadClient();
    } catch (error) {
      console.error("Error updating payment:", error);
      setPageError(getApiErrorMessage(error, "No se pudo actualizar el pago."));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleClosePaymentModal = () => {
    if (savingPayment) return;
    setSelectedPayment(null);
  };

  if (!numericClientId || Number.isNaN(numericClientId)) {
    return (
      <section className="page-container">
        <h1>Detalle de cliente</h1>
        <p className="error-message">El cliente no es válido.</p>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/clients")}
        >
          Volver a clientes
        </button>
      </section>
    );
  }

  const isPageLoading = loading || clientLoading || cryptsLoading || clientsLoading;

  return (
    <>
      <PageLoader
        visible={isPageLoading}
        message="Cargando historial..."
      />
      <section
        className={`page-container ${isPageLoading ? "page-content-loading" : ""}`}
      >
      <div className="page-header">
        <div>
          <h1>Detalle de cliente</h1>

          {clientLoading && <p>Cargando información del cliente...</p>}

          {!clientLoading && client && (
            <p>
              Cliente:{" "}
              <strong>
                {client.firstName} {client.lastName}
              </strong>
            </p>
          )}

          {selectedCryptId && (
            <p>
              Filtro aplicado: <strong>Cripta {selectedCryptId}</strong>
            </p>
          )}
        </div>

        <button type="button" className="btn-secondary" onClick={handleBack}>
          {fromParam === "crypts" ? "Volver a criptas" : "Volver a clientes"}
        </button>
      </div>

      <div className="toast-stack">
        <ToastMessage
          type="error"
          message={clientError}
          onClose={() => setClientError("")}
        />
        <ToastMessage
          type="error"
          message={clientsError}
          onClose={() => setClientsError("")}
        />
        <ToastMessage type="error" message={error} />
        <ToastMessage
          type="error"
          message={pageError}
          onClose={() => setPageError("")}
        />
        <ToastMessage
          type="success"
          message={pageMessage}
          onClose={() => setPageMessage("")}
        />
      </div>

      {client && (
        <div className="summary-container">
          <div className="summary-card">
            <span>Criptas</span>
            <strong>{client.balance?.cryptsCount ?? 0}</strong>
          </div>

          <div className="summary-card">
            <span>Costo total</span>
            <strong>{formatCurrency(client.balance?.totalAmount)}</strong>
          </div>

          <div className="summary-card">
            <span>Total pagado</span>
            <strong>{formatCurrency(client.balance?.totalPaid)}</strong>
          </div>

          <div className="summary-card">
            <span>Saldo pendiente</span>
            <strong>{formatCurrency(client.balance?.balanceDue)}</strong>
          </div>

          <div className="summary-card">
            <span>Pagos filtrados</span>
            <strong>{formatCurrency(totalFilteredPaid)}</strong>
          </div>
        </div>
      )}

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Balance por cripta</h3>
          <span>{clientCryptBalances.length} registros</span>
        </div>

        {cryptsLoading && <p>Cargando balances por cripta...</p>}
        {cryptsError && <p className="error-message">{cryptsError}</p>}

        {!cryptsLoading && !cryptsError && clientCryptBalances.length === 0 && (
          <p className="empty-message">
            Este cliente no tiene criptas, beneficiarios ni deudas transferidas.
          </p>
        )}

        {!cryptsLoading && !cryptsError && clientCryptBalances.length > 0 && (
          <div className="table-container client-balance-table">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Cripta</th>
                  <th>Rol</th>
                  <th>Origen</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Fecha</th>
                  <th>Nota</th>
                </tr>
              </thead>

              <tbody>
                {clientCryptBalances.map((row) => (
                  <tr key={`${row.crypt.id}-${row.role}-${row.origin}`}>
                    <td>{getCryptCode(row.crypt)}</td>
                    <td>{row.role}</td>
                    <td>
                      <span className={`badge ${row.badgeClassName}`}>
                        {row.origin}
                      </span>
                    </td>
                    <td>
                      {row.totalAmount === null
                        ? "-"
                        : formatCurrency(row.totalAmount)}
                    </td>
                    <td>
                      {row.totalPaid === null
                        ? "-"
                        : formatCurrency(row.totalPaid)}
                    </td>
                    <td>
                      {row.balanceDue === null
                        ? "-"
                        : formatCurrency(row.balanceDue)}
                    </td>
                    <td>{formatBackendDate(row.date, "-")}</td>
                    <td className="table-text-cell">{row.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <h3>Historial de pagos</h3>
        </div>

        <div className="filters-container client-history-filters">
          <div className="form-group">
            <label>Filtrar por cripta</label>
            <select
              value={selectedCryptId ?? ""}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "") {
                  handleFilterChange(undefined);
                  return;
                }

                handleFilterChange(Number(value));
              }}
              disabled={loading || savingPayment}
            >
              <option value="">Todas las criptas</option>

              {selectedCryptId && cryptOptions.length === 0 && (
                <option value={selectedCryptId}>Cripta {selectedCryptId}</option>
              )}

              {cryptOptions.map((crypt) => (
                <option key={crypt.id} value={crypt.id}>
                  {crypt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filters-inline-action">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClearFilters}
              disabled={loading || savingPayment || !selectedCryptId}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {loading && <p>Cargando pagos...</p>}

        {!loading && payments.length === 0 && (
          <p className="empty-message">
            Este cliente todavía no tiene pagos registrados.
          </p>
        )}

        {!loading && payments.length > 0 && (
          <PaymentHistoryTable
            payments={payments}
            onEditPayment={handleEditPayment}
          />
        )}
      </section>

      <Modal
        isOpen={selectedPayment !== null}
        title="Editar pago"
        onClose={handleClosePaymentModal}
      >
        <PaymentForm
          payment={selectedPayment}
          saving={savingPayment}
          onSubmit={handleUpdatePayment}
          onCancel={handleClosePaymentModal}
        />
      </Modal>
      </section>
    </>
  );
}

export default ClientPaymentHistoryPage;
