import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { api as baseApi, internal as baseInternal } from "../../convex/_generated/api";

type ActionRef = FunctionReference<"action", any, any>;
type MutationRef = FunctionReference<"mutation", any, any>;
type QueryRef = FunctionReference<"query", any, any>;

type AugmentedApi = typeof baseApi & {
  invites: {
    createAndEmail: ActionRef;
    accept: MutationRef;
    listByCondo: QueryRef;
    resend: ActionRef;
    revoke: MutationRef;
  };
  auth: {
    adminSignIn: MutationRef;
    requestResidentOtp: ActionRef;
    residentSignIn: MutationRef;
  };
  platform: {
    listCondos: QueryRef;
    createCondo: MutationRef;
  };
  condos: {
    getBySubdomain: QueryRef;
  };
  residents: {
    list: QueryRef;
  };
  minutes: {
    list: QueryRef;
    publish: MutationRef;
    close: MutationRef;
  };
  units: {
    listByCondo: QueryRef;
  };
  notifications: {
    listLogs: QueryRef;
  };
};

type AugmentedInternal = typeof baseInternal & {
  invites: {
    _authorizeInviteCreator: MutationRef;
    _createInviteRecord: MutationRef;
    _markInviteRevoked: MutationRef;
    _logSecurityEvent: MutationRef;
  };
};

export const api = baseApi as AugmentedApi;
export const internal = baseInternal as AugmentedInternal;

export type TableNames = string;
export type Id<TableName extends TableNames = TableNames> = GenericId<TableName>;
export type Doc<TableName extends TableNames = TableNames> = Record<string, any>;
