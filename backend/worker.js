// backend/worker.js
require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const debug = require('debug')('closet:worker');

const perfectCorp = require('./services/perfectCorp.service');
const storage = require('./lib/storage');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'perfectcorp-jobs';
const connection = new IORedis(REDIS_URL);

// Worker - process jobs
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { type, payload } = job.data; // note: we enqueued with add(type, { type, payload })
    debug('Processing job', job.id, type);

    if (type === 'vton') {
      // payload must include modelKey and garmentKey
      const { modelKey, garmentKey, opts = {} } = payload;
      if (!modelKey || !garmentKey) throw new Error('vton job requires modelKey and garmentKey');

      // download source images from storage
      job.updateProgress(10);
      const modelBuf = await storage.getObjectBuffer(modelKey);
      job.updateProgress(30);
      const garmentBuf = await storage.getObjectBuffer(garmentKey);
      job.updateProgress(50);

      // call Perfect Corp service (virtualTryOn(modelBuf, garmentBuf, category, fit))
      const resultBuffer = await perfectCorp.virtualTryOn(
        modelBuf,
        garmentBuf,
        opts.category || 'top',
        opts.fit || 'standard'
      );
      job.updateProgress(80);

      // upload result and return URL
      const filename = `uploads/vton_result_${Date.now()}.png`;
      const uploaded = await storage.uploadBuffer(resultBuffer, filename, 'image/png');
      job.updateProgress(100);

      // return value will be saved and accessible via getJobStatus
      return { result: uploaded, message: 'VTON completed' };
    }

    if (type === 'generate') {
      const { prompt, opts = {} } = payload;
      if (!prompt) throw new Error('generate job requires prompt');

      job.updateProgress(10);
      const maybe = await perfectCorp.generateImage(prompt, opts.style || 'photorealistic');
      job.updateProgress(60);

      // maybe is Buffer or JSON. Handle Buffer -> upload
      if (Buffer.isBuffer(maybe)) {
        const filename = `uploads/ai_gen_${Date.now()}.png`;
        const uploaded = await storage.uploadBuffer(maybe, filename, 'image/png');
        job.updateProgress(100);
        return { result: uploaded, message: 'Image generation completed' };
      } else {
        // if API returned JSON with URL(s)
        job.updateProgress(100);
        return { result: maybe, message: 'Image generation returned JSON' };
      }
    }

    if (type === 'measure') {
      const { modelKey } = payload;
      if (!modelKey) throw new Error('measure job requires modelKey');
      job.updateProgress(10);
      const buf = await storage.getObjectBuffer(modelKey);
      job.updateProgress(40);
      const measurements = await perfectCorp.estimateMeasurements(buf);
      job.updateProgress(100);
      return { result: measurements, message: 'Measurements completed' };
    }

    throw new Error(`Unknown job type: ${type}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  debug(`Job ${job.id} completed. Return: ${JSON.stringify(job.returnvalue)}`);
});
worker.on('failed', (job, err) => {
  debug(`Job ${job?.id} failed: ${err?.message}`);
});
worker.on('progress', (job, progress) => {
  debug(`Job ${job.id} progress: ${progress}`);
});

console.log('Worker started for queue', QUEUE_NAME);
