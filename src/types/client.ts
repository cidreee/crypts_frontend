export interface ClientBalance {
  cryptsCount: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
}

export interface Client {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt?: string;
  balance?: ClientBalance | null;
}

export type ClientPayload = Pick<
  Client,
  "firstName" | "lastName" | "phoneNumber" | "isActive"
>;

export type UpdateClientPayload = ClientPayload & {
  id?: number;
  createdAt?: string;
};

