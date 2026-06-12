import type { Crypt } from "../../types/crypt";
import { formatCurrency } from "../../utils/currency";

type CryptTableProps = {
  crypts: Crypt[];
  onEditCrypt: (crypt: Crypt) => void;
  onRegisterSale: (crypt: Crypt) => void;
  onRegisterPayment: (crypt: Crypt) => void;
  onCancelPurchase: (crypt: Crypt) => void;
};

function CryptTable({
  crypts = [],
  onEditCrypt,
  onRegisterSale,
  onRegisterPayment,
  onCancelPurchase,
}: CryptTableProps) {
  if (crypts.length === 0) {
    return <p className="empty-message">No hay criptas registradas.</p>;
  }

  const getCryptCode = (crypt: Crypt) => {
    return `${crypt.section}-${crypt.letter}-${crypt.number}`;
  };

  const getClientName = (crypt: Crypt) => {
    if (!crypt.client) return "Sin cliente";

    return `${crypt.client.firstName} ${crypt.client.lastName}`;
  };

  const handleAction = (action: string, crypt: Crypt) => {
    if (action === "edit") {
      onEditCrypt(crypt);
    }

    if (action === "sale") {
      onRegisterSale(crypt);
    }

    if (action === "payment") {
      onRegisterPayment(crypt);
    }

    if (action === "cancel") {
      onCancelPurchase(crypt);
    }
  };

  return (
    <div className="table-container">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Cripta</th>
            <th>Sección</th>
            <th>Letra</th>
            <th>Número</th>
            <th>Costo</th>
            <th>Estado</th>
            <th>Cliente</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {crypts.map((crypt) => (
            <tr key={crypt.id}>
              <td>{crypt.id}</td>

              <td>{getCryptCode(crypt)}</td>

              <td>{crypt.section}</td>

              <td>{crypt.letter}</td>

              <td>{crypt.number}</td>

              <td>{formatCurrency(crypt.cost)}</td>

              <td>
                <span
                  className={
                    crypt.isAvailable
                      ? "badge badge-active"
                      : "badge badge-inactive"
                  }
                >
                  {crypt.isAvailable ? "Disponible" : "Ocupada"}
                </span>
              </td>

              <td>{getClientName(crypt)}</td>

              <td>
                {crypt.createdAt
                  ? new Date(crypt.createdAt).toLocaleDateString("es-MX")
                  : "Sin fecha"}
              </td>

              <td>
                <select
                  className="actions-select"
                  defaultValue=""
                  onChange={(e) => {
                    handleAction(e.target.value, crypt);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>

                  <option value="edit">Editar cripta</option>

                  {crypt.isAvailable && (
                    <option value="sale">Registrar venta</option>
                  )}

                  {!crypt.isAvailable && (
                    <option value="payment">Registrar pago</option>
                  )}

                  {!crypt.isAvailable && (
                    <option value="cancel">Cancelar compra</option>
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

export default CryptTable;
