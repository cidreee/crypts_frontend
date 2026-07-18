import { useState } from "react";
import { Link } from "react-router-dom";
import ToastMessage from "../components/common/ToastMessage";
import PageLoader from "../components/common/PageLoader";
import { useCrypts } from "../hooks/useCrypts";
import { formatCurrency } from "../utils/format";
import { getEffectiveCryptBalanceDue } from "../utils/cryptOwnership";
import CryptExportModal from "../components/home/CryptExportModal";

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;

  return Math.round((value / total) * 100);
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return "0%";

  return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;
}

function HomePage() {
  const { crypts, loading, error } = useCrypts();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const validCrypts = crypts.filter(
    (crypt) => crypt !== null && crypt !== undefined
  );
  const availableCrypts = validCrypts.filter((crypt) =>
    Boolean(crypt.isAvailable)
  );
  const occupiedCrypts = validCrypts.filter((crypt) => !crypt.isAvailable);
  const debtCrypts = occupiedCrypts.filter(
    (crypt) => getEffectiveCryptBalanceDue(crypt) > 0
  );
  const paidCrypts = occupiedCrypts.filter(
    (crypt) => getEffectiveCryptBalanceDue(crypt) <= 0
  );
  const noPaymentCrypts = occupiedCrypts.filter(
    (crypt) => (crypt.balance?.totalPaid ?? 0) <= 0
  );
  const clientsWithDebt = new Set(
    debtCrypts
      .map((crypt) => crypt.clientId ?? crypt.client?.id)
      .filter((clientId): clientId is number => typeof clientId === "number")
  );
  const totalPending = debtCrypts.reduce((sum, crypt) => {
    return sum + getEffectiveCryptBalanceDue(crypt);
  }, 0);
  const occupiedWithoutBeneficiary = occupiedCrypts.filter(
    (crypt) => !crypt.beneficiaryId && !crypt.beneficiary
  ).length;
  const occupiedWithoutTitle = occupiedCrypts.filter(
    (crypt) => !crypt.title?.trim()
  ).length;
  const occupiedWithoutPlate = occupiedCrypts.filter(
    (crypt) => !crypt.plateText?.trim()
  ).length;
  const totalCrypts = validCrypts.length;
  const availablePercent = getPercent(availableCrypts.length, totalCrypts);
  const occupiedPercent = getPercent(occupiedCrypts.length, totalCrypts);
  const maxPendingCount = Math.max(
    occupiedWithoutBeneficiary,
    occupiedWithoutTitle,
    occupiedWithoutPlate,
    debtCrypts.length,
    1
  );

  return (
    <>
      <PageLoader visible={loading} message="Cargando inicio..." />
      <section className={`page-container ${loading ? "page-content-loading" : ""}`}>
      <div className="page-header">
        <div>
          <h1>Inicio</h1>
          <p>Tablero de trabajo para ventas, pagos y pendientes.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setExportModalOpen(true)}
          disabled={loading || validCrypts.length === 0}
        >
          Exportar a Excel
        </button>
      </div>

      <div className="toast-stack">
        <ToastMessage type="error" message={error} />
      </div>
      {loading && <p className="loading-message">Cargando resumen...</p>}

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel-main">
          <div className="dashboard-panel-header">
            <div>
              <h2>Estado de criptas</h2>
              <p>Da clic en un estado para abrir la lista filtrada.</p>
            </div>
          </div>

          <div className="donut-dashboard">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(var(--primary) 0 ${availablePercent}%, var(--success) ${availablePercent}% 100%)`,
              }}
              aria-label={`${availablePercent}% disponibles, ${occupiedPercent}% ocupadas`}
            >
              <div>
                <strong>{totalCrypts}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="dashboard-legend">
              <Link
                className="legend-row"
                to="/crypts?availability=available&sort=cryptCode&direction=asc"
              >
                <i className="legend-dot legend-dot-blue" />
                <span>Disponibles</span>
                <strong>{availableCrypts.length}</strong>
              </Link>

              <Link
                className="legend-row"
                to="/crypts?availability=occupied&sort=client&direction=asc"
              >
                <i className="legend-dot legend-dot-green" />
                <span>Ocupadas</span>
                <strong>{occupiedCrypts.length}</strong>
              </Link>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Pagos</h2>
              <p>Seguimiento rápido de saldos.</p>
            </div>
          </div>

          <div className="payment-dashboard">
            <Link
              className="metric-link metric-link-strong"
              to="/crypts?availability=occupied&debt=due&sort=balanceDue&direction=desc"
            >
              <span>Saldo pendiente</span>
              <strong>{formatCurrency(totalPending)}</strong>
              <small>{clientsWithDebt.size} clientes con deuda</small>
            </Link>

            <div className="mini-metrics">
              <Link to="/crypts?availability=occupied&debt=due&sort=balanceDue&direction=desc">
                <span>Con saldo</span>
                <strong>{debtCrypts.length}</strong>
              </Link>
              <Link to="/crypts?availability=occupied&paymentStatus=completed&sort=client&direction=asc">
                <span>Liquidadas</span>
                <strong>{paidCrypts.length}</strong>
              </Link>
              <Link to="/crypts?availability=occupied&paymentStatus=no-payment&sort=client&direction=asc">
                <span>Sin pago</span>
                <strong>{noPaymentCrypts.length}</strong>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Pendientes importantes</h2>
            <p>Las barras son clickeables y abren la tabla con el filtro correcto.</p>
          </div>
        </div>

        <div className="bar-dashboard">
          <Link
            className="bar-row bar-row-warning"
            to="/crypts?availability=occupied&beneficiary=no&sort=client&direction=asc"
          >
            <span>Sin beneficiario</span>
            <div className="bar-track">
              <i
                style={{
                  width: getBarWidth(occupiedWithoutBeneficiary, maxPendingCount),
                }}
              />
            </div>
            <strong>{occupiedWithoutBeneficiary}</strong>
          </Link>

          <Link
            className="bar-row"
            to="/crypts?availability=occupied&title=no&sort=client&direction=asc"
          >
            <span>Sin titulo</span>
            <div className="bar-track">
              <i
                style={{
                  width: getBarWidth(occupiedWithoutTitle, maxPendingCount),
                }}
              />
            </div>
            <strong>{occupiedWithoutTitle}</strong>
          </Link>

          <Link
            className="bar-row"
            to="/crypts?availability=occupied&plate=no&sort=client&direction=asc"
          >
            <span>Sin placa</span>
            <div className="bar-track">
              <i
                style={{
                  width: getBarWidth(occupiedWithoutPlate, maxPendingCount),
                }}
              />
            </div>
            <strong>{occupiedWithoutPlate}</strong>
          </Link>

          <Link
            className="bar-row"
            to="/crypts?availability=occupied&debt=due&sort=balanceDue&direction=desc"
          >
            <span>Con saldo pendiente</span>
            <div className="bar-track">
              <i
                style={{
                  width: getBarWidth(debtCrypts.length, maxPendingCount),
                }}
              />
            </div>
            <strong>{debtCrypts.length}</strong>
          </Link>
        </div>
      </section>

      <section className="operations-panel" aria-label="Trabajo rapido">
        <div className="operations-panel-header">
          <div>
            <h2>Trabajo rapido</h2>
            <p>Accesos directos para las tareas mas comunes.</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          <Link
            className="quick-action-card"
            to="/crypts?availability=available&sort=cryptCode&direction=asc"
          >
            <span>Registrar venta</span>
            <strong>Disponibles</strong>
            <small>{availableCrypts.length} criptas listas para vender</small>
          </Link>

          <Link
            className="quick-action-card"
            to="/crypts?availability=occupied&debt=due&sort=balanceDue&direction=desc"
          >
            <span>Registrar pago</span>
            <strong>Con deuda</strong>
            <small>{debtCrypts.length} criptas con saldo pendiente</small>
          </Link>

          <Link className="quick-action-card" to="/crypts?focusSearch=1">
            <span>Buscar cliente</span>
            <strong>Buscar</strong>
            <small>Nombre, telefono o cripta</small>
          </Link>

          <Link className="quick-action-card" to="/clients?balance=withDebt">
            <span>Clientes con deuda</span>
            <strong>{clientsWithDebt.size}</strong>
            <small>Ver balance por cliente</small>
          </Link>
        </div>
      </section>
      </section>
      {exportModalOpen && (
        <CryptExportModal
          crypts={validCrypts}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </>
  );
}

export default HomePage;
