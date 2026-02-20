// backend/workers/genWorker.js
// BullMQ Worker: processes jobs that call Perfect API, fetch outputs, store to S3, update DB and notify clients.
const { Worker } = require("bullmq");
const axios = require("axios");
const { connection } = require("../lib/queue");
const storage = require("../lib/storage");
const perfect = require("../lib/perfectClient");
// TODO: Replace with your db wrapper (pg/promise/knex). Provide query() method.
const db = require("../db");
// TODO: Replace with your websocket/push helper
const notify = require("../utils/notify");
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 2);
const worker = new Worker("gen-queue", async (job) => {
  const { name, data } = job;
  const jobId = data.jobId || job.id;
  const tenantId = data.tenantId || data.brandId || null;
  await db.query(
    "INSERT INTO gen_jobs (id, user_id, tenant_id, type, status, params, created_at) VALUES ($1,$2,$3,$4,$5,$6,now()) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, updated_at=now()",
    [jobId, data.userId || null, tenantId, name, "running", JSON.stringify(data)]
  );
  try {
    if (name === "text2img") {
      const payload = { prompt: data.prompt, width: data.width || 1024, height: data.height || 1024 };
      const resp = await perfect.text2img(payload, tenantId);
      let buffer;
      if (resp.data && resp.data.image_base64) { buffer = Buffer.from(resp.data.image_base64, "base64"); }
      else if (resp.data && resp.data.image_url) { const r = await axios.get(resp.data.image_url, { responseType: "arraybuffer" }); buffer = Buffer.from(r.data); }
      else { throw new Error("Unexpected Perfect text2img response shape"); }
      const key = storage.jobKey(jobId, "result.png");
      await storage.uploadBuffer(buffer, key, "image/png");
      await db.query("UPDATE gen_jobs SET status=$1, result_keys=$2, updated_at=now() WHERE id=$3", ["completed", JSON.stringify([key]), jobId]);
      const signedUrl = storage.getSignedGetUrl(key, 60 * 60);
      await notify.emitToUser(data.userId, "job.completed", { jobId, result: signedUrl });
      return { key, signedUrl };
    }
    if (name === "imageEdit") {
      const srcUrl = storage.getSignedGetUrl(data.srcKey, 300);
      const payload = { image_url: srcUrl, ...data.editParams };
      const resp = await perfect.imageEdit(payload, tenantId);
      let buffer;
      if (resp.data && resp.data.image_base64) { buffer = Buffer.from(resp.data.image_base64, "base64"); }
      else if (resp.data && resp.data.image_url) { const r = await axios.get(resp.data.image_url, { responseType: "arraybuffer" }); buffer = Buffer.from(r.data); }
      else { throw new Error("Unexpected Perfect imageEdit response"); }
      const key = storage.jobKey(jobId, "imageEdit.png");
      await storage.uploadBuffer(buffer, key, "image/png");
      await db.query("UPDATE gen_jobs SET status=$1, result_keys=$2, updated_at=now() WHERE id=$3", ["completed", JSON.stringify([key]), jobId]);
      const signedUrl = storage.getSignedGetUrl(key, 3600);
      await notify.emitToUser(data.userId, "job.completed", { jobId, result: signedUrl });
      return { key, signedUrl };
    }
    if (name === "tryon") {
      const personUrl = storage.getSignedGetUrl(data.personKey, 300);
      const garmentUrl = storage.getSignedGetUrl(data.garmentKey, 300);
      const payload = { src_person_file_url: personUrl, src_garment_file_url: garmentUrl, style_params: data.options || {} };
      const resp = await perfect.tryOn(payload, tenantId);
      if (resp.data && resp.data.task_id) {
        const taskId = resp.data.task_id;
        let finished = false;
        let attempts = 0;
        let finalResp = null;
        while (!finished && attempts < 60) {
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          const statusResp = await perfect.getTaskStatus(taskId);
          const status = statusResp.data?.status || (statusResp.data && statusResp.data.state);
          if (status === "success" || status === "finished" || status === "completed") { finalResp = statusResp.data; finished = true; break; }
          if (status === "failed" || status === "error") { throw new Error("Perfect tryOn task failed: " + JSON.stringify(statusResp.data)); }
        }
        if (!finished) { throw new Error("Timeout waiting for Perfect tryOn task"); }
        const outputUrl = finalResp.output_url || (finalResp.outputs && finalResp.outputs[0] && finalResp.outputs[0].url);
        if (!outputUrl) throw new Error("No output url from Perfect tryOn final response");
        const r = await axios.get(outputUrl, { responseType: "arraybuffer" });
        const buf = Buffer.from(r.data);
        const key = storage.jobKey(jobId, "tryon_result.png");
        await storage.uploadBuffer(buf, key, "image/png");
        await db.query("UPDATE gen_jobs SET status=$1, result_keys=$2, updated_at=now() WHERE id=$3", ["completed", JSON.stringify([key]), jobId]);
        const signedUrl = storage.getSignedGetUrl(key, 3600);
        await notify.emitToUser(data.userId, "job.completed", { jobId, result: signedUrl });
        return { key, signedUrl };
      } else {
        let buffer;
        if (resp.data && resp.data.image_base64) buffer = Buffer.from(resp.data.image_base64, "base64");
        else if (resp.data && resp.data.image_url) { const r = await axios.get(resp.data.image_url, { responseType: "arraybuffer" }); buffer = Buffer.from(r.data); }
        else { throw new Error("Unexpected tryOn response"); }
        const key = storage.jobKey(jobId, "tryon_result.png");
        await storage.uploadBuffer(buffer, key, "image/png");
        await db.query("UPDATE gen_jobs SET status=$1, result_keys=$2, updated_at=now() WHERE id=$3", ["completed", JSON.stringify([key]), jobId]);
        const signedUrl = storage.getSignedGetUrl(key, 3600);
        await notify.emitToUser(data.userId, "job.completed", { jobId, result: signedUrl });
        return { key, signedUrl };
      }
    }
    if (name === "skinAnalysis") {
      const srcUrl = storage.getSignedGetUrl(data.srcKey, 300);
      const payload = { src_file_url: srcUrl, actions: data.options || ["wrinkle", "pigment", "moisture"] };
      const resp = await perfect.skinAnalysis(payload, tenantId);
      const report = resp.data;
      const jsonKey = storage.jobKey(jobId, "skin_report.json");
      await storage.uploadBuffer(Buffer.from(JSON.stringify(report)), jsonKey, "application/json");
      let uploadedKeys = [jsonKey];
      if (report.overlays && Array.isArray(report.overlays)) {
        for (let i = 0; i < report.overlays.length; i++) {
          const url = report.overlays[i];
          try {
            const r = await axios.get(url, { responseType: "arraybuffer" });
            const k = storage.jobKey(jobId, "overlay_" + i + ".png");
            await storage.uploadBuffer(Buffer.from(r.data), k, "image/png");
            uploadedKeys.push(k);
          } catch (err) { console.warn("Failed to download overlay", err?.message); }
        }
      }
      await db.query("UPDATE gen_jobs SET status=$1, result_keys=$2, metadata=$3, updated_at=now() WHERE id=$4", ["completed", JSON.stringify(uploadedKeys), JSON.stringify(report), jobId]);
      const signedUrls = uploadedKeys.map(k => storage.getSignedGetUrl(k, 60 * 60));
      await notify.emitToUser(data.userId, "job.completed", { jobId, results: signedUrls, metadata: report });
      return { uploadedKeys, signedUrls };
    }
    throw new Error("Unknown job type: " + name);
  } catch (err) {
    await db.query("UPDATE gen_jobs SET status=$1, error=$2, updated_at=now() WHERE id=$3", ["failed", String(err.message || err), jobId]);
    await notify.emitToUser(data.userId, "job.failed", { jobId, error: String(err.message || err) });
    throw err;
  }
}, { connection, concurrency: WORKER_CONCURRENCY });
worker.on("failed", (job, err) => { console.error("Worker job failed", job.id, err?.message); });
module.exports = worker;
