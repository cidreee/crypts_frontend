export interface ClientBalance {
  cryptsCount: number;
  currentCryptsCount?: number;
  beneficiaryCryptsCount?: number;
  cryptsAsBeneficiaryCount?: number;
  inheritedCryptsCount?: number;
  inheritedDebtAmount?: number;
  inheritedDebt?: number;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
}

export interface Client {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  alternatePhoneNumber?: string | null;
  isActive: boolean;
  createdAt?: string;
  balance?: ClientBalance | null;
}

export type ClientPayload = Pick<
  Client,
  "firstName" | "lastName" | "phoneNumber" | "alternatePhoneNumber" | "isActive"
>;

export type UpdateClientPayload = ClientPayload & {
  id?: number;
  createdAt?: string;
};

