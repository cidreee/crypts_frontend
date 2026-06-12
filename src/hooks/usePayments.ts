// src/hooks/usePayments.ts

import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import type { Payment } from "../types/payment";

export function usePayments(clientId?: number) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCryptId, setSelectedCryptId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async (cryptId?: number) => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError("");

      const data = await apiService.payments.getHistoryByClientId(
        clientId,
        cryptId
      );

      setPayments(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el historial de pagos.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleCryptFilterChange = async (cryptId?: number) => {
    setSelectedCryptId(cryptId);
    await loadPayments(cryptId);
  };

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    selectedCryptId,
    loading,
    error,
    loadPayments,
    handleCryptFilterChange,
  };
}
