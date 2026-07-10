import type { Client } from "./client";
import type { SaleCryptStatus } from "./saleCryptStatus";
import type { CryptBalance } from "./cryptBalance";
import type { CryptRemain } from "./cryptRemain";

export interface Crypt {
  id?: number;
  clientId?: number | null;
  beneficiaryId?: number | null;
  saleCryptStatusId?: number | null;
  title?: string | null;
  plateText?: string | null;

  cost: number;
  section: number;
  letter: string;
  number: string;

  isAvailable?: boolean | null;
  purchasedAt?: string | null;
  createdAt?: string;

  beneficiary?: Client | null;
  client?: Client | null;
  cryptRemains?: CryptRemain[] | null;
  saleCryptStatus?: SaleCryptStatus | null;

  balance?: CryptBalance | null;
}

export type CryptPayload = Pick<
  Crypt,
  "cost" | "section" | "letter" | "number"
> & {
  id?: number;
  clientId?: number | null;
  beneficiaryId?: number | null;
  saleCryptStatusId?: number | null;
  title?: string | null;
  plateText?: string | null;
  isAvailable?: boolean | null;
  createdAt?: string;
};
