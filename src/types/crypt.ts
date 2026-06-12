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