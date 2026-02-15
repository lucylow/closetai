const { randomUUID } = require('crypto');
const { imageQueue, redisAvailable } = require('../jobs/imageProcessingQueue');
const redis = require('../utils/redis');
const imageProcessingService = require('../services/imageProcessing.service');
const linodeService = require('../services/linode.service');
const { WardrobeItem } = require('../models');

async function startProcessing(req, res, next) {
  const userId = req.user.id;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const jobId = randomUUID();

  if (!redisAvailable || !imageQueue) {
    try {
      const { processedBuffer, attributes, embedding } =
        await imageProcessingService.processUpload(file.buffer, file.originalname);
      const { url, key } = await linodeService.uploadFile(
        processedBuffer,
        file.originalname,
        userId,
        'processed'
      );
      const tags = req.body.tags
        ? typeof req.body.tags === 'string'
          ? JSON.parse(req.body.tags)
          : req.body.tags
        : [];
      const item = await WardrobeItem.create({
        userId,
        imageUrl: url,
        imageKey: key,
        extractedAttributes: attributes,
        userTags: tags,
        embedding,
      });
      return res.json({ jobId, itemId: item.id, sync: true });
    } catch (err) {
      return next(err);
    }
  }

  try {
    await imageQueue.add({
      fileBufferBase64: file.buffer.toString('base64'),
      fileName: file.originalname,
      userId,
      jobId,
    });
    res.json({ jobId });
  } catch (err) {
    next(err);
  }
}

async function streamProgress(req, res, next) {
  const { jobId } = req.params;
  const userId = req.user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  if (!redisAvailable) {
    res.write(`data: ${JSON.stringify({ step: 'error', error: 'SSE not available without Redis' })}\n\n`);
    res.end();
    return;
  }

  const unsub = redis.subscribe(`image:${jobId}`, (message) => {
    try {
      const data = JSON.parse(message);
      res.write(`data: ${message}\n\n`);
      if (data.step === 'complete' || data.step === 'error') {
        res.end();
      }
    } catch {
      res.write(`data: ${message}\n\n`);
    }
  });

  req.on('close', () => {
    if (unsub) unsub();
  });

  const timeout = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ step: 'timeout' })}\n\n`);
    res.end();
  }, 120000);
  res.on('close', () => clearTimeout(timeout));
}

module.exports = { startProcessing, streamProgress };
