import type { Client } from "./client";
import type { SaleCryptStatus } from "./saleCryptStatus";
import type { CryptBalance } from "./cryptBalance";

export interface Crypt {
  id?: number;
  clientId?: number | null;
  saleCryptStatusId?: number | null;

  cost: number;
  section: number;
  letter: string;
  number: string;

  isAvailable?: boolean | null;
  purchasedAt?: string | null;
  createdAt?: string;

  client?: Client | null;
  saleCryptStatus?: SaleCryptStatus | null;

  balance?: CryptBalance | null;
}

export type CryptPayload = Pick<
  Crypt,
  "cost" | "section" | "letter" | "number"
> & {
  id?: number;
  clientId?: number | null;
  saleCryptStatusId?: number | null;
  isAvailable?: boolean | null;
  createdAt?: string;
};