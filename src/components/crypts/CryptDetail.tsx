import type { Crypt } from "../../types/crypt";
import type { Payment } from "../../types/payment";
import { formatCurrency } from "../../utils/currency";

type CryptDetailProps = {
  crypt: Crypt;
  payments: Payment[];
  loadingPayments?: boolean;
  paymentsError?: string;
  purchaseDate?: string;
  onEdit: () => void;
};

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("es-MX");
}

function getCryptCode(crypt: Crypt) {
  return `${crypt.section}-${crypt.letter}-${crypt.number}`;
}

function getStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) return "Disponible";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

  if (totalPaid <= 0) return "Sin pago";
  if (balanceDue > 0) return "Abonando";

  return "Liquidada";
}

function CryptDetail({
  crypt,
  payments,
  loadingPayments = false,
  paymentsError = "",
  purchaseDate,
  onEdit,
}: CryptDetailProps) {
  const clientName = crypt.client
    ? `${crypt.client.firstName} ${crypt.client.lastName}`
    : "Sin cliente";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;
  const paymentsCount = crypt.balance?.paymentsCount ?? payments.length;

  return (
    <div className="crypt-detail">
      <div className="detail-toolbar">
        <div>
          <span>Cripta</span>
          <strong>{getCryptCode(crypt)}</strong>
        </div>

        <button type="button" className="btn-secondary" onClick={onEdit}>
          Editar
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span>Sección</span>
          <strong>{crypt.section}</strong>
        </div>

        <div className="detail-item">
          <span>Letra</span>
          <strong>{crypt.letter}</strong>
        </div>

        <div className="detail-item">
          <span>Número</span>
          <strong>{crypt.number}</strong>
        </div>

        <div className="detail-item">
          <span>Estado</span>
          <strong>{getStatusLabel(crypt)}</strong>
        </div>

        <div className="detail-item">
          <span>Cliente</span>
          <strong>{clientName}</strong>
        </div>

        <div className="detail-item">
          <span>Fecha de compra</span>
          <strong>{formatDate(purchaseDate ?? crypt.purchasedAt)}</strong>
        </div>

        <div className="detail-item">
          <span>Costo</span>
          <strong>{formatCurrency(crypt.cost)}</strong>
        </div>

        <div className="detail-item">
          <span>Total pagado</span>
          <strong>{formatCurrency(totalPaid)}</strong>
        </div>

        <div className="detail-item">
          <span>Saldo</span>
          <strong>{crypt.client ? formatCurrency(balanceDue) : "-"}</strong>
        </div>

        <div className="detail-item">
          <span>Pagos</span>
          <strong>{crypt.client ? paymentsCount : "-"}</strong>
        </div>
      </div>

      <div className="detail-section-header">
        <h3>Pagos de esta cripta</h3>
      </div>

      {loadingPayments && <p className="loading-message">Cargando pagos...</p>}
      {paymentsError && <p className="error-message">{paymentsError}</p>}

      {!loadingPayments && !paymentsError && payments.length === 0 && (
        <p className="empty-message">No hay pagos registrados.</p>
      )}

      {!loadingPayments && !paymentsError && payments.length > 0 && (
        <div className="table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{clientName}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>
                    {payment.paymentMethod?.name ??
                      `Método ${payment.paymentMethodId}`}
                  </td>
                  <td>{formatDate(payment.paymentDate)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CryptDetail;
