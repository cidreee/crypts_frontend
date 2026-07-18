import type { Payment } from "../../types/payment";
import { formatCurrency } from "../../utils/currency";
import { getPaymentMethodLabel } from "../../constants/paymentMethods";
import { formatBackendDate } from "../../utils/date";
import { Link } from "react-router-dom";

type PaymentHistoryTableProps = {
  payments: Payment[];
  cryptCodeById: Record<number, string>;
  onEditPayment: (payment: Payment) => void;
};

function formatClientName(payment: Payment) {
  const client = payment.paidByClient;

  if (!client) return `Cliente ${payment.paidByClientId}`;

  return `${client.firstName} ${client.lastName}`.trim() || `Cliente ${payment.paidByClientId}`;
}

function formatCryptCode(
  payment: Payment,
  cryptCodeById: Record<number, string>
) {
  const resolvedCode = cryptCodeById[payment.cryptId];

  if (resolvedCode) return resolvedCode;

  const crypt = payment.crypt;

  if (!crypt) return `Cripta ${payment.cryptId}`;

  return `${crypt.section}-${crypt.letter}-${crypt.number}`;
}

function CryptTableLink({
  payment,
  cryptCodeById,
}: {
  payment: Payment;
  cryptCodeById: Record<number, string>;
}) {
  const cryptCode = formatCryptCode(payment, cryptCodeById);

  return (
    <Link
      className="table-inline-link"
      to={`/crypts?search=${encodeURIComponent(cryptCode)}`}
    >
      {cryptCode}
    </Link>
  );
}

function PaymentHistoryTable({
  payments,
  cryptCodeById,
  onEditPayment,
}: PaymentHistoryTableProps) {
  if (payments.length === 0) {
    return <p className="empty-message">No hay pagos registrados.</p>;
  }

  return (
    <div className="table-container">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Cripta</th>
            <th>Pagó</th>
            <th>Monto</th>
            <th>Método de pago</th>
            <th>Fecha de pago</th>
            <th>Estado</th>
            <th className="table-sticky-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.id}</td>

              <td>
                <CryptTableLink
                  payment={payment}
                  cryptCodeById={cryptCodeById}
                />
              </td>

              <td>{formatClientName(payment)}</td>

              <td>{formatCurrency(payment.amount)}</td>

              <td>
                {getPaymentMethodLabel(
                  payment.paymentMethodId,
                  payment.paymentMethod?.name
                )}
              </td>

              <td>
                {formatBackendDate(payment.paymentDate, "Sin fecha")}
              </td>

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

              <td className="table-sticky-right">
                <select
                  className="actions-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === "edit") {
                      onEditPayment(payment);
                    }

                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option value="edit">Editar pago</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentHistoryTable;
