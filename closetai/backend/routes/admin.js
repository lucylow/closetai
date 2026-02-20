// backend/routes/admin.js
// Minimal admin routes to view queue depth, tenant credits, last job metrics.
// Secured via requireAdmin middleware - implement your own RBAC.
const express = require("express");
const { connection } = require("../lib/queue");
const Redis = require("ioredis");
const perfect = require("../lib/perfectClient");
const router = express.Router();
const redis = new Redis(process.env.REDIS_URL);
// TODO: Implement your admin auth middleware
function requireAdmin(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: "Unauthorized" });
  req.user = { id: "admin-demo", roles: ["admin"] };
  next();
}
router.use(requireAdmin);
// Get Redis/Bull queue depth
router.get("/queue-depth", async (req, res) => {
  try {
    const client = connection;
    const prefix = process.env.QUEUE_NAME || "gen-queue";
    const waiting = await client.zcard(prefix + ":wait");
    const active = await client.zcard(prefix + ":active");
    const delayed = await client.zcard(prefix + ":delayed");
    res.json({ waiting, active, delayed });
  } catch (err) { console.error("queue-depth error", err); res.status(500).json({ error: "queue depth failed" }); }
});
// Get tenant credits from Redis
router.get("/tenant-credits/:tenantId", async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const credits = await perfect.getTenantCredits(tenantId);
    res.json({ tenantId, credits });
  } catch (err) { console.error("tenant credits error", err); res.status(500).json({ error: "tenant credits failed" }); }
});
// Meta info endpoint
router.get("/meta", async (req, res) => {
  try {
    const lastRefresh = await redis.get("meta:lastRefresh");
    const rateInfo = await redis.get("meta:rateInfo");
    res.json({ lastRefresh, rateInfo });
  } catch (err) { console.error("meta error", err); res.status(500).json({ error: "meta fetch failed" }); }
});
module.exports = router;
