// src/pages/CryptsPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCrypts } from "../hooks/useCrypts";
import { apiService } from "../services/apiService";
import type { Crypt, CryptPayload } from "../types/crypt";
import type { PaymentPayload } from "../types/payment";
import type { Client, ClientPayload } from "../types/client";
import CryptTable from "../components/crypts/CryptTable";
import CryptForm from "../components/crypts/CryptForm";
import SaleForm from "../components/crypts/SaleForm";
import PaymentForm from "../components/payment/PaymentForm";
import Modal from "../components/common/Modal";
import ConfirmModal from "../components/common/ConfirmModal";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/format";
import { useNavigate } from "react-router-dom";

type AvailabilityFilter = "all" | "available" | "occupied";

function CryptsPage() {
  const { crypts, loading, error, loadCrypts } = useCrypts();

  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const [isCreateCryptModalOpen, setIsCreateCryptModalOpen] = useState(false);
  const [selectedCrypt, setSelectedCrypt] = useState<Crypt | null>(null);

  const [selectedCryptForSale, setSelectedCryptForSale] =
    useState<Crypt | null>(null);

  const [selectedCryptForPayment, setSelectedCryptForPayment] =
    useState<Crypt | null>(null);

  const [cryptToCancelPurchase, setCryptToCancelPurchase] =
    useState<Crypt | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");

  const [savingCrypt, setSavingCrypt] = useState(false);
  const [savingSale, setSavingSale] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [cancelingPurchase, setCancelingPurchase] = useState(false);

  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [paymentModalError, setPaymentModalError] = useState("");

  const isBusy =
    savingCrypt || savingSale || savingPayment || cancelingPurchase;

  const validCrypts = useMemo(() => {
    return crypts.filter(
      (crypt): crypt is Crypt => crypt !== null && crypt !== undefined
    );
  }, [crypts]);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);

      const data = await apiService.clients.getClientsBalance();

      const safeClients = Array.isArray(data)
        ? data.filter(
            (client): client is Client =>
              client !== null && client !== undefined
          )
        : [];

      setClients(safeClients);
    } catch (err) {
      console.error("Error loading clients:", err);
      setPageError(
        getApiErrorMessage(err, "No se pudieron cargar los clientes.")
      );
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredCrypts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return validCrypts.filter((crypt) => {
      const section = crypt.section?.toString() ?? "";
      const letter = crypt.letter?.toLowerCase() ?? "";
      const number = crypt.number?.toLowerCase() ?? "";

      const cryptCode = `${section}-${letter}-${number}`;

      const clientName = crypt.client
        ? `${crypt.client.firstName ?? ""} ${
            crypt.client.lastName ?? ""
          }`.toLowerCase()
        : "";

      const matchesSearch =
        normalizedSearch === "" ||
        cryptCode.includes(normalizedSearch) ||
        section.includes(normalizedSearch) ||
        letter.includes(normalizedSearch) ||
        number.includes(normalizedSearch) ||
        clientName.includes(normalizedSearch);

      const isAvailable = Boolean(crypt.isAvailable);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && isAvailable) ||
        (availabilityFilter === "occupied" && !isAvailable);

      return matchesSearch && matchesAvailability;
    });
  }, [validCrypts, searchTerm, availabilityFilter]);

  const cryptSummary = useMemo(() => {
    const totalCrypts = validCrypts.length;

    const availableCrypts = validCrypts.filter((crypt) =>
      Boolean(crypt.isAvailable)
    ).length;

    const occupiedCrypts = validCrypts.filter(
      (crypt) => !Boolean(crypt.isAvailable)
    ).length;

  const soldCrypts = validCrypts.filter((crypt) => !crypt.isAvailable);

  const totalAmount = soldCrypts.reduce((sum, crypt) => {
    return sum + (crypt.balance?.totalAmount ?? crypt.cost ?? 0);
  }, 0);

  const totalPaid = soldCrypts.reduce((sum, crypt) => {
    return sum + (crypt.balance?.totalPaid ?? 0);
  }, 0);

  const totalBalanceDue = soldCrypts.reduce((sum, crypt) => {
    return sum + (crypt.balance?.balanceDue ?? 0);
  }, 0);

    return {
      totalCrypts,
      availableCrypts,
      occupiedCrypts,
      totalAmount,
      totalPaid,
      totalBalanceDue,
    };
  }, [validCrypts]);

  const clearPageMessages = () => {
    setPageError("");
    setPageMessage("");
  };

  const handleOpenCreateCryptModal = () => {
    clearPageMessages();
    setIsCreateCryptModalOpen(true);
  };

  const handleViewPayments = (crypt: Crypt) => {
    clearPageMessages();

    const finalClientId = crypt.clientId ?? crypt.client?.id;

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (!finalClientId) {
      setPageError("Esta cripta no tiene cliente asignado.");
      return;
    }

    navigate(`/clients/${finalClientId}/payments?cryptId=${crypt.id}&from=crypts`);
  };

  const handleCreateCrypt = async (crypt: CryptPayload) => {
    if (savingCrypt) return;

    try {
      setSavingCrypt(true);
      clearPageMessages();

      await apiService.crypts.create(crypt);

      setIsCreateCryptModalOpen(false);
      setPageMessage("Cripta registrada correctamente.");

      await loadCrypts();
    } catch (err) {
      console.error("Error creating crypt:", err);
      setPageError(getApiErrorMessage(err, "No se pudo registrar la cripta."));
    } finally {
      setSavingCrypt(false);
    }
  };

  const handleEditCrypt = (crypt: Crypt) => {
    clearPageMessages();
    setSelectedCrypt(crypt);
  };

  const handleUpdateCrypt = async (crypt: CryptPayload) => {
    if (!crypt.id || savingCrypt) return;

    try {
      setSavingCrypt(true);
      clearPageMessages();

      await apiService.crypts.update(crypt.id, crypt);

      setSelectedCrypt(null);
      setPageMessage("Cripta actualizada correctamente.");

      await loadCrypts();
    } catch (err) {
      console.error("Error updating crypt:", err);
      setPageError(getApiErrorMessage(err, "No se pudo actualizar la cripta."));
    } finally {
      setSavingCrypt(false);
    }
  };

  const handleRegisterSale = (crypt: Crypt) => {
    clearPageMessages();

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (!crypt.isAvailable) {
      setPageError("Esta cripta ya está ocupada.");
      return;
    }

    setSelectedCryptForSale(crypt);
  };

  const handleCreateSale = async (
    mode: "existing" | "new",
    clientData: number | ClientPayload,
    initialPayment?: PaymentPayload
  ) => {
    if (!selectedCryptForSale?.id || savingSale) return;

    try {
      setSavingSale(true);
      clearPageMessages();

      let clientId: number | undefined;

      if (mode === "existing") {
        clientId = clientData as number;
      }

      if (mode === "new") {
        const createdClient = await apiService.clients.create(
          clientData as ClientPayload
        );

        clientId = createdClient.id;
      }

      if (!clientId) {
        setPageError("No se pudo identificar el cliente para la venta.");
        return;
      }

      const assignedCrypt = await apiService.crypts.assignOwner(
        selectedCryptForSale.id,
        clientId
      );

      if (initialPayment) {
        await apiService.payments.create({
          ...initialPayment,
          cryptId: assignedCrypt.id ?? selectedCryptForSale.id,
        });
      }

      setSelectedCryptForSale(null);
      setPageMessage("Venta registrada correctamente.");

      await loadCrypts();
      await loadClients();
    } catch (err) {
      console.error("Error creating sale:", err);
      setPageError(getApiErrorMessage(err, "No se pudo registrar la venta."));
    } finally {
      setSavingSale(false);
    }
  };

  const handleRegisterPayment = (crypt: Crypt) => {
    clearPageMessages();
    setPaymentModalError("");

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (crypt.isAvailable) {
      setPageError("No se puede registrar un pago en una cripta disponible.");
      return;
    }

    const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

    if (balanceDue <= 0) {
      setPageError("Esta cripta ya está liquidada.");
      return;
    }

    setSelectedCryptForPayment(crypt);
  };

  const handleCreatePayment = async (
    payment: PaymentPayload
  ): Promise<void> => {
    if (!selectedCryptForPayment?.id || savingPayment) return;

    try {
      setSavingPayment(true);
      clearPageMessages();
      setPaymentModalError("");

      await apiService.payments.create({
        ...payment,
        cryptId: selectedCryptForPayment.id,
      });

      setSelectedCryptForPayment(null);
      setPageMessage("Pago registrado correctamente.");

      await loadCrypts();
      await loadClients();
    } catch (err) {
      console.error("Error creating payment:", err);

      const message = getApiErrorMessage(err, "No se pudo registrar el pago.");
      setPaymentModalError(message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCancelPurchase = async (crypt: Crypt) => {
    if (!crypt.id || cancelingPurchase) return;

    if (crypt.isAvailable) {
      setPageError("Esta cripta no tiene una compra activa para cancelar.");
      return;
    }

    clearPageMessages();
    setCryptToCancelPurchase(crypt);
  };

  const handleConfirmCancelPurchase = async () => {
    if (!cryptToCancelPurchase?.id || cancelingPurchase) return;

    try {
      setCancelingPurchase(true);
      clearPageMessages();

      await apiService.crypts.cancelPurchase(cryptToCancelPurchase.id);

      setCryptToCancelPurchase(null);
      setPageMessage("Compra cancelada correctamente.");

      await loadCrypts();
      await loadClients();
    } catch (err) {
      console.error("Error canceling purchase:", err);
      setPageError(getApiErrorMessage(err, "No se pudo cancelar la compra."));
    } finally {
      setCancelingPurchase(false);
    }
  };

  const handleCloseCreateCryptModal = () => {
    if (savingCrypt) return;
    setIsCreateCryptModalOpen(false);
  };

  const handleCloseCryptModal = () => {
    if (savingCrypt) return;
    setSelectedCrypt(null);
  };

  const handleCloseSaleModal = () => {
    if (savingSale) return;
    setSelectedCryptForSale(null);
  };

  const handleClosePaymentModal = () => {
    if (savingPayment) return;

    setPaymentModalError("");
    setSelectedCryptForPayment(null);
  };

  return (
    <section className="page-container">
      <div className="page-header">
        <div>
          <h1>Criptas</h1>
          <p>Consulta, edita y administra ventas de criptas.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenCreateCryptModal}
          disabled={isBusy}
        >
          Registrar cripta
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {pageError && <p className="error-message">{pageError}</p>}
      {pageMessage && <p className="success-message">{pageMessage}</p>}

      <div className="summary-container">
        <div className="summary-card">
          <span>Total criptas</span>
          <strong>{cryptSummary.totalCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Disponibles</span>
          <strong>{cryptSummary.availableCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Ocupadas</span>
          <strong>{cryptSummary.occupiedCrypts}</strong>
        </div>

        <div className="summary-card">
          <span>Total vendido</span>
          <strong>{formatCurrency(cryptSummary.totalAmount)}</strong>
        </div>

        <div className="summary-card">
          <span>Total pagado</span>
          <strong>{formatCurrency(cryptSummary.totalPaid)}</strong>
        </div>

        <div className="summary-card">
          <span>Total pendiente</span>
          <strong>{formatCurrency(cryptSummary.totalBalanceDue)}</strong>
        </div>
      </div>

      <div className="filters-container">
        <div className="form-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por cripta o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isBusy}
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            value={availabilityFilter}
            onChange={(e) =>
              setAvailabilityFilter(e.target.value as AvailabilityFilter)
            }
            disabled={isBusy}
          >
            <option value="all">Todas</option>
            <option value="available">Disponibles</option>
            <option value="occupied">Ocupadas</option>
          </select>
        </div>
      </div>

      <p className="results-count">
        Mostrando {filteredCrypts.length} de {cryptSummary.totalCrypts} criptas
      </p>

      {clientsLoading && <p>Cargando clientes...</p>}

      {loading && <p>Cargando criptas...</p>}

      {!loading && filteredCrypts.length === 0 && (
        <p className="empty-message">
          No se encontraron criptas con los filtros seleccionados.
        </p>
      )}

      {!loading && filteredCrypts.length > 0 && (
        <CryptTable
          crypts={filteredCrypts}
          onEditCrypt={handleEditCrypt}
          onRegisterSale={handleRegisterSale}
          onRegisterPayment={handleRegisterPayment}
          onCancelPurchase={handleCancelPurchase}
          onViewPayments={handleViewPayments}
        />
      )}

      <Modal
        isOpen={isCreateCryptModalOpen}
        title="Registrar cripta"
        onClose={handleCloseCreateCryptModal}
        closeDisabled={savingCrypt}
      >
        <CryptForm
          saving={savingCrypt}
          onSubmit={handleCreateCrypt}
          onCancel={handleCloseCreateCryptModal}
        />
      </Modal>

      <Modal
        isOpen={selectedCrypt !== null}
        title="Editar cripta"
        onClose={handleCloseCryptModal}
        closeDisabled={savingCrypt}
      >
        {selectedCrypt && (
          <CryptForm
            crypt={selectedCrypt}
            saving={savingCrypt}
            onSubmit={handleUpdateCrypt}
            onCancel={handleCloseCryptModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForSale !== null}
        title="Registrar venta"
        onClose={handleCloseSaleModal}
        closeDisabled={savingSale}
      >
        {selectedCryptForSale && (
          <SaleForm
            clients={clients.filter((client) => client.isActive)}
            saving={savingSale}
            maxInitialPayment={
              selectedCryptForSale.balance?.balanceDue ??
              selectedCryptForSale.cost
            }
            onSubmit={handleCreateSale}
            onCancel={handleCloseSaleModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForPayment !== null}
        title="Registrar pago"
        onClose={handleClosePaymentModal}
        closeDisabled={savingPayment}
      >
        {selectedCryptForPayment?.id && (
          <PaymentForm
            cryptId={selectedCryptForPayment.id}
            saving={savingPayment}
            maxAmount={
              selectedCryptForPayment.balance?.balanceDue ??
              selectedCryptForPayment.cost
            }
            serverError={paymentModalError}
            onSubmit={handleCreatePayment}
            onCancel={handleClosePaymentModal}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={cryptToCancelPurchase !== null}
        title="Cancelar compra"
        message="Los pagos quedarán inactivos y la cripta volverá a estar disponible."
        confirmLabel="Cancelar compra"
        confirming={cancelingPurchase}
        onConfirm={handleConfirmCancelPurchase}
        onCancel={() => {
          if (!cancelingPurchase) {
            setCryptToCancelPurchase(null);
          }
        }}
      />
    </section>
  );
}

export default CryptsPage;