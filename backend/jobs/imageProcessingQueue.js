const env = require('../config/env');
const redis = require('../utils/redis');

let imageQueue = null;
let redisAvailable = false;

try {
  const Queue = require('bull');
  imageQueue = new Queue('image-processing', {
    redis: {
      host: env.redis?.host || 'localhost',
      port: env.redis?.port || 6379,
    },
    defaultJobOptions: { removeOnComplete: 100 },
  });
  redisAvailable = true;

  const imageProcessingService = require('../services/imageProcessing.service');
  const linodeService = require('../services/linode.service');
  const { WardrobeItem } = require('../models');

  imageQueue.process(async (job) => {
    const { fileBufferBase64, fileName, userId, jobId } = job.data;
    const fileBuffer = Buffer.from(fileBufferBase64 || '', 'base64');
    const steps = ['validate', 'remove-bg', 'extract', 'embed', 'save'];

    const updateProgress = (step, data = {}) => {
      const stepIndex = steps.indexOf(step) + 1;
      job.progress((stepIndex / steps.length) * 100);
      if (jobId) {
        redis.publish(`image:${jobId}`, JSON.stringify({ step, ...data }));
      }
    };

    try {
      updateProgress('validate');
      const { validateImage, resize } = require('../image-pipeline/utils/imageHelpers');
      const validated = await validateImage(fileBuffer, fileName);
      if (!validated.valid) {
        throw new Error(validated.error || 'Invalid image');
      }
      const resizedBuffer = await resize(fileBuffer, 1024);

      updateProgress('remove-bg');
      const ext = validated.extension || (fileName || '').split('.').pop() || 'jpg';
      const processedBuffer = await imageProcessingService.removeBackground(resizedBuffer, ext);

      updateProgress('extract');
      const attributes = await imageProcessingService.extractAttributes(processedBuffer, fileName);

      updateProgress('embed');
      const embedding = await imageProcessingService.generateEmbedding(processedBuffer);

      updateProgress('save');
      const { url, key } = await linodeService.uploadFile(
        processedBuffer,
        fileName,
        userId,
        'processed'
      );

      const item = await WardrobeItem.create({
        userId,
        imageUrl: url,
        imageKey: key,
        extractedAttributes: attributes,
        embedding,
      });

      updateProgress('complete', { itemId: item.id });
      return { success: true, itemId: item.id };
    } catch (error) {
      updateProgress('error', { error: error.message });
      throw error;
    }
  });
} catch (err) {
  console.warn('Image processing queue disabled (Redis unavailable):', err.message);
}

module.exports = { imageQueue, redisAvailable };
