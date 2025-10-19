import type { Id } from "../lib/convexGenerated";

export type UnitRecord = {
  id: Id<"units">;
  condoId: Id<"condos">;
  code: string;
  block: string | null;
  floor: string | null;
  createdAt: number;
  updatedAt: number;
  condoName: string | null;
};
