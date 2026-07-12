import type { Client } from "../../types/client";
import { formatCurrency } from "../../utils/currency";
import { formatBackendDate } from "../../utils/date";

type ClientTableProps = {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onViewPayments: (client: Client) => void;
  onDeactivateClient: (client: Client) => void;
};

function ClientTable({
  clients = [],
  onEditClient,
  onViewPayments,
  onDeactivateClient,
}: ClientTableProps) {
  if (clients.length === 0) {
    return <p className="empty-message">No hay clientes registrados.</p>;
  }

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
                {formatBackendDate(client.createdAt, "Sin fecha")}
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

                    if (action === "deactivate") {
                      onDeactivateClient(client);
                    }

                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="edit">Editar cliente</option>
                  <option value="payments">Ver historial de pagos</option>
                  {client.isActive && (
                    <option value="deactivate">Desactivar cliente</option>
                  )}
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
