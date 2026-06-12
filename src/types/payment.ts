export interface Payment {
  id?: number;
  cryptId: number;
  amount: number;
  paymentMethodId: number;
  paymentDate: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;

  crypt?: {
    id: number;
    code?: string | null;
    name?: string | null;
  } | null;

  paymentMethod?: {
    id: number;
    name: string;
  } | null;
}

export type PaymentPayload = Pick<
  Payment,
  "cryptId" | "amount" | "paymentMethodId" | "paymentDate"
> & {
  id?: number;
  isActive?: boolean;
};
