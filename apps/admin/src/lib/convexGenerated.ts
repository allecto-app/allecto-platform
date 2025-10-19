import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { api as baseApi, internal as baseInternal } from "../../convex/_generated/api";

type PublicFunctionRef = FunctionReference<any, "public">;
type InternalFunctionRef = FunctionReference<any, "internal">;

type ActionRef = PublicFunctionRef;
type MutationRef = PublicFunctionRef;
type QueryRef = PublicFunctionRef;

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
    getAdmin: QueryRef;
    list: QueryRef;
    create: MutationRef;
    updateBranding: MutationRef;
    updateSettings: MutationRef;
    generateLogoUploadUrl: MutationRef;
    disable: MutationRef;
  };
  residents: {
    list: QueryRef;
    findByEmail: QueryRef;
    update: MutationRef;
  };
  minutes: {
    list: QueryRef;
    publish: MutationRef;
    close: MutationRef;
  };
  units: {
    listByCondo: QueryRef;
    detail: QueryRef;
    upsert: MutationRef;
    update: MutationRef;
    remove: MutationRef;
    addMembership: MutationRef;
    updateMembershipRole: MutationRef;
    removeMembership: MutationRef;
  };
  notifications: {
    listLogs: QueryRef;
  };
  residentDetail: {
    get: QueryRef;
    resendOtp: ActionRef;
  };
};

type AugmentedInternal = typeof baseInternal & {
  invites: {
    _authorizeInviteCreator: InternalFunctionRef;
    _createInviteRecord: InternalFunctionRef;
    _markInviteRevoked: InternalFunctionRef;
    _logSecurityEvent: InternalFunctionRef;
  };
};

export const api = baseApi as AugmentedApi;
export const internal = baseInternal as AugmentedInternal;

export type TableNames =
  | "condos"
  | "units"
  | "residents"
  | "memberships"
  | "minutes"
  | "votes"
  | "notificationLogs"
  | "otps"
  | "platformUsers"
  | "loginAttempts"
  | "sessions"
  | "securityEvents"
  | "invites"
  | "inviteRate"
  | (string & {});

export type Id<TableName extends TableNames = TableNames> = GenericId<TableName>;

type DefaultDoc<TableName extends TableNames> = {
  _id: Id<TableName>;
  _creationTime: number;
};

type CondoBranding = {
  logoUrl?: string;
  logoStorageId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  displayName?: string;
};

type DocByTable = {
  condos: DefaultDoc<"condos"> & {
    name: string;
    subdomain: string;
    branding: CondoBranding;
    timezone?: string;
    isActive?: boolean;
    disabledAt?: number;
    createdAt: number;
    updatedAt: number;
  };
  units: DefaultDoc<"units"> & {
    condoId: Id<"condos">;
    code: string;
    block?: string;
    floor?: string;
    createdAt: number;
    updatedAt: number;
  };
  residents: DefaultDoc<"residents"> & {
    condoId: Id<"condos">;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
  };
  invites: DefaultDoc<"invites"> & {
    condoId: Id<"condos">;
    email: string;
    name?: string;
    role: "syndic";
    tokenHash: string;
    expiresAt: number;
    usedAt?: number;
    createdBy?: Id<"platformUsers">;
    createdAt: number;
    status: string;
    attempts: number;
    updatedAt?: number;
  };
  minutes: DefaultDoc<"minutes"> & {
    condoId: Id<"condos">;
    title: string;
    summary?: string;
    pdfUrl: string;
    publishedAt: number;
    closesAt: number;
    status: string;
    createdBy: Id<"residents">;
    reminderD2Scheduled: boolean;
    reminderD4Scheduled: boolean;
    closeScheduled: boolean;
    createdAt: number;
    updatedAt: number;
  };
  notificationLogs: DefaultDoc<"notificationLogs"> & {
    condoId: Id<"condos">;
    minuteId?: Id<"minutes">;
    channel: string;
    template: string;
    audienceCount: number;
    successCount: number;
    errorCount: number;
    createdAt: number;
    meta?: Record<string, unknown>;
  };
};

export type Doc<TableName extends TableNames = TableNames> = TableName extends keyof DocByTable
  ? DocByTable[TableName]
  : DefaultDoc<TableName> & Record<string, unknown>;
