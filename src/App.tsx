import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientsPage from "./pages/ClientsPage";
import ClientPaymentHistoryPage from "./pages/ClientPaymentHistoryPage";
import CryptsPage from "./pages/CryptsPage";
import Navbar from "./components/common/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/crypts" replace />} />

          <Route path="/clients" element={<ClientsPage />} />

          <Route
            path="/clients/:clientId/payments"
            element={<ClientPaymentHistoryPage />}
          />

          <Route path="/crypts" element={<CryptsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;