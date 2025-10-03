import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  minutes: defineTable({
    condominiumId: v.string(),
    title: v.string(),
    pdfUrl: v.string(),
    publishedAt: v.number(),
    closesAt: v.number(),
    status: v.string()
  }).index("byCondo", ["condominiumId"])
});
