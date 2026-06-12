import type { Client } from "../../types/client";

type ClientTableProps = {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onViewPayments: (client: Client) => void;
};

function ClientTable({
  clients = [],
  onEditClient,
  onViewPayments,
}: ClientTableProps) {
  if (clients.length === 0) {
    return <p className="empty-message">No hay clientes registrados.</p>;
  }

  const formatCurrency = (value?: number | null) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value ?? 0);
  };

  return (
    <div className="table-container">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Nombre</th>
            <th>Celular</th>
            <th>Criptas</th>
            <th>Costo</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.id}</td>

              <td>
                {client.firstName} {client.lastName}
              </td>

              <td>{client.phoneNumber ?? "Sin teléfono"}</td>

              <td>{client.balance?.cryptsCount ?? 0}</td>

              <td>{formatCurrency(client.balance?.totalAmount)}</td>

              <td>{formatCurrency(client.balance?.totalPaid)}</td>

              <td>
                <strong>{formatCurrency(client.balance?.balanceDue)}</strong>
              </td>

              <td>
                <span
                  className={
                    client.isActive
                      ? "badge badge-active"
                      : "badge badge-inactive"
                  }
                >
                  {client.isActive ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td>
                {client.createdAt
                  ? new Date(client.createdAt).toLocaleDateString("es-MX")
                  : "Sin fecha"}
              </td>

              <td>
                <select
                  className="actions-select"
                  defaultValue=""
                  onChange={(e) => {
                    const action = e.target.value;

                    if (action === "edit") {
                      onEditClient(client);
                    }

                    if (action === "payments") {
                      onViewPayments(client);
                    }

                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="edit">Editar cliente</option>
                  <option value="payments">Ver historial de pagos</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientTable;