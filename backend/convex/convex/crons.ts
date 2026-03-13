import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily data retention cleanup.
// Schedule is in UTC.
crons.cron("data-retention-daily", "15 3 * * *", internal.retention.executeRetention, {
  dryRun: false,
  maxRowsPerTarget: 500,
  triggeredBy: "system:cron:data-retention-daily",
});

export default crons;
