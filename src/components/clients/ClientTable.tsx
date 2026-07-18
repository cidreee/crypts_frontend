import type { Client } from "../../types/client";
import { formatCurrency } from "../../utils/currency";
import { formatBackendDate } from "../../utils/date";

export type ClientRoleStats = {
  currentCryptsCount: number;
  beneficiaryCryptsCount: number;
  inheritedCryptsCount: number;
  transferredDebtCryptsCount: number;
};

export type ClientFinancialStats = {
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  paidIsHistorical: boolean;
};

type ClientTableProps = {
  clients: Client[];
  roleStatsByClientId?: Record<number, ClientRoleStats>;
  financialStatsByClientId?: Record<number, ClientFinancialStats>;
  onEditClient: (client: Client) => void;
  onViewPayments: (client: Client) => void;
  onDeactivateClient: (client: Client) => void;
};

function ClientTable({
  clients = [],
  roleStatsByClientId = {},
  financialStatsByClientId = {},
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
            <th className="table-sticky-left">Id</th>
            <th>Nombre</th>
            <th>Celular</th>
            <th>Criptas</th>
            <th className="client-role-column">Rol</th>
            <th className="client-debt-column">Tipo de deuda</th>
            <th>Costo</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th className="table-sticky-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {clients.map((client) => {
            const roleStats = client.id
              ? roleStatsByClientId[client.id]
              : undefined;
            const financialStats = client.id
              ? financialStatsByClientId[client.id]
              : undefined;
            const currentCryptsCount =
              roleStats?.currentCryptsCount ??
              client.balance?.currentCryptsCount ??
              client.balance?.cryptsCount ??
              0;
            const beneficiaryCryptsCount =
              roleStats?.beneficiaryCryptsCount ??
              client.balance?.beneficiaryCryptsCount ??
              client.balance?.cryptsAsBeneficiaryCount ??
              0;
            const isBeneficiary = beneficiaryCryptsCount > 0;
            const inheritedCryptsCount =
              roleStats?.inheritedCryptsCount ??
              client.balance?.inheritedCryptsCount ?? 0;
            const transferredDebtCryptsCount =
              roleStats?.transferredDebtCryptsCount ?? 0;
            const inheritedDebtAmount =
              client.balance?.inheritedDebtAmount ??
              client.balance?.inheritedDebt ??
              0;
            const hasInheritedDebt =
              inheritedCryptsCount > 0 || inheritedDebtAmount > 0;
            const hasTransferredDebt = transferredDebtCryptsCount > 0;
            const directDebtCryptsCount = Math.max(
              currentCryptsCount - inheritedCryptsCount,
              0
            );
            const hasDirectDebt = directDebtCryptsCount > 0;
            const hasCryptRole =
              currentCryptsCount > 0 || beneficiaryCryptsCount > 0;
            const hasDebtType =
              hasDirectDebt || hasInheritedDebt || hasTransferredDebt;
            const roleLabel =
              currentCryptsCount > 0 && beneficiaryCryptsCount > 0
                ? "Cliente y beneficiario"
                : currentCryptsCount > 0
                  ? "Cliente actual"
                  : beneficiaryCryptsCount > 0
                    ? "Beneficiario"
                    : "Sin cripta";
            const roleClass =
              currentCryptsCount > 0 && beneficiaryCryptsCount > 0
                ? "badge-role-mixed"
                : currentCryptsCount > 0
                  ? "badge-role-current"
                  : beneficiaryCryptsCount > 0
                    ? "badge-role-beneficiary"
                    : "badge-direct";

            return (
              <tr key={client.id}>
                <td className="table-sticky-left">{client.id}</td>

                <td>
                  {client.firstName} {client.lastName}
                </td>

                <td>
                  {client.phoneNumber ? (
                    client.phoneNumber
                  ) : (
                    <span className="table-muted-italic">Sin teléfono</span>
                  )}
                </td>

                <td>{currentCryptsCount}</td>

                <td className="client-role-column">
                  {hasCryptRole ? (
                    <span className={`badge ${roleClass}`}>{roleLabel}</span>
                  ) : (
                    <span className="table-muted-italic">Sin cripta</span>
                  )}
                </td>

                <td className="client-debt-column">
                  {hasDebtType ? (
                    <div className="debt-badges">
                      {hasDirectDebt && (
                        <span className="badge badge-direct">Deuda directa</span>
                      )}
                      {hasInheritedDebt && (
                        <span className="badge badge-inherited">
                          Heredó deuda
                        </span>
                      )}
                      {hasTransferredDebt && (
                        <span className="badge badge-transferred">
                          Dejó deuda
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="table-muted-italic">
                      {hasCryptRole ? "Sin deuda" : "Sin cripta"}
                    </span>
                  )}
                </td>

                <td>
                  {formatCurrency(
                    financialStats?.totalAmount ?? client.balance?.totalAmount
                  )}
                </td>

                <td
                  className={
                    financialStats?.paidIsHistorical
                      ? "historical-payment-cell"
                      : undefined
                  }
                >
                  {formatCurrency(
                    financialStats?.totalPaid ?? client.balance?.totalPaid
                  )}
                </td>

                <td>
                  <strong>
                    {formatCurrency(
                      financialStats?.balanceDue ?? client.balance?.balanceDue
                    )}
                  </strong>
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

                <td>{formatBackendDate(client.createdAt, "Sin fecha")}</td>

                <td className="table-sticky-right">
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
                    <option value="payments">Ver detalles</option>
                    {client.isActive && !isBeneficiary && (
                      <option value="deactivate">
                        Desactivar cliente
                      </option>
                    )}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ClientTable;
