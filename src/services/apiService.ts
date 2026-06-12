import axiosClient from "../api/axiosClient";
import type { Client } from "../types/client";
import type { Crypt } from "../types/crypt";
import type { Payment } from "../types/payment";
import type { ApiResponse } from "../types/apiResponse";

export const apiService = {
  // CLIENTS
  clients: {
    getClientsBalance: async (): Promise<Client[]> => {
      const response = await axiosClient.get<ApiResponse<Client[]>>("/Client/balance");
      return response.data.data;
    },

    getClientBalanceById: async (id: number): Promise<Client> => {
      const response = await axiosClient.get<ApiResponse<Client>>(`/Client/${id}/balance`);
      return response.data.data;
    },

    create: async (client: Client): Promise<Client> => {
      const response = await axiosClient.post<ApiResponse<Client>>("/Client", client);
      return response.data.data;
    },

    update: async (id: number, client: Client): Promise<void> => {
      await axiosClient.put(`/Client/${id}`, client);
    },
  },

  // CRYPTS
  crypts: {
    getAll: async (): Promise<Crypt[]> => {
      const response = await axiosClient.get<ApiResponse<Crypt[]>>("/Crypt");
      return response.data.data;
    },

    getById: async (id: number): Promise<Crypt> => {
      const response = await axiosClient.get<ApiResponse<Crypt>>(`/Crypt/${id}`);
      return response.data.data;
    },

    create: async (crypt: Crypt): Promise<Crypt> => {
      const response = await axiosClient.post<ApiResponse<Crypt>>("/Crypt", crypt);
      return response.data.data;
    },

    update: async (id: number, crypt: Crypt): Promise<void> => {
      await axiosClient.put(`/Crypt/${id}`, crypt);
    },

    assignOwner: async (cryptId: number, clientId: number): Promise<Crypt> => {
      const response = await axiosClient.put<ApiResponse<Crypt>>(
        `/Crypt/${cryptId}/assign`,
        null,
        {
          params: { clientId },
        }
      );

      return response.data.data;
    },

    cancelPurchase: async (cryptId: number): Promise<Crypt> => {
      const response = await axiosClient.put<ApiResponse<Crypt>>(
        `/Crypt/${cryptId}/cancel-purchase`
      );

      return response.data.data;
    },
  },

  // PAYMENTS
  payments: {
    getHistoryByClientId: async (
      clientId: number,
      cryptId?: number
    ): Promise<Payment[]> => {
      const response = await axiosClient.get<ApiResponse<Payment[]>>(
        `/Payment/client/${clientId}/history`,
        {
          params: cryptId ? { cryptId } : {},
        }
      );

      return response.data.data;
    },

    create: async (payment: Payment): Promise<Payment> => {
      const response = await axiosClient.post<ApiResponse<Payment>>(
        "/Payment",
        payment
      );

      return response.data.data;
    },

    update: async (id: number, payment: Payment): Promise<void> => {
      await axiosClient.put(`/Payment/${id}`, payment);
    },
  },



};