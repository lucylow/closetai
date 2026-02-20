// backend/routes/gen.routes.js
// Express router for generation endpoints: upload url, estimate, create job, job status, feedback
const express = require("express");
const { getSignedPutUrl, getSignedGetUrl, jobKey } = require("../lib/storage");
const { addJob } = require("../lib/queue");
const db = require("../db");
// TODO: Implement credits mapping/reservation
const credits = require("../lib/credits");
// TODO: Implement websocket/push helper
const notify = require("../utils/notify");
const router = express.Router();
// TODO: Replace with your JWT verification middleware
function verifyJWT(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: "Not authorized" });
  // TODO: decode token and attach user
  req.user = { id: "user-demo", tenantId: "tenant-demo" };
  next();
}
// Get upload URL for client
router.post("/upload-url", verifyJWT, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename) return res.status(400).json({ error: "filename required" });
    const key = "user/" + req.user.id + "/uploads/" + Date.now() + "-" + filename;
    const uploadUrl = getSignedPutUrl(key, 600, contentType || "image/jpeg");
    res.json({ key, uploadUrl, previewUrl: null });
  } catch (err) { console.error("upload-url error", err); res.status(500).json({ error: "upload-url failed" }); }
});
// Cost estimate
router.post("/estimate", verifyJWT, async (req, res) => {
  try {
    const { jobType, params } = req.body;
    const estimate = credits.estimateCost(jobType, params, req.user.tenantId);
    res.json({ estimate });
  } catch (err) { console.error("estimate error", err); res.status(500).json({ error: "estimate failed" }); }
});
// Create job
router.post("/create", verifyJWT, async (req, res) => {
  try {
    const { jobType, params } = req.body;
    const estimate = credits.estimateCost(jobType, params, req.user.tenantId);
    const reserved = await credits.reserveCredits(req.user.tenantId, req.user.id, estimate.total);
    if (!reserved) return res.status(402).json({ error: "Insufficient credits" });
    const jobId = "job_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    await db.query("INSERT INTO gen_jobs (id, user_id, tenant_id, type, status, params, created_at) VALUES ($1,$2,$3,$4,$5,$6,now())", [jobId, req.user.id, req.user.tenantId, jobType, "queued", JSON.stringify(params)]);
    await addJob(jobType, { jobId, userId: req.user.id, tenantId: req.user.tenantId, ...params });
    res.json({ jobId, estimatedCost: estimate.total });
  } catch (err) { console.error("create job error", err); res.status(500).json({ error: "job creation failed" }); }
});
// Get job status
router.get("/job/:jobId", verifyJWT, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const r = await db.query("SELECT id, user_id, tenant_id, type, status, params, result_keys, metadata, error FROM gen_jobs WHERE id=$1", [jobId]);
    if (!r.rows.length) return res.status(404).json({ error: "Job not found" });
    const job = r.rows[0];
    if (job.user_id !== req.user.id && req.user.roles && !req.user.roles.includes("admin")) { return res.status(403).json({ error: "forbidden" }); }
    const keys = job.result_keys || [];
    const signedUrls = (keys && Array.isArray(keys)) ? keys.map(k => getSignedGetUrl(k, 60 * 60)) : [];
    res.json({ job: { id: job.id, type: job.type, status: job.status, metadata: job.metadata, error: job.error }, results: signedUrls });
  } catch (err) { console.error("job status error", err); res.status(500).json({ error: "job status failed" }); }
});
// Feedback endpoint
router.post("/job/:jobId/feedback", verifyJWT, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { rating, tags, comment } = req.body;
    await db.query("INSERT INTO job_feedback (job_id, user_id, rating, tags, comment, created_at) VALUES ($1,$2,$3,$4,$5,now())", [jobId, req.user.id, rating || null, JSON.stringify(tags || []), comment || null]);
    res.json({ ok: true });
  } catch (err) { console.error("feedback error", err); res.status(500).json({ error: "feedback failed" }); }
});
module.exports = router;
