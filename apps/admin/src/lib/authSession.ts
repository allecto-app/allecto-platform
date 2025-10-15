import { Id } from "../../../../backend/convex/convex/_generated/dataModel";

export type AdminAuthSession =
  | {
      type: "platform";
      token: string;
      userId: Id<"platformUsers">;
      roles: string[];
      name: string;
      expiresAt: number;
    }
  | {
      type: "resident";
      token: string;
      userId: Id<"residents">;
      roles: string[];
      name: string;
      expiresAt: number;
      condoId: Id<"condos">;
      condoName: string;
      condoSubdomain: string;
    };
