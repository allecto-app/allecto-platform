import type { Id } from "../lib/convexGenerated";

export type ResidentRecord = {
  id: Id<"residents">;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  condoId: Id<"condos">;
  condoName: string | null;
  condoSubdomain: string | null;
  createdAt: number;
  updatedAt: number;
};
