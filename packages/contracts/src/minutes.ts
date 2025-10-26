import { z } from "zod";

export const MinuteSchema = z.object({
  id: z.string(),
  condominiumId: z.string(),
  title: z.string(),
  documentId: z.string(),
  pdfUrl: z.string().url().optional(),
  publishedAt: z.number(),
  closesAt: z.number(),
  status: z.enum(["open", "closed"])
});

export type Minute = z.infer<typeof MinuteSchema>;

export const PublishMinuteInput = z.object({
  condominiumId: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  documentId: z.string(),
  closesAt: z.number()
});
