import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import type { Client, ClientPayload, UpdateClientPayload } from "../types/client";
import { getApiErrorMessage } from "../utils/apiError";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiService.clients.getClientsBalance();
      setClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError(getApiErrorMessage(err, "No se pudieron cargar los clientes."));
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = async (client: ClientPayload): Promise<boolean> => {
    try {
      setSaving(true);
      clearMessages();

      await apiService.clients.create(client);
      setSuccessMessage("Cliente registrado correctamente.");

      await loadClients();
      return true;
    } catch (err) {
      console.error("Error creating client:", err);
      setError(getApiErrorMessage(err, "No se pudo registrar el cliente."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateClient = async (
    id: number,
    client: UpdateClientPayload
  ): Promise<boolean> => {
    try {
      setSaving(true);
      clearMessages();

      await apiService.clients.update(id, client);
      setSuccessMessage("Cliente actualizado correctamente.");

      await loadClients();
      return true;
    } catch (err) {
      console.error("Error updating client:", err);
      setError(getApiErrorMessage(err, "No se pudo actualizar el cliente."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deactivateClient = async (id: number): Promise<boolean> => {
    try {
      setSaving(true);
      clearMessages();

      await apiService.clients.deactivate(id);
      setSuccessMessage("Cliente desactivado correctamente.");

      await loadClients();
      return true;
    } catch (err) {
      console.error("Error deactivating client:", err);
      const message = getApiErrorMessage(
        err,
        "No se pudo desactivar el cliente."
      );

      setError(
        message === "Beneficiary can not be null when deactivating a client"
          ? "No se pudo desactivar el cliente. Todas sus criptas deben tener un beneficiario asignado."
          : message
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    clients,
    loading,
    saving,
    error,
    successMessage,
    loadClients,
    createClient,
    updateClient,
    deactivateClient,
    clearMessages,
  };
}
