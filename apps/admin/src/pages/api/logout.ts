import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../backend/convex/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined. Set it to your Convex deployment URL.");
}

const convexClient = new ConvexHttpClient(convexUrl);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const token = req.body?.token;

  if (typeof token !== "string" || token.length < 32) {
    return res.status(400).json({ ok: false, error: "Invalid token" });
  }

  try {
    await convexClient.mutation(api.auth.logout, { token });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to logout session", error);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}
