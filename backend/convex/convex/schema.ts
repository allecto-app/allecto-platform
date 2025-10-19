// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const Branding = v.object({
  logoUrl: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  secondaryColor: v.optional(v.string()),
  displayName: v.optional(v.string()),
});

export default defineSchema({
  condos: defineTable({
    name: v.string(),
    subdomain: v.string(),
    branding: Branding,
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

  minutes: defineTable({
    condoId: v.id("condos"),
    title: v.string(),
    summary: v.optional(v.string()),
    pdfUrl: v.string(),
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

  platformUsers: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    roles: v.array(v.string()), // ["super_admin","support","ops"]
    createdAt: v.number(),
    passwordHash: v.optional(v.string()),
    lastLoginAt: v.optional(v.number()),
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
  }).index("byDigest", ["tokenDigest"]),

  securityEvents: defineTable({
    type: v.string(),
    key: v.string(),
    createdAt: v.number(),
    meta: v.optional(v.any()),
  })
    .index("byKey", ["key"])
    .index("byType", ["type"]),

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
});
