// backend/lib/queueDemo.js
/**
 * Lightweight file-backed queue for demo mode.
 * Stores jobs in JOB_STORE_FILE.
 * 
 * API: addJob(type,payload), getJob(id), listJobs(), updateJob(id,patch)
 * 
 * For production, use BullMQ queue (queue.js).
 * This demo queue is used when INTEGRATION_MODE=demo.
 */

const fs = require('fs');
const path = require('path');

const JOB_STORE_FILE = process.env.JOB_STORE_FILE || path.join(process.cwd(), 'data', 'jobs.json');

function _ensureStore() {
  const dir = path.dirname(JOB_STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(JOB_STORE_FILE)) fs.writeFileSync(JOB_STORE_FILE, JSON.stringify({ jobs: [] }, null, 2));
}

async function _readStore() {
  _ensureStore();
  const txt = await fs.promises.readFile(JOB_STORE_FILE, 'utf8');
  return JSON.parse(txt);
}

async function _writeStore(obj) {
  await fs.promises.writeFile(JOB_STORE_FILE, JSON.stringify(obj, null, 2));
}

/**
 * Add a new job to the queue
 * @param {string} type - Job type (e.g., 'generate', 'tryon')
 * @param {object} payload - Job payload data
 */
async function addJob(type, payload) {
  const store = await _readStore();
  const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const job = { 
    id, 
    type, 
    payload, 
    status: 'pending', 
    result: null, 
    attempts: 0, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  };
  store.jobs.push(job);
  await _writeStore(store);
  return job;
}

/**
 * List all jobs
 */
async function listJobs() {
  const store = await _readStore();
  return store.jobs;
}

/**
 * Get a specific job by ID
 */
async function getJob(id) {
  const store = await _readStore();
  return store.jobs.find((j) => j.id === id) || null;
}

/**
 * Update a job with new data
 */
async function updateJob(id, patch) {
  const store = await _readStore();
  const idx = store.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  store.jobs[idx] = { ...store.jobs[idx], ...patch, updatedAt: new Date().toISOString() };
  await _writeStore(store);
  return store.jobs[idx];
}

/**
 * Get jobs by status
 */
async function getJobsByStatus(status) {
  const store = await _readStore();
  return store.jobs.filter((j) => j.status === status);
}

/**
 * Delete a job by ID
 */
async function deleteJob(id) {
  const store = await _readStore();
  const idx = store.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return false;
  store.jobs.splice(idx, 1);
  await _writeStore(store);
  return true;
}

/**
 * Clear all jobs (for testing)
 */
async function clearJobs() {
  await _writeStore({ jobs: [] });
}

module.exports = {
  addJob,
  listJobs,
  getJob,
  updateJob,
  getJobsByStatus,
  deleteJob,
  clearJobs,
  JOB_STORE_FILE,
};
