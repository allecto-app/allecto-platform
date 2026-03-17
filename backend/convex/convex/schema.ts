// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const Branding = v.object({
  logoUrl: v.optional(v.string()),
  logoStorageId: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  secondaryColor: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  displayName: v.optional(v.string()),
});

export default defineSchema({
  condos: defineTable({
    name: v.string(),
    subdomain: v.string(),
    branding: Branding,
    timezone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    disabledAt: v.optional(v.number()),
    billingTier: v.optional(
      v.union(v.literal("essencial"), v.literal("plus"), v.literal("pro")),
    ),
    billingStatus: v.optional(
      v.union(
        v.literal("pending_checkout"),
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid"),
        v.literal("incomplete"),
        v.literal("incomplete_expired"),
        v.literal("unknown"),
      ),
    ),
    onboardingTokenVersion: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("bySubdomain", ["subdomain"])
    .searchIndex("searchByName", { searchField: "name" }),

  units: defineTable({
    condoId: v.id("condos"),
    code: v.string(),
    block: v.optional(v.string()),
    floor: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCondo", ["condoId"])
    .index("byCondoCode", ["condoId", "code"]),

  residents: defineTable({
    condoId: v.id("condos"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.string(), // "resident" | "syndic" | "manager" | "council"
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCondo", ["condoId"])
    .index("byCondoEmail", ["condoId", "email"])
    .index("byEmail", ["email"]),

  memberships: defineTable({
    residentId: v.id("residents"),
    unitId: v.id("units"),
    role: v.optional(v.string()), // "owner" | "tenant"
    createdAt: v.number(),
  })
    .index("byResident", ["residentId"])
    .index("byUnit", ["unitId"]),

  residentCommunications: defineTable({
    condoId: v.id("condos"),
    title: v.string(),
    message: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    audienceType: v.union(v.literal("all"), v.literal("role"), v.literal("block")),
    targetRole: v.optional(v.string()),
    targetBlock: v.optional(v.string()),
    publishedBy: v.id("residents"),
    status: v.union(v.literal("published"), v.literal("archived")),
    publishedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCondo", ["condoId"])
    .index("byCondoStatus", ["condoId", "status"]),

  residentCommunicationReceipts: defineTable({
    communicationId: v.id("residentCommunications"),
    residentId: v.id("residents"),
    email: v.optional(v.string()),
    sentCount: v.number(),
    failedCount: v.number(),
    lastSentAt: v.optional(v.number()),
    lastFailedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    openCount: v.number(),
    lastOpenedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCommunication", ["communicationId"])
    .index("byCommunicationResident", ["communicationId", "residentId"]),

  minutes: defineTable({
    condoId: v.id("condos"),
    title: v.string(),
    summary: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    publishedAt: v.number(),
    closesAt: v.number(),
    status: v.string(), // "open" | "closed"
    createdBy: v.id("residents"),
    reminderD2Scheduled: v.boolean(),
    reminderD4Scheduled: v.boolean(),
    closeScheduled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCondo", ["condoId"])
    .index("byCondoStatus", ["condoId", "status"])
    .index("byCloseTime", ["closesAt"]),

  minuteFinalReports: defineTable({
    minuteId: v.id("minutes"),
    condoId: v.id("condos"),
    source: v.union(v.literal("manual"), v.literal("automatic")),
    generatedAt: v.number(),
    closedAt: v.number(),
    snapshotHash: v.string(),
    snapshot: v.any(),
    htmlContent: v.string(),
    reportStorageId: v.optional(v.string()),
    reportDocumentId: v.optional(v.id("documents")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byMinute", ["minuteId"])
    .index("byCondo", ["condoId"]),

  votes: defineTable({
    minuteId: v.id("minutes"),
    unitId: v.id("units"),
    residentId: v.id("residents"),
    choice: v.string(), // "agree" | "disagree"
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byMinute", ["minuteId"])
    .index("byMinuteUnit", ["minuteId", "unitId"])
    .index("byResidentMinute", ["residentId", "minuteId"])
    .index("byUnit", ["unitId"]),

  documents: defineTable({
    title: v.string(),
    orgId: v.string(),
    assemblyId: v.optional(v.string()),
    storageId: v.string(),
    contentType: v.string(),
    size: v.number(),
    sha256: v.string(),
    visibility: v.union(v.literal("org"), v.literal("assembly"), v.literal("private")),
    allowedRoles: v.array(v.string()),
    allowedUserIds: v.array(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    lastViewedAt: v.optional(v.number()),
    viewCount: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_assembly", ["assemblyId"]),

  documentEvents: defineTable({
    documentId: v.id("documents"),
    orgId: v.string(),
    userId: v.string(),
    event: v.union(
      v.literal("upload"),
      v.literal("view"),
      v.literal("view_token_issued"),
      v.literal("download"),
    ),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_document", ["documentId"])
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"]),

  notificationLogs: defineTable({
    condoId: v.id("condos"),
    minuteId: v.optional(v.id("minutes")),
    channel: v.string(), // "push" | "sms" | "email"
    template: v.string(), // "convocation" | "reminderD2" | "reminderD4" | "closed"
    audienceCount: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    createdAt: v.number(),
    meta: v.optional(v.any()),
  }).index("byCondo", ["condoId"]),

  notificationReads: defineTable({
    userId: v.string(),
    scopeKey: v.string(),
    condoId: v.optional(v.id("condos")),
    lastReadAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserScope", ["userId", "scopeKey"])
    .index("byUser", ["userId"]),

  otps: defineTable({
    condoId: v.id("condos"),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    code: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("byCondoEmail", ["condoId", "email"])
    .index("byCondoPhone", ["condoId", "phone"]),

  stripeCustomers: defineTable({
    tenantId: v.id("condos"),
    stripeCustomerId: v.string(),
    email: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("byTenant", ["tenantId"])
    .index("byStripeCustomerId", ["stripeCustomerId"])
    .index("byEmail", ["email"]),

  subscriptions: defineTable({
    tenantId: v.id("condos"),
    stripeSubscriptionId: v.string(),
    productId: v.string(),
    priceId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("incomplete"),
      v.literal("incomplete_expired")
    ),
    tierKey: v.optional(
      v.union(v.literal("essencial"), v.literal("plus"), v.literal("pro"))
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    trialEnd: v.optional(v.number()),
    latestInvoiceId: v.optional(v.string()),
    latestInvoiceStatus: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("byTenant", ["tenantId"])
    .index("byStripeSubscriptionId", ["stripeSubscriptionId"])
    .index("byPriceId", ["priceId"]),

  onboardingSessions: defineTable({
    tenantId: v.id("condos"),
    tierKey: v.union(
      v.literal("essencial"),
      v.literal("plus"),
      v.literal("pro"),
    ),
    email: v.string(),
    tokenHash: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("checkout_started"),
      v.literal("completed"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    updatedAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      adminName: v.optional(v.string()),
    })),
  })
    .index("byTokenHash", ["tokenHash"])
    .index("byTenant", ["tenantId"]),

  platformUsers: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    roles: v.array(v.string()), // ["super_admin","support","ops"]
    createdAt: v.number(),
  passwordHash: v.optional(v.string()),
  lastLoginAt: v.optional(v.number()),
}).index("byEmail", ["email"]),

  passwordResets: defineTable({
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  }).index("byEmail", ["email"]),

  loginAttempts: defineTable({
    email: v.string(),
    ip: v.string(),
    attempts: v.number(),
    firstAttemptAt: v.number(),
    lastAttemptAt: v.number(),
    blockedUntil: v.optional(v.number()),
  })
    .index("byEmailIp", ["email", "ip"])
    .index("byIp", ["ip"]),

  sessions: defineTable({
    tokenDigest: v.string(),
    tokenHash: v.string(),
    type: v.string(), // "platform" | "resident"
    platformUserId: v.optional(v.id("platformUsers")),
    residentId: v.optional(v.id("residents")),
    condoId: v.optional(v.id("condos")),
    roles: v.array(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
    lastUsedAt: v.number(),
    revokedAt: v.optional(v.number()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("byDigest", ["tokenDigest"])
    .index("byResident", ["residentId"]),

  securityEvents: defineTable({
    type: v.string(),
    key: v.string(),
    severity: v.optional(v.union(v.literal("info"), v.literal("warn"), v.literal("critical"))),
    createdAt: v.number(),
    meta: v.optional(v.any()),
  })
    .index("byKey", ["key"])
    .index("byType", ["type"]),

  securityRateLimits: defineTable({
    scope: v.string(),
    key: v.string(),
    scopeKey: v.string(),
    windowStart: v.number(),
    count: v.number(),
    blockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("byScopeKey", ["scopeKey"])
    .index("byScopeUpdatedAt", ["scope", "updatedAt"]),

  documentViewTokens: defineTable({
    tokenHash: v.string(),
    documentId: v.id("documents"),
    orgId: v.string(),
    issuedToUserId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    issuedFromIp: v.optional(v.string()),
    issuedUserAgent: v.optional(v.string()),
    redeemedFromIp: v.optional(v.string()),
    redeemedUserAgent: v.optional(v.string()),
  })
    .index("byTokenHash", ["tokenHash"])
    .index("byDocument", ["documentId"])
    .index("byExpiry", ["expiresAt"]),

  externalApiKeys: defineTable({
    condoId: v.id("condos"),
    residentId: v.id("residents"),
    name: v.optional(v.string()),
    keyHash: v.string(),
    secretHash: v.string(),
    keyPrefix: v.string(),
    scopes: v.optional(v.array(v.string())),
    allowedIps: v.optional(v.array(v.string())),
    status: v.union(v.literal("active"), v.literal("revoked")),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("byCondo", ["condoId"])
    .index("byKeyHash", ["keyHash"]),

  externalApiTokens: defineTable({
    keyId: v.id("externalApiKeys"),
    condoId: v.id("condos"),
    residentId: v.id("residents"),
    tokenHash: v.string(),
    scopes: v.optional(v.array(v.string())),
    issuedForIp: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
  })
    .index("byTokenHash", ["tokenHash"])
    .index("byKey", ["keyId"])
    .index("byCondo", ["condoId"]),

  invites: defineTable({
    condoId: v.id("condos"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.literal("syndic"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("platformUsers")),
    createdAt: v.number(),
    status: v.string(),
    attempts: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("byTokenHash", ["tokenHash"])
    .index("byCondoEmail", ["condoId", "email"]),

  inviteRate: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    blockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("byKey", ["key"]),

  dataRetentionPolicies: defineTable({
    target: v.string(),
    condoId: v.optional(v.id("condos")),
    retentionDays: v.number(),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("byTarget", ["target"])
    .index("byCondoTarget", ["condoId", "target"]),

  dataRetentionRuns: defineTable({
    startedAt: v.number(),
    finishedAt: v.number(),
    dryRun: v.boolean(),
    maxRowsPerTarget: v.number(),
    triggeredBy: v.optional(v.string()),
    summary: v.any(),
    createdAt: v.number(),
  }).index("byStartedAt", ["startedAt"]),

  dsarRequests: defineTable({
    type: v.union(v.literal("access"), v.literal("deletion")),
    status: v.union(
      v.literal("open"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
    ),
    subjectType: v.literal("resident"),
    residentId: v.optional(v.id("residents")),
    residentEmail: v.optional(v.string()),
    condoId: v.optional(v.id("condos")),
    protocol: v.string(),
    requestedAt: v.number(),
    dueAt: v.number(),
    completedAt: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    createdBy: v.string(),
    updatedBy: v.string(),
    resolutionNote: v.optional(v.string()),
    exportLastGeneratedAt: v.optional(v.number()),
    deletionExecutedAt: v.optional(v.number()),
    lastResultSummary: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byProtocol", ["protocol"])
    .index("byStatus", ["status"])
    .index("byRequestedAt", ["requestedAt"])
    .index("byResidentId", ["residentId"])
    .index("byCondo", ["condoId"]),

  dsarRequestEvents: defineTable({
    requestId: v.id("dsarRequests"),
    action: v.string(),
    actor: v.string(),
    createdAt: v.number(),
    note: v.optional(v.string()),
    payload: v.optional(v.any()),
  })
    .index("byRequest", ["requestId"])
    .index("byCreatedAt", ["createdAt"]),

  adminAuditEvents: defineTable({
    action: v.string(),
    actorType: v.string(),
    actorId: v.optional(v.string()),
    actorKey: v.string(),
    condoId: v.optional(v.id("condos")),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("byCreatedAt", ["createdAt"])
    .index("byActionCreatedAt", ["action", "createdAt"])
    .index("byActorCreatedAt", ["actorKey", "createdAt"])
    .index("byCondoCreatedAt", ["condoId", "createdAt"]),

  usages: defineTable({
    tenantId: v.id("condos"),
    type: v.literal("assembly"),
    bucketKey: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("byTenantTypeBucket", ["tenantId", "type", "bucketKey"]),
});
