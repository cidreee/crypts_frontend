import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { usePayments } from "../hooks/usePayments";
import type { Client } from "../types/client";
import type { Payment, PaymentPayload } from "../types/payment";
import { formatCurrency } from "../utils/currency";
import { getApiErrorMessage } from "../utils/apiError";
import PaymentHistoryTable from "../components/clients/PaymentHistoryTable";
import PaymentForm from "../components/payment/PaymentForm";
import Modal from "../components/common/Modal";

function ClientPaymentHistoryPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const numericClientId = Number(clientId);

  const {
    payments,
    selectedCryptId,
    loading,
    error,
    handleCryptFilterChange,
  } = usePayments(numericClientId);

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");

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

  const cryptOptions = useMemo(() => {
    const map = new Map<number, string>();

    payments.forEach((payment) => {
      if (!map.has(payment.cryptId)) {
        const label =
          payment.crypt?.code ??
          payment.crypt?.name ??
          `Cripta ${payment.cryptId}`;

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
        <h1>Historial de pagos</h1>
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

  return (
    <section className="page-container">
      <div className="page-header">
        <div>
          <h1>Historial de pagos</h1>

          {clientLoading && <p>Cargando información del cliente...</p>}

          {!clientLoading && client && (
            <p>
              Cliente:{" "}
              <strong>
                {client.firstName} {client.lastName}
              </strong>
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/clients")}
        >
          Volver a clientes
        </button>
      </div>

      {clientError && <p className="error-message">{clientError}</p>}
      {error && <p className="error-message">{error}</p>}
      {pageError && <p className="error-message">{pageError}</p>}
      {pageMessage && <p className="success-message">{pageMessage}</p>}

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

      <div className="filters-container">
        <div className="form-group">
          <label>Filtrar por cripta</label>
          <select
            value={selectedCryptId ?? ""}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                handleCryptFilterChange(undefined);
                return;
              }

              handleCryptFilterChange(Number(value));
            }}
            disabled={loading || savingPayment}
          >
            <option value="">Todas las criptas</option>

            {cryptOptions.map((crypt) => (
              <option key={crypt.id} value={crypt.id}>
                {crypt.label}
              </option>
            ))}
          </select>
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
  );
}

export default ClientPaymentHistoryPage;
