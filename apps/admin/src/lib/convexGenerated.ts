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
    requestPasswordReset: MutationRef;
    resetPassword: MutationRef;
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
    get: QueryRef;
    publish: MutationRef;
    close: MutationRef;
  };
  votes: {
    cast: MutationRef;
    getMine: QueryRef;
    summary: QueryRef;
    listForMinute: QueryRef;
    statsByCondo: QueryRef;
  };
  documents: {
    generateUploadUrl: MutationRef;
    finalizeUpload: MutationRef;
    get: QueryRef;
    list: QueryRef;
    getViewToken: MutationRef;
    listEvents: QueryRef;
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
  billing: {
    createCheckoutSession: ActionRef;
    createPortalSession: ActionRef;
    entitlements: QueryRef;
    getTenantIfExists: QueryRef;
    resolveBillingContext: QueryRef;
    findStripeCustomerRecord: QueryRef;
    findStripeCustomerById: QueryRef;
    saveStripeCustomerRecord: MutationRef;
    markCheckoutInitiated: MutationRef;
    upsertStripeSubscriptionRecord: MutationRef;
  };
  onboarding: {
    startTenantSignup: MutationRef;
  };
};

type AugmentedInternal = typeof baseInternal & {
  invites: {
    _authorizeInviteCreator: InternalFunctionRef;
    _createInviteRecord: InternalFunctionRef;
    _markInviteRevoked: InternalFunctionRef;
    _logSecurityEvent: InternalFunctionRef;
  };
  billing: {
    handleStripeWebhook: InternalFunctionRef;
    sendOnboardingSuccessEmail: InternalFunctionRef;
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
  | "documents"
  | "documentEvents"
  | "otps"
  | "stripeCustomers"
  | "subscriptions"
  | "onboardingSessions"
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
    billingTier?: "essencial" | "plus" | "pro";
    billingStatus?:
      | "pending_checkout"
      | "active"
      | "trialing"
      | "past_due"
      | "canceled"
      | "unpaid"
      | "incomplete"
      | "incomplete_expired"
      | "unknown";
    onboardingTokenVersion?: number;
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
    pdfUrl?: string;
    documentId?: Id<"documents">;
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
  documents: DefaultDoc<"documents"> & {
    title: string;
    orgId: string;
    assemblyId?: string;
    storageId: string;
    contentType: string;
    size: number;
    sha256: string;
    visibility: "org" | "assembly" | "private";
    allowedRoles: string[];
    allowedUserIds: string[];
    createdByUserId: string;
    createdAt: number;
    lastViewedAt?: number;
    viewCount: number;
  };
  documentEvents: DefaultDoc<"documentEvents"> & {
    documentId: Id<"documents">;
    orgId: string;
    userId: string;
    event: "upload" | "view";
    createdAt: number;
  };
  stripeCustomers: DefaultDoc<"stripeCustomers"> & {
    tenantId: Id<"condos">;
    stripeCustomerId: string;
    email: string;
    createdAt: number;
    updatedAt?: number;
  };
  subscriptions: DefaultDoc<"subscriptions"> & {
    tenantId: Id<"condos">;
    stripeSubscriptionId: string;
    productId: string;
    priceId: string;
    status:
      | "active"
      | "trialing"
      | "past_due"
      | "canceled"
      | "unpaid"
      | "incomplete"
      | "incomplete_expired";
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAt?: number;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: number;
    latestInvoiceId?: string;
    latestInvoiceStatus?: string;
    updatedAt: number;
  };
  onboardingSessions: DefaultDoc<"onboardingSessions"> & {
    tenantId: Id<"condos">;
    tierKey: "essencial" | "plus" | "pro";
    email: string;
    tokenHash: string;
    status: "pending" | "checkout_started" | "completed" | "expired";
    createdAt: number;
    expiresAt: number;
    updatedAt?: number;
    metadata?: {
      adminName?: string;
    };
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
