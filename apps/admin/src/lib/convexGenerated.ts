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
    listResidentCondosByEmail: MutationRef;
    listResidentCondosForSession: QueryRef;
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
    create: MutationRef;
    update: MutationRef;
    remove: MutationRef;
  };
  minutes: {
    list: QueryRef;
    get: QueryRef;
    getFinalReport: QueryRef;
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
  usage: {
    getUsageSummary: QueryRef;
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
    getReadState: QueryRef;
    markRead: MutationRef;
  };
  communications: {
    publish: MutationRef;
    listByCondo: QueryRef;
    listForResident: QueryRef;
    getForResident: QueryRef;
    getDetail: QueryRef;
    archive: MutationRef;
    resend: MutationRef;
    markOpened: MutationRef;
    deleteHard: MutationRef;
  };
  externalApi: {
    createApiKey: MutationRef;
    listApiKeys: QueryRef;
    revokeApiKey: MutationRef;
    issueToken: MutationRef;
    getUnits: QueryRef;
    getUnitDetail: QueryRef;
    createUnit: MutationRef;
    getResidents: QueryRef;
    getResidentDetail: QueryRef;
    createResident: MutationRef;
    getMinutes: QueryRef;
    getMinuteDetail: QueryRef;
    createMinute: MutationRef;
    closeMinute: MutationRef;
    getMinuteResult: QueryRef;
  };
  retention: {
    getPolicies: QueryRef;
    upsertPolicy: MutationRef;
    triggerRun: MutationRef;
    listRuns: QueryRef;
  };
  dsar: {
    createRequest: MutationRef;
    listRequests: QueryRef;
    getRequest: QueryRef;
    updateRequest: MutationRef;
    generateAccessExport: MutationRef;
    executeDeletion: MutationRef;
  };
  adminAudit: {
    listEvents: QueryRef;
  };
  residentDetail: {
    get: QueryRef;
    resendOtp: ActionRef;
  };
  imports: {
    bulkUpload: MutationRef;
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
  | "minuteFinalReports"
  | "votes"
  | "notificationLogs"
  | "notificationReads"
  | "residentCommunications"
  | "residentCommunicationReceipts"
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
  | "externalApiKeys"
  | "externalApiTokens"
  | "dataRetentionPolicies"
  | "dataRetentionRuns"
  | "dsarRequests"
  | "dsarRequestEvents"
  | "adminAuditEvents"
  | "usages"
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
    deletedAt?: number;
    anonymizedAt?: number;
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
    deletedAt?: number;
    anonymizedAt?: number;
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
  dataRetentionPolicies: DefaultDoc<"dataRetentionPolicies"> & {
    target: string;
    condoId?: Id<"condos">;
    retentionDays: number;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
    updatedBy?: string;
    note?: string;
  };
  dataRetentionRuns: DefaultDoc<"dataRetentionRuns"> & {
    startedAt: number;
    finishedAt: number;
    dryRun: boolean;
    maxRowsPerTarget: number;
    triggeredBy?: string;
    summary: any;
    createdAt: number;
  };
  dsarRequests: DefaultDoc<"dsarRequests"> & {
    type: "access" | "deletion";
    status: "open" | "in_review" | "approved" | "rejected" | "completed";
    subjectType: "resident";
    residentId?: Id<"residents">;
    residentEmail?: string;
    condoId?: Id<"condos">;
    protocol: string;
    requestedAt: number;
    dueAt: number;
    completedAt?: number;
    assignedTo?: string;
    createdBy: string;
    updatedBy: string;
    resolutionNote?: string;
    exportLastGeneratedAt?: number;
    deletionExecutedAt?: number;
    lastResultSummary?: any;
    createdAt: number;
    updatedAt: number;
  };
  dsarRequestEvents: DefaultDoc<"dsarRequestEvents"> & {
    requestId: Id<"dsarRequests">;
    action: string;
    actor: string;
    createdAt: number;
    note?: string;
    payload?: any;
  };
  adminAuditEvents: DefaultDoc<"adminAuditEvents"> & {
    action: string;
    actorType: string;
    actorId?: string;
    actorKey: string;
    condoId?: Id<"condos">;
    entityType: string;
    entityId?: string;
    before?: any;
    after?: any;
    metadata?: any;
    createdAt: number;
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
  minuteFinalReports: DefaultDoc<"minuteFinalReports"> & {
    minuteId: Id<"minutes">;
    condoId: Id<"condos">;
    source: "manual" | "automatic";
    generatedAt: number;
    closedAt: number;
    snapshotHash: string;
    snapshot: any;
    htmlContent: string;
    reportStorageId?: string;
    reportDocumentId?: Id<"documents">;
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
  notificationReads: DefaultDoc<"notificationReads"> & {
    userId: string;
    scopeKey: string;
    condoId?: Id<"condos">;
    lastReadAt: number;
    updatedAt: number;
  };
  residentCommunications: DefaultDoc<"residentCommunications"> & {
    condoId: Id<"condos">;
    title: string;
    message?: string;
    documentId?: Id<"documents">;
    audienceType: "all" | "role" | "block";
    targetRole?: string;
    targetBlock?: string;
    publishedBy: Id<"residents">;
    status: "published" | "archived";
    publishedAt: number;
    createdAt: number;
    updatedAt: number;
  };
  residentCommunicationReceipts: DefaultDoc<"residentCommunicationReceipts"> & {
    communicationId: Id<"residentCommunications">;
    residentId: Id<"residents">;
    email?: string;
    sentCount: number;
    failedCount: number;
    lastSentAt?: number;
    lastFailedAt?: number;
    lastError?: string;
    openCount: number;
    lastOpenedAt?: number;
    createdAt: number;
    updatedAt: number;
  };
  usages: DefaultDoc<"usages"> & {
    tenantId: Id<"condos">;
    type: "assembly";
    bucketKey: string;
    count: number;
    updatedAt: number;
  };
};

export type Doc<TableName extends TableNames = TableNames> = TableName extends keyof DocByTable
  ? DocByTable[TableName]
  : DefaultDoc<TableName> & Record<string, unknown>;
