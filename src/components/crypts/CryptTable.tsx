import type { Crypt } from "../../types/crypt";
import { formatCurrency } from "../../utils/format";

type CryptTableProps = {
  crypts: Crypt[];
  onRegisterSale: (crypt: Crypt) => void;
  onRegisterPayment: (crypt: Crypt) => void;
  onCancelPurchase: (crypt: Crypt) => void;
  onViewDetails: (crypt: Crypt) => void;
  getPurchaseDate?: (crypt: Crypt) => string | undefined;
};

function getPaymentStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) return "Disponible";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

  if (totalPaid <= 0) return "Sin pago";
  if (balanceDue > 0) return "Abonando";

  return "Liquidada";
}

function getPaymentStatusClass(crypt: Crypt) {
  if (crypt.isAvailable) return "status-available";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;

  if (totalPaid <= 0) return "status-no-payment";
  if (balanceDue > 0) return "status-paying";

  return "status-completed";
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("es-MX");
}

function formatClientName(
  client: Crypt["client"] | Crypt["beneficiary"],
  fallback = "-"
) {
  if (!client) return fallback;

  return `${client.firstName} ${client.lastName}`.trim() || fallback;
}

function formatNullableText(value?: string | null) {
  const formattedValue = value?.trim();

  return formattedValue || "-";
}

function formatCryptRemains(crypt: Crypt) {
  const remains = crypt.cryptRemains?.filter((remain) => remain.isActive ?? true);

  if (!remains?.length) return "-";

  return remains
    .map((remain) => formatNullableText(remain.deceasedName))
    .join(", ");
}

function EmptyTableValue({ children }: { children: React.ReactNode }) {
  return <span className="table-empty-value">{children}</span>;
}

function CryptTable({
  crypts,
  onRegisterSale,
  onRegisterPayment,
  onCancelPurchase,
  onViewDetails,
  getPurchaseDate,
}: CryptTableProps) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="table-sticky-left">Cripta</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Beneficiario</th>
            <th>Restos</th>
            <th>Placa</th>
            <th>Costo</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Pagos</th>
            <th>Compra</th>
            <th>Estado</th>
            <th className="table-sticky-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {crypts.map((crypt) => {
            const cryptCode = `${crypt.section}-${crypt.letter}-${crypt.number}`;

            const clientName = formatClientName(crypt.client, "Sin cliente");
            const beneficiaryName = formatClientName(crypt.beneficiary);
            const cryptTitle = formatNullableText(crypt.title);
            const cryptRemains = formatCryptRemains(crypt);
            const plateText = formatNullableText(crypt.plateText);

            const totalPaid = crypt.balance?.totalPaid ?? 0;
            const balanceDue = crypt.balance?.balanceDue ?? crypt.cost;
            const paymentsCount = crypt.balance?.paymentsCount ?? 0;

            const isPaid = !crypt.isAvailable && balanceDue <= 0;
            const purchaseDate = getPurchaseDate?.(crypt) ?? crypt.purchasedAt;

            const handleActionChange = (
              e: React.ChangeEvent<HTMLSelectElement>
            ) => {
              const action = e.target.value;

              if (action === "details") onViewDetails(crypt);
              if (action === "sale") onRegisterSale(crypt);
              if (action === "payment") onRegisterPayment(crypt);
              if (action === "cancel") onCancelPurchase(crypt);

              e.target.value = "";
            };

            return (
              <tr key={crypt.id}>
                <td className="table-sticky-left">{cryptCode}</td>
                <td className="table-text-cell">
                  {cryptTitle === "-" ? (
                    <EmptyTableValue>-</EmptyTableValue>
                  ) : (
                    cryptTitle
                  )}
                </td>
                <td>
                  {crypt.client ? (
                    clientName
                  ) : (
                    <EmptyTableValue>{clientName}</EmptyTableValue>
                  )}
                </td>
                <td>
                  {beneficiaryName === "-" ? (
                    <EmptyTableValue>-</EmptyTableValue>
                  ) : (
                    beneficiaryName
                  )}
                </td>
                <td className="table-text-cell">
                  {cryptRemains === "-" ? (
                    <EmptyTableValue>-</EmptyTableValue>
                  ) : (
                    cryptRemains
                  )}
                </td>
                <td className="table-text-cell">
                  {plateText === "-" ? (
                    <EmptyTableValue>-</EmptyTableValue>
                  ) : (
                    plateText
                  )}
                </td>
                <td>{formatCurrency(crypt.cost)}</td>
                <td>{crypt.client ? formatCurrency(totalPaid) : "-"}</td>
                
                <td>{crypt.client ? formatCurrency(balanceDue) : "-"}</td>
                
                <td>{crypt.client ? paymentsCount : "-"}</td>
                
                <td>{crypt.client ? formatDate(purchaseDate) : "-"}</td>

                <td>
                  <span className={`badge ${getPaymentStatusClass(crypt)}`}>
                    {getPaymentStatusLabel(crypt)}
                  </span>
                </td>

                <td className="table-sticky-right">
                  <select
                    className="actions-select"
                    defaultValue=""
                    onChange={handleActionChange}
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>

                    <option value="details">Ver detalles</option>

                    {crypt.isAvailable ? (
                      <option value="sale">Registrar venta</option>
                    ) : (
                      <>
                        <option value="payment" disabled={isPaid}>
                          Registrar pago
                        </option>
                        <option value="cancel">Cancelar compra</option>
                      </>
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

export default CryptTable;
