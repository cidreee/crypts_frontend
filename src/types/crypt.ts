import type { Client } from "./client";

export interface Crypt {
  id?: number;
  clientId?: number | null;
  cost: number;
  section: number;
  letter: string;
  number: string;
  isAvailable?: boolean | null;
  createdAt?: string;
  client?: Client | null;
}

export type CryptPayload = Pick<
  Crypt,
  "cost" | "section" | "letter" | "number"
> & {
  id?: number;
  clientId?: number | null;
  isAvailable?: boolean | null;
  createdAt?: string;
};
