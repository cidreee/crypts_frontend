import type { Crypt } from "../../types/crypt";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";
import { formatBackendDate } from "../../utils/date";
import { getEffectiveCryptBalanceDue } from "../../utils/cryptOwnership";

type CryptTableProps = {
  crypts: Crypt[];
  onRegisterSale: (crypt: Crypt) => void;
  onRegisterPayment: (crypt: Crypt) => void;
  onCancelPurchase: (crypt: Crypt) => void;
  onAddRemain: (crypt: Crypt) => void;
  onViewDetails: (crypt: Crypt) => void;
  activeRemainsCountByCryptId?: Record<number, number>;
};

function getPaymentStatusLabel(crypt: Crypt) {
  if (crypt.isAvailable) return "Disponible";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = getEffectiveCryptBalanceDue(crypt);

  if (totalPaid <= 0) return "Sin pago";
  if (balanceDue > 0) return "Abonando";

  return "Liquidada";
}

function getPaymentStatusClass(crypt: Crypt) {
  if (crypt.isAvailable) return "status-available";

  const totalPaid = crypt.balance?.totalPaid ?? 0;
  const balanceDue = getEffectiveCryptBalanceDue(crypt);

  if (totalPaid <= 0) return "status-no-payment";
  if (balanceDue > 0) return "status-paying";

  return "status-completed";
}

function formatDate(date?: string | null) {
  return formatBackendDate(date);
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

function EmptyTableValue({ children }: { children: React.ReactNode }) {
  return <span className="table-empty-value">{children}</span>;
}

function getClientSearchUrl(client: Crypt["client"] | Crypt["beneficiary"]) {
  if (!client) return "";

  const searchValue =
    `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
    client.phoneNumber ||
    client.id?.toString() ||
    "";

  return `/clients?search=${encodeURIComponent(searchValue)}`;
}

function ClientTableLink({
  client,
  fallback,
}: {
  client: Crypt["client"] | Crypt["beneficiary"];
  fallback: string;
}) {
  if (!client) {
    return <EmptyTableValue>{fallback}</EmptyTableValue>;
  }

  return (
    <Link className="table-inline-link" to={getClientSearchUrl(client)}>
      {formatClientName(client, fallback)}
    </Link>
  );
}

function CryptTable({
  crypts,
  onRegisterSale,
  onRegisterPayment,
  onCancelPurchase,
  onAddRemain,
  onViewDetails,
  activeRemainsCountByCryptId = {},
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
            const activeRemainsCount = crypt.id
              ? activeRemainsCountByCryptId[crypt.id] ?? 0
              : 0;
            const hasReachedRemainsLimit = activeRemainsCount >= 4;
            const plateText = formatNullableText(crypt.plateText);

            const totalPaid = crypt.balance?.totalPaid ?? 0;
            const balanceDue = getEffectiveCryptBalanceDue(crypt);
            const paymentsCount = crypt.balance?.paymentsCount ?? 0;

            const isPaid = !crypt.isAvailable && balanceDue <= 0;
            const purchaseDate = crypt.purchasedAt;

            const handleActionChange = (
              e: React.ChangeEvent<HTMLSelectElement>
            ) => {
              const action = e.target.value;

              if (action === "details") onViewDetails(crypt);
              if (action === "sale") onRegisterSale(crypt);
              if (action === "payment") onRegisterPayment(crypt);
              if (action === "remain") onAddRemain(crypt);
              if (action === "cancel") onCancelPurchase(crypt);

              e.target.value = "";
            };

            return (
              <tr key={crypt.id}>
                <td className="table-sticky-left">{cryptCode}</td>
                <td className="table-text-cell">
                  {cryptTitle === "-" ? (
                    <EmptyTableValue>No entregado</EmptyTableValue>
                  ) : (
                    cryptTitle
                  )}
                </td>
                <td>
                  <ClientTableLink client={crypt.client} fallback={clientName} />
                </td>
                <td>
                  {beneficiaryName === "-" ? (
                    <EmptyTableValue>Sin beneficiario</EmptyTableValue>
                  ) : (
                    <ClientTableLink
                      client={crypt.beneficiary}
                      fallback={beneficiaryName}
                    />
                  )}
                </td>
                <td>
                  <span
                    className={`remains-count ${
                      hasReachedRemainsLimit ? "remains-count-full" : ""
                    }`}
                  >
                    <span>{activeRemainsCount}/4</span>
                    <i style={{ width: `${(activeRemainsCount / 4) * 100}%` }} />
                  </span>
                </td>
                <td className="table-text-cell">
                  {plateText === "-" ? (
                    <EmptyTableValue>No definida</EmptyTableValue>
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
                        <option value="remain" disabled={hasReachedRemainsLimit}>
                          Agregar resto
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
