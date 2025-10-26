import { z } from "zod";

export const DocumentVisibilitySchema = z.enum(["org", "assembly", "private"]);
export type DocumentVisibility = z.infer<typeof DocumentVisibilitySchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  orgId: z.string(),
  assemblyId: z.string().optional().nullable(),
  storageId: z.string(),
  contentType: z.literal("application/pdf"),
  size: z.number().min(1).max(10 * 1024 * 1024),
  sha256: z.string().length(64),
  visibility: DocumentVisibilitySchema,
  allowedRoles: z.array(z.string()),
  allowedUserIds: z.array(z.string()),
  createdByUserId: z.string(),
  createdAt: z.number(),
  lastViewedAt: z.number().optional(),
  viewCount: z.number(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const DocumentEventSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  orgId: z.string(),
  userId: z.string(),
  event: z.enum(["upload", "view"]),
  createdAt: z.number(),
});

export type DocumentEvent = z.infer<typeof DocumentEventSchema>;

export const FinalizeUploadInputSchema = z.object({
  storageId: z.string(),
  title: z.string(),
  contentType: z.literal("application/pdf"),
  size: z.number().min(1).max(10 * 1024 * 1024),
  sha256: z.string().length(64),
  visibility: DocumentVisibilitySchema,
  assemblyId: z.string().optional(),
  allowedRoles: z.array(z.string()),
  allowedUserIds: z.array(z.string()),
});

export type FinalizeUploadInput = z.infer<typeof FinalizeUploadInputSchema>;
