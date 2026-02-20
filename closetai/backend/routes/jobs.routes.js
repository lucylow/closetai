// backend/routes/jobs.routes.js
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const storage = require('../lib/storage');
const { enqueueJob, getJobStatus } = require('../lib/queue');

const upload = multer();
const router = express.Router();

// Upload files to storage, create job, return jobId
router.post(
  '/vton-async',
  upload.fields([{ name: 'modelImage' }, { name: 'garmentImage' }]),
  async (req, res) => {
    try {
      const modelFile = req.files?.modelImage?.[0];
      const garmentFile = req.files?.garmentImage?.[0];
      if (!modelFile || !garmentFile) {
        return res.status(400).json({ error: 'modelImage and garmentImage required' });
      }

      const modelKey = `uploads/${uuidv4()}_model.png`;
      const garmentKey = `uploads/${uuidv4()}_garment.png`;

      // upload to storage
      await storage.uploadBuffer(modelFile.buffer, modelKey, modelFile.mimetype);
      await storage.uploadBuffer(garmentFile.buffer, garmentKey, garmentFile.mimetype);

      // enqueue job - worker will fetch objects by key
      const job = await enqueueJob('vton', {
        modelKey,
        garmentKey,
        opts: { category: req.body.category },
      });
      return res.json({ jobId: job.id });
    } catch (err) {
      console.error('vton-async error', err);
      res.status(500).json({ error: 'Failed to enqueue job', detail: err.message });
    }
  }
);

// Poll job status
router.get('/:id', async (req, res) => {
  try {
    const info = await getJobStatus(req.params.id);
    if (!info) return res.status(404).json({ error: 'Job not found' });
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

module.exports = router;
