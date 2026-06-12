export interface Client {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt?: string;

    balance?: {
    cryptsCount: number;
    totalAmount: number;
    totalPaid: number;
    balanceDue: number;
  } | null;
}

