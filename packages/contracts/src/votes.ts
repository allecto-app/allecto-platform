import { z } from "zod";

export const VoteSchema = z.object({
  id: z.string(),
  minuteId: z.string(),
  residentId: z.string(),
  unitId: z.string(),
  choice: z.enum(["agree", "disagree"]),
  comment: z.string().optional(),
  createdAt: z.number()
});

export type Vote = z.infer<typeof VoteSchema>;

export const CastVoteInput = z.object({
  minuteId: z.string(),
  unitId: z.string(),
  residentId: z.string(),
  choice: z.enum(["agree", "disagree"]),
  comment: z.string().optional()
});
