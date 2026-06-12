import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients } from "../hooks/useClients";
import type { Client } from "../types/client";
import ClientTable from "../components/clients/ClientTable";
import ClientForm from "../components/clients/ClientForm";
import Modal from "../components/common/Modal";

type StatusFilter = "all" | "active" | "inactive";
type BalanceFilter = "all" | "withDebt" | "withoutDebt";

function ClientsPage() {
  const navigate = useNavigate();

  const {
    clients,
    loading,
    saving,
    error,
    successMessage,
    createClient,
    updateClient,
    clearMessages,
  } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const phoneNumber = client.phoneNumber?.toLowerCase() ?? "";

      const matchesSearch =
        normalizedSearch === "" ||
        fullName.includes(normalizedSearch) ||
        client.firstName.toLowerCase().includes(normalizedSearch) ||
        client.lastName.toLowerCase().includes(normalizedSearch) ||
        phoneNumber.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && client.isActive) ||
        (statusFilter === "inactive" && !client.isActive);

      const balanceDue = client.balance?.balanceDue ?? 0;

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "withDebt" && balanceDue > 0) ||
        (balanceFilter === "withoutDebt" && balanceDue <= 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });
  }, [clients, searchTerm, statusFilter, balanceFilter]);


  const clientSummary = useMemo(() => {
    const totalClients = clients.length;

    const activeClients = clients.filter((client) => client.isActive).length;

    const inactiveClients = clients.filter((client) => !client.isActive).length;

    const clientsWithDebt = clients.filter(
      (client) => (client.balance?.balanceDue ?? 0) > 0
    ).length;

    const clientsWithoutDebt = clients.filter(
      (client) => (client.balance?.balanceDue ?? 0) <= 0
    ).length;

    const totalDebt = clients.reduce(
      (sum, client) => sum + (client.balance?.balanceDue ?? 0),
      0
    );

    const totalPaid = clients.reduce(
      (sum, client) => sum + (client.balance?.totalPaid ?? 0),
      0
    );

    return {
      totalClients,
      activeClients,
      inactiveClients,
      clientsWithDebt,
      clientsWithoutDebt,
      totalDebt,
      totalPaid,
    };
  }, [clients]);

  const formatCurrency = (value?: number | null) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value ?? 0);
  };


  const handleOpenCreateModal = () => {
    clearMessages();
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    clearMessages();
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleViewPayments = (client: Client) => {
    if (!client.id) return;

    navigate(`/clients/${client.id}/payments`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <section className="page-container">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Consulta clientes, balances e historial de pagos.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenCreateModal}
        >
          Registrar cliente
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {successMessage && <p className="success-message">{successMessage}</p>}

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
            placeholder="Buscar por nombre, apellido o celular..."
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
      </div>

      <p className="results-count">
        Mostrando {filteredClients.length} de {clients.length} clientes
      </p>

      {loading && <p>Cargando clientes...</p>}

      {!loading && (
        <ClientTable
          clients={filteredClients}
          onEditClient={handleEditClient}
          onViewPayments={handleViewPayments}
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
    </section>
  );
}

export default ClientsPage;