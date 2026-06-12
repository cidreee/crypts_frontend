import { useEffect, useMemo, useState } from "react";
import { useCrypts } from "../hooks/useCrypts";
import { apiService } from "../services/apiService";
import type { Crypt } from "../types/crypt";
import type { Payment } from "../types/payment";
import type { Client } from "../types/client";
import CryptTable from "../components/crypts/CryptTable";
import CryptForm from "../components/crypts/CryptForm";
import SaleForm from "../components/crypts/SaleForm";
import PaymentForm from "../components/payment/PaymentForm";
import Modal from "../components/common/Modal";

type AvailabilityFilter = "all" | "available" | "occupied";

function CryptsPage() {
  const { crypts, loading, error, loadCrypts } = useCrypts();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const [selectedCrypt, setSelectedCrypt] = useState<Crypt | null>(null);
  const [selectedCryptForSale, setSelectedCryptForSale] =
    useState<Crypt | null>(null);
  const [selectedCryptForPayment, setSelectedCryptForPayment] =
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

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      const data = await apiService.clients.getClientsBalance();
      setClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
      setPageError("No se pudieron cargar los clientes.");
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredCrypts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return crypts.filter((crypt) => {
      const cryptCode = `${crypt.section}-${crypt.letter}-${crypt.number}`;
      const clientName = crypt.client
        ? `${crypt.client.firstName} ${crypt.client.lastName}`
        : "";

      const matchesSearch =
        normalizedSearch === "" ||
        cryptCode.toLowerCase().includes(normalizedSearch) ||
        crypt.section.toString().includes(normalizedSearch) ||
        crypt.letter.toLowerCase().includes(normalizedSearch) ||
        crypt.number.toLowerCase().includes(normalizedSearch) ||
        clientName.toLowerCase().includes(normalizedSearch);

      const isAvailable = Boolean(crypt.isAvailable);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && isAvailable) ||
        (availabilityFilter === "occupied" && !isAvailable);

      return matchesSearch && matchesAvailability;
    });
  }, [crypts, searchTerm, availabilityFilter]);

  const cryptSummary = useMemo(() => {
    const totalCrypts = crypts.length;
    const availableCrypts = crypts.filter((crypt) => crypt.isAvailable).length;
    const occupiedCrypts = crypts.filter((crypt) => !crypt.isAvailable).length;

    return {
      totalCrypts,
      availableCrypts,
      occupiedCrypts,
    };
  }, [crypts]);

  const clearPageMessages = () => {
    setPageError("");
    setPageMessage("");
  };

  const handleEditCrypt = (crypt: Crypt) => {
    clearPageMessages();
    setSelectedCrypt(crypt);
  };

  const handleUpdateCrypt = async (crypt: Crypt) => {
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
      setPageError("No se pudo actualizar la cripta.");
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
    clientData: number | Client,
    initialPayment?: Payment
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
          clientData as Client
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
      setPageError("No se pudo registrar la venta.");
    } finally {
      setSavingSale(false);
    }
  };

  const handleRegisterPayment = (crypt: Crypt) => {
    clearPageMessages();

    if (!crypt.id) {
      setPageError("La cripta seleccionada no es válida.");
      return;
    }

    if (crypt.isAvailable) {
      setPageError("No se puede registrar un pago en una cripta disponible.");
      return;
    }

    setSelectedCryptForPayment(crypt);
  };

  const handleCreatePayment = async (payment: Payment) => {
    if (!selectedCryptForPayment?.id || savingPayment) return;

    try {
      setSavingPayment(true);
      clearPageMessages();

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
      setPageError("No se pudo registrar el pago.");
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

    const confirmed = window.confirm(
      "¿Seguro que deseas cancelar esta compra? Los pagos quedarán inactivos y la cripta volverá a estar disponible."
    );

    if (!confirmed) return;

    try {
      setCancelingPurchase(true);
      clearPageMessages();

      await apiService.crypts.cancelPurchase(crypt.id);

      setPageMessage("Compra cancelada correctamente.");

      await loadCrypts();
      await loadClients();
    } catch (err) {
      console.error("Error canceling purchase:", err);
      setPageError("No se pudo cancelar la compra.");
    } finally {
      setCancelingPurchase(false);
    }
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
    setSelectedCryptForPayment(null);
  };

  return (
    <section className="page-container">
      <div className="page-header">
        <div>
          <h1>Criptas</h1>
          <p>Consulta, edita y administra ventas de criptas.</p>
        </div>
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
      </div>

      <div className="filters-container">
        <div className="form-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por cripta o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={
              savingCrypt ||
              savingSale ||
              savingPayment ||
              cancelingPurchase
            }
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            value={availabilityFilter}
            onChange={(e) =>
              setAvailabilityFilter(e.target.value as AvailabilityFilter)
            }
            disabled={
              savingCrypt ||
              savingSale ||
              savingPayment ||
              cancelingPurchase
            }
          >
            <option value="all">Todas</option>
            <option value="available">Disponibles</option>
            <option value="occupied">Ocupadas</option>
          </select>
        </div>
      </div>

      <p className="results-count">
        Mostrando {filteredCrypts.length} de {crypts.length} criptas
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
        />
      )}

      <Modal
        isOpen={selectedCrypt !== null}
        title="Editar cripta"
        onClose={handleCloseCryptModal}
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
      >
        {selectedCryptForSale && (
          <SaleForm
            clients={clients.filter((client) => client.isActive)}
            saving={savingSale}
            onSubmit={handleCreateSale}
            onCancel={handleCloseSaleModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedCryptForPayment !== null}
        title="Registrar pago"
        onClose={handleClosePaymentModal}
      >
        {selectedCryptForPayment?.id && (
          <PaymentForm
            cryptId={selectedCryptForPayment.id}
            saving={savingPayment}
            onSubmit={handleCreatePayment}
            onCancel={handleClosePaymentModal}
          />
        )}
      </Modal>
    </section>
  );
}

export default CryptsPage;