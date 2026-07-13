import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useClients } from "../hooks/useClients";
import { apiService } from "../services/apiService";
import type { Client } from "../types/client";
import type { Crypt } from "../types/crypt";
import type { Payment } from "../types/payment";
import { formatCurrency } from "../utils/currency";
import {
  getCryptBeneficiaryId,
  getCryptCurrentClientId,
  getCryptOwnershipTransfers,
  getEffectiveCryptTotalAmount,
  getLatestIncomingTransferForClient,
  getTransferFromClientId,
} from "../utils/cryptOwnership";
import ClientTable, {
  type ClientFinancialStats,
  type ClientRoleStats,
} from "../components/clients/ClientTable";
import ClientForm from "../components/clients/ClientForm";
import Modal from "../components/common/Modal";
import ToastMessage from "../components/common/ToastMessage";
import PageLoader from "../components/common/PageLoader";

type StatusFilter = "all" | "active" | "inactive";
type BalanceFilter = "all" | "withDebt" | "withoutDebt";

function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    clients,
    loading,
    saving,
    error,
    successMessage,
    createClient,
    updateClient,
    deactivateClient,
    clearMessages,
  } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDeactivate, setClientToDeactivate] = useState<Client | null>(
    null
  );
  const [deactivationReason, setDeactivationReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [crypts, setCrypts] = useState<Crypt[]>([]);
  const [cryptsLoading, setCryptsLoading] = useState(false);
  const [cryptsError, setCryptsError] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [pageError, setPageError] = useState("");
  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(searchParamsKey);
    const balanceParam = currentSearchParams.get("balance");
    const statusParam = currentSearchParams.get("status");
    const searchParam = currentSearchParams.get("search");

    setBalanceFilter(
      balanceParam === "withDebt" || balanceParam === "withoutDebt"
        ? balanceParam
        : "all"
    );
    setStatusFilter(
      statusParam === "active" || statusParam === "inactive"
        ? statusParam
        : "all"
    );
    setSearchTerm(searchParam ?? "");
  }, [searchParamsKey]);

  const loadCrypts = useCallback(async () => {
    try {
      setCryptsLoading(true);
      setCryptsError("");

      const data = await apiService.crypts.getAll();

      setCrypts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading client roles:", err);
      setCryptsError(
        "No se pudieron cargar los roles de clientes y beneficiarios."
      );
      setCrypts([]);
    } finally {
      setCryptsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrypts();
  }, [loadCrypts]);

  const loadPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError("");

      const data = await apiService.payments.getHistory();

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading client payment totals:", err);
      setPaymentsError("No se pudieron cargar los totales pagados por cliente.");
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setBalanceFilter("all");
    setSearchParams({});
  };

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const roleStatsByClientId = useMemo(() => {
    const stats: Record<number, ClientRoleStats> = {};

    const ensureStats = (clientId: number) => {
      stats[clientId] ??= {
        currentCryptsCount: 0,
        beneficiaryCryptsCount: 0,
        inheritedCryptsCount: 0,
        transferredDebtCryptsCount: 0,
      };

      return stats[clientId];
    };

    clients.forEach((client) => {
      if (client.id) ensureStats(client.id);
    });

    crypts.forEach((crypt) => {
      const currentClientId = getCryptCurrentClientId(crypt);

      if (currentClientId) {
        const currentStats = ensureStats(currentClientId);

        currentStats.currentCryptsCount += 1;

        if (getLatestIncomingTransferForClient(crypt, currentClientId)) {
          currentStats.inheritedCryptsCount += 1;
        }
      }

      const beneficiaryId = getCryptBeneficiaryId(crypt);

      if (beneficiaryId) {
        ensureStats(beneficiaryId).beneficiaryCryptsCount += 1;
      }

      getCryptOwnershipTransfers(crypt).forEach((transfer) => {
        const fromClientId = getTransferFromClientId(transfer);

        if (fromClientId) {
          ensureStats(fromClientId).transferredDebtCryptsCount += 1;
        }
      });
    });

    return stats;
  }, [clients, crypts]);

  const financialStatsByClientId = useMemo(() => {
    const stats: Record<number, ClientFinancialStats> = {};

    const ensureStats = (clientId: number) => {
      stats[clientId] ??= {
        totalAmount: 0,
        totalPaid: 0,
        balanceDue: 0,
        paidIsHistorical: false,
      };

      return stats[clientId];
    };

    clients.forEach((client) => {
      if (client.id) ensureStats(client.id);
    });

    payments.forEach((payment) => {
      if (!payment.paidByClientId || payment.isActive === false) return;

      ensureStats(payment.paidByClientId).totalPaid += payment.amount;
    });

    crypts.forEach((crypt) => {
      const currentClientId = getCryptCurrentClientId(crypt);

      if (currentClientId) {
        const currentStats = ensureStats(currentClientId);
        const totalAmount = getEffectiveCryptTotalAmount(crypt);
        const paidByCurrentClient = payments.reduce((sum, payment) => {
          if (
            payment.isActive === false ||
            payment.cryptId !== crypt.id ||
            payment.paidByClientId !== currentClientId
          ) {
            return sum;
          }

          return sum + payment.amount;
        }, 0);

        currentStats.totalAmount += totalAmount;
        currentStats.balanceDue += Math.max(totalAmount - paidByCurrentClient, 0);
      }

      getCryptOwnershipTransfers(crypt).forEach((transfer) => {
        const fromClientId = getTransferFromClientId(transfer);

        if (!fromClientId || fromClientId === currentClientId) return;

        const previousOwnerStats = ensureStats(fromClientId);

        if (previousOwnerStats.totalPaid > 0) {
          previousOwnerStats.paidIsHistorical = true;
        }
      });
    });

    return stats;
  }, [clients, crypts, payments]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const phoneNumber = client.phoneNumber?.toLowerCase() ?? "";
      const alternatePhoneNumber =
        client.alternatePhoneNumber?.toLowerCase() ?? "";
      const clientId = client.id?.toString() ?? "";

      const matchesSearch =
        normalizedSearch === "" ||
        fullName.includes(normalizedSearch) ||
        client.firstName.toLowerCase().includes(normalizedSearch) ||
        client.lastName.toLowerCase().includes(normalizedSearch) ||
        phoneNumber.includes(normalizedSearch) ||
        alternatePhoneNumber.includes(normalizedSearch) ||
        clientId === normalizedSearch;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && client.isActive) ||
        (statusFilter === "inactive" && !client.isActive);

      const balanceDue =
        (client.id ? financialStatsByClientId[client.id]?.balanceDue : undefined) ??
        client.balance?.balanceDue ??
        0;

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "withDebt" && balanceDue > 0) ||
        (balanceFilter === "withoutDebt" && balanceDue <= 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });
  }, [
    clients,
    financialStatsByClientId,
    searchTerm,
    statusFilter,
    balanceFilter,
  ]);


  const clientSummary = useMemo(() => {
    const totalClients = clients.length;

    const activeClients = clients.filter((client) => client.isActive).length;

    const inactiveClients = clients.filter((client) => !client.isActive).length;

    const clientsWithDebt = clients.filter(
      (client) =>
        ((client.id
          ? financialStatsByClientId[client.id]?.balanceDue
          : undefined) ??
          client.balance?.balanceDue ??
          0) > 0
    ).length;

    const clientsWithoutDebt = clients.filter(
      (client) =>
        ((client.id
          ? financialStatsByClientId[client.id]?.balanceDue
          : undefined) ??
          client.balance?.balanceDue ??
          0) <= 0
    ).length;

    const totalDebt = clients.reduce((sum, client) => {
      return (
        sum +
        ((client.id
          ? financialStatsByClientId[client.id]?.balanceDue
          : undefined) ??
          client.balance?.balanceDue ??
          0)
      );
    }, 0);

    const totalPaid = clients.reduce((sum, client) => {
      return (
        sum +
        ((client.id
          ? financialStatsByClientId[client.id]?.totalPaid
          : undefined) ??
          client.balance?.totalPaid ??
          0)
      );
    }, 0);

    return {
      totalClients,
      activeClients,
      inactiveClients,
      clientsWithDebt,
      clientsWithoutDebt,
      totalDebt,
      totalPaid,
    };
  }, [clients, financialStatsByClientId]);

  const handleOpenCreateModal = () => {
    clearMessages();
    setPageError("");
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    clearMessages();
    setPageError("");
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleViewPayments = (client: Client) => {
    if (!client.id) return;

    navigate(`/clients/${client.id}/payments`);
  };

  const handleRequestDeactivateClient = (client: Client) => {
    clearMessages();
    setPageError("");

    const beneficiaryCryptsCount = client.id
      ? roleStatsByClientId[client.id]?.beneficiaryCryptsCount ?? 0
      : 0;

    if (beneficiaryCryptsCount > 0) {
      setPageError(
        "No se puede desactivar este cliente porque está asignado como beneficiario."
      );
      return;
    }

    setClientToDeactivate(client);
    setDeactivationReason("");
  };

  const handleConfirmDeactivateClient = async () => {
    if (!clientToDeactivate?.id) return;

    const beneficiaryCryptsCount =
      roleStatsByClientId[clientToDeactivate.id]?.beneficiaryCryptsCount ?? 0;

    if (beneficiaryCryptsCount > 0) {
      setPageError(
        "No se puede desactivar este cliente porque está asignado como beneficiario."
      );
      setClientToDeactivate(null);
      setDeactivationReason("");
      return;
    }

    const success = await deactivateClient(
      clientToDeactivate.id,
      deactivationReason
    );

    if (success) {
      await loadCrypts();
      await loadPayments();
      setClientToDeactivate(null);
      setDeactivationReason("");
    }
  };

  const handleCloseDeactivateModal = () => {
    if (saving) return;

    setClientToDeactivate(null);
    setDeactivationReason("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const isPageLoading = loading || cryptsLoading || paymentsLoading;

  return (
    <>
      <PageLoader
        visible={isPageLoading}
        message="Cargando clientes..."
      />
      <section
        className={`page-container ${isPageLoading ? "page-content-loading" : ""}`}
      >
      <div className="page-header">
        <div>
          <h1>Clientes y beneficiarios</h1>
          <p>Consulta clientes, beneficiarios, balances e historial de pagos.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenCreateModal}
        >
          Registrar cliente
        </button>
      </div>

      <div className="toast-stack">
        <ToastMessage
          type="error"
          message={error}
          onClose={clearMessages}
        />
        <ToastMessage
          type="error"
          message={pageError}
          onClose={() => setPageError("")}
        />
        <ToastMessage
          type="error"
          message={cryptsError}
          onClose={() => setCryptsError("")}
        />
        <ToastMessage
          type="error"
          message={paymentsError}
          onClose={() => setPaymentsError("")}
        />
        <ToastMessage
          type="success"
          message={successMessage}
          onClose={clearMessages}
        />
      </div>

      <div className="summary-container">
      <div className="summary-card">
          <span>Total clientes</span>
          <strong>{clientSummary.totalClients}</strong>
        </div>

        <div className="summary-card">
          <span>Activos</span>
          <strong>{clientSummary.activeClients}</strong>
        </div>

        <div className="summary-card">
          <span>Inactivos</span>
          <strong>{clientSummary.inactiveClients}</strong>
        </div>

        <div className="summary-card">
          <span>Con deuda</span>
          <strong>{clientSummary.clientsWithDebt}</strong>
        </div>

        <div className="summary-card">
          <span>Sin deuda</span>
          <strong>{clientSummary.clientsWithoutDebt}</strong>
        </div>

        <div className="summary-card">
          <span>Total pagado</span>
          <strong>{formatCurrency(clientSummary.totalPaid)}</strong>
        </div>

        <div className="summary-card">
          <span>Saldo pendiente</span>
          <strong>{formatCurrency(clientSummary.totalDebt)}</strong>
        </div>
      </div>

      <div className="filters-container">
        <div className="form-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, celular o segundo celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <div className="form-group">
          <label>Saldo</label>
          <select
            value={balanceFilter}
            onChange={(e) =>
              setBalanceFilter(e.target.value as BalanceFilter)
            }
          >
            <option value="all">Todos</option>
            <option value="withDebt">Con deuda</option>
            <option value="withoutDebt">Sin deuda</option>
          </select>
        </div>

        <div className="filters-inline-action">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClearFilters}
            disabled={loading || saving}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <p className="results-count">
        Mostrando {filteredClients.length} de {clients.length} clientes
      </p>

      {loading && <p>Cargando clientes...</p>}

      {!loading && (
        <ClientTable
          clients={filteredClients}
          roleStatsByClientId={roleStatsByClientId}
          financialStatsByClientId={financialStatsByClientId}
          onEditClient={handleEditClient}
          onViewPayments={handleViewPayments}
          onDeactivateClient={handleRequestDeactivateClient}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        title={selectedClient ? "Editar cliente" : "Registrar cliente"}
        onClose={handleCloseModal}
      >
        <ClientForm
          selectedClient={selectedClient}
          saving={saving}
          onCreateClient={createClient}
          onUpdateClient={updateClient}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={clientToDeactivate !== null}
        title="Desactivar cliente"
        onClose={handleCloseDeactivateModal}
      >
        <div className="form-container">
          <p className="confirm-message">
            ¿Seguro que quieres desactivar este cliente?
          </p>

          <div className="form-group form-group-full">
            <label htmlFor="deactivation-reason">Motivo</label>
            <textarea
              id="deactivation-reason"
              value={deactivationReason}
              onChange={(event) => setDeactivationReason(event.target.value)}
              disabled={saving}
              maxLength={240}
              placeholder="Opcional"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCloseDeactivateModal}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-danger"
              onClick={handleConfirmDeactivateClient}
              disabled={saving}
            >
              {saving ? "Procesando..." : "Desactivar cliente"}
            </button>
          </div>
        </div>
      </Modal>
      </section>
    </>
  );
}

export default ClientsPage;
