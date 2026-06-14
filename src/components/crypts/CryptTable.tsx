import type { Crypt } from "../../types/crypt";
import { formatCurrency } from "../../utils/format";


type CryptTableProps = {
  crypts: Crypt[];
  onEditCrypt: (crypt: Crypt) => void;
  onRegisterSale: (crypt: Crypt) => void;
  onRegisterPayment: (crypt: Crypt) => void;
  onCancelPurchase: (crypt: Crypt) => void;
  onViewPayments: (crypt: Crypt) => void;
};

function getPaymentStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) {
    return "Disponible";
  }

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

  if (totalPaid <= 0) {
    return "Sin pago";
  }

  if (balanceDue > 0) {
    return "Abonando";
  }

  return "Liquidada";
}

function CryptTable({
  crypts,
  onEditCrypt,
  onRegisterSale,
  onRegisterPayment,
  onCancelPurchase,
  onViewPayments,
}: CryptTableProps) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Cripta</th>
            <th>Cliente</th>
            <th>Costo</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Pagos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {crypts.map((crypt) => {
            const cryptCode = `${crypt.section}-${crypt.letter}-${crypt.number}`;

            const clientName = crypt.client
              ? `${crypt.client.firstName} ${crypt.client.lastName}`
              : "Sin cliente";

            const totalPaid = crypt.balance?.totalPaid ?? 0;
            const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;
            const paymentsCount = crypt.balance?.paymentsCount ?? 0;

            const isPaid = !crypt.isAvailable && balanceDue <= 0;
            const hasPayments = paymentsCount > 0;

            return (
              <tr key={crypt.id}>
                <td>{cryptCode}</td>
                <td>{clientName}</td>
                <td>{formatCurrency(crypt.cost)}</td>
                <td>{formatCurrency(totalPaid)}</td>
                <td>{formatCurrency(balanceDue)}</td>
                <td>{paymentsCount}</td>
                <td>{getPaymentStatusLabel(crypt)}</td>

                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onEditCrypt(crypt)}
                    >
                      Editar
                    </button>

                    {!crypt.isAvailable && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onViewPayments(crypt)}
                        disabled={!hasPayments}
                      >
                        Ver pagos
                      </button>
                    )}

                    {crypt.isAvailable ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onRegisterSale(crypt)}
                      >
                        Vender
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => onRegisterPayment(crypt)}
                          disabled={isPaid}
                        >
                          Registrar pago
                        </button>

                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => onCancelPurchase(crypt)}
                        >
                          Cancelar compra
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CryptTable;