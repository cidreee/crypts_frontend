import type { Client } from "./client";
import type { Crypt } from "./crypt";
import type { PaymentMethod } from "./paymentMethod";

export interface Payment {
  id?: number;
  cryptId: number;
  paidByCLientId: number;
  amount: number;
  paymentMethodId: number;
  paymentDate: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;

  paidByClient?: Client;

  crypt?: Crypt;

  paymentMethod?: PaymentMethod;
}

export type PaymentPayload = Pick<
  Payment,
  "cryptId" | "paidByCLientId" |"amount" | "paymentMethodId" | "paymentDate"
> & {
  id?: number;
  isActive?: boolean;
};
