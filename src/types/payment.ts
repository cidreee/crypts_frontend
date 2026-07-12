import type { Client } from "./client";
import type { Crypt } from "./crypt";
import type { PaymentMethod } from "./paymentMethod";

export interface Payment {
  id?: number;
  cryptId: number;
  paidByClientId: number;
  amount: number;
  paymentMethodId: number;
  paymentDate: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;

  paidByClient?: Client | null;

  crypt?: Crypt | null;

  paymentMethod?: PaymentMethod | null;
}

export type PaymentPayload = Pick<
  Payment,
  "cryptId" | "paidByClientId" | "amount" | "paymentMethodId" | "paymentDate"
> & {
  id?: number;
  isActive?: boolean;
};
