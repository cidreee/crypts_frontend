import type { Payment } from "../../types/payment";
import { formatCurrency } from "../../utils/currency";

type PaymentHistoryTableProps = {
  payments: Payment[];
  onEditPayment: (payment: Payment) => void;
};

function PaymentHistoryTable({
  payments,
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
            <th>Monto</th>
            <th>Método de pago</th>
            <th>Fecha de pago</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.id}</td>

              <td>
                {payment.crypt?.code ??
                  payment.crypt?.name ??
                  `Cripta ${payment.cryptId}`}
              </td>

              <td>{formatCurrency(payment.amount)}</td>

              <td>
                {payment.paymentMethod?.name ??
                  `Método ${payment.paymentMethodId}`}
              </td>

              <td>
                {payment.paymentDate
                  ? new Date(payment.paymentDate).toLocaleDateString("es-MX")
                  : "Sin fecha"}
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

              <td>
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
