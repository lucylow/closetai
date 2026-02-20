/**
 * Skin Analysis Worker - BullMQ worker for async Perfect Corp Skin Analysis API calls
 * Processes: Advanced skin analysis with visual overlays, skincare recommendations
 * 
 * Run via: node workers/skinAnalysisWorker.js
 * Or in k8s: kubectl apply -f deployment/kubernetes/skin-analysis-worker.yaml
 */
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Local imports
const db = require('../lib/db');
const skinAnalysisService = require('../services/skinAnalysis.service');
const skinRecommendationService = require('../services/skinRecommendation.service');
const storage = require('../lib/storage');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'skin-analysis-jobs';
const CONCURRENCY = parseInt(process.env.SKIN_ANALYSIS_CONCURRENCY || '5', 10);

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Track metrics
const metrics = {
  processed: 0,
  failed: 0,
  totalDuration: 0,
};

/**
 * Process advanced skin analysis job
 * This handles the complete workflow:
 * 1. Poll for task completion
 * 2. Download visual overlays
 * 3. Store results in S3 and DB
 * 4. Generate skincare recommendations
 * 5. Generate outfit suggestions
 */
async function processSkinAnalysisJob(job) {
  const { 
    taskId, 
    fileId, 
    userId, 
    tenantId, 
    analysisId,
    actions = skinAnalysisService.ADVANCED_ACTIONS 
  } = job.data;

  logger.info(`[skinAnalysisWorker] Processing job ${job.id}`, { 
    taskId, 
    userId, 
    actions 
  });

  const startTime = Date.now();

  try {
    // Step 1: Poll for task completion
    logger.info(`[skinAnalysisWorker] Polling for task completion: ${taskId}`);
    const parsedResults = await skinAnalysisService.pollTaskCompletion(taskId);
    
    logger.info(`[skinAnalysisWorker] Task completed, parsing results`, { 
      scores: parsedResults.scores 
    });

    // Step 2: Store visual overlays in S3
    let visualUrls = {};
    try {
      visualUrls = await skinAnalysisService.storeVisualOverlays(
        parsedResults, 
        tenantId, 
        userId, 
        analysisId
      );
      logger.info(`[skinAnalysisWorker] Stored ${Object.keys(visualUrls).length} visual overlays`);
    } catch (visualError) {
      logger.warn('[skinAnalysisWorker] Failed to store visual overlays:', visualError.message);
    }

    // Step 3: Save complete analysis results to database
    const savedAnalysisId = await skinAnalysisService.saveAnalysisResults(
      userId,
      taskId,
      parsedResults,
      visualUrls
    );

    // Step 4: Generate skincare recommendations based on skin scores
    const skincareRecommendations = await generateSkincareRecommendations(
      savedAnalysisId,
      parsedResults.scores
    );

    // Step 5: Generate outfit suggestions based on skin condition
    const outfitSuggestions = await generateOutfitSuggestions(
      savedAnalysisId,
      parsedResults,
      tenantId
    );

    // Step 6: Create shopping journey
    const journey = await createShoppingJourney(
      userId,
      savedAnalysisId,
      parsedResults
    );

    const duration = Date.now() - startTime;
    metrics.processed++;
    metrics.totalDuration += duration;

    logger.info(`[skinAnalysisWorker] Job completed successfully`, {
      jobId: job.id,
      duration: `${duration}ms`,
      analysisId: savedAnalysisId
    });

    return {
      success: true,
      analysisId: savedAnalysisId,
      scores: parsedResults.scores,
      overallScore: parsedResults.overallScore,
      visualsCount: Object.keys(visualUrls).length,
      skincareRecommendations: skincareRecommendations.length,
      outfitSuggestions: outfitSuggestions.length,
      journeyId: journey?.id,
      duration
    };

  } catch (error) {
    metrics.failed++;
    
    logger.error(`[skinAnalysisWorker] Job failed`, {
      jobId: job.id,
      error: error.message,
      stack: error.stack
    });

    // Update job status in database if we have analysisId
    if (analysisId) {
      try {
        await db.query(
          `UPDATE skin_analysis SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
          [error.message, analysisId]
        );
      } catch (dbError) {
        logger.warn('[skinAnalysisWorker] Failed to update job status in DB');
      }
    }

    throw error;
  }
}

/**
 * Generate skincare recommendations based on skin scores
 */
async function generateSkincareRecommendations(analysisId, scores) {
  const recommendations = [];

  // Acne recommendations
  if (scores.acne && scores.acne > 0.3) {
    recommendations.push({
      product_category: 'cleanser',
      concern_target: 'acne',
      product_name: 'Salicylic Acid Cleanser',
      suitability_score: Math.min(scores.acne * 1.2, 1),
      routine_order: 1,
      is_morning_routine: true,
      ingredients: ['Salicylic Acid', 'Tea Tree Oil', 'Green Tea Extract']
    });
    recommendations.push({
      product_category: 'treatment',
      concern_target: 'acne',
      product_name: 'Benzoyl Peroxide Spot Treatment',
      suitability_score: Math.min(scores.acne * 1.1, 1),
      routine_order: 3,
      is_morning_routine: false,
      ingredients: ['Benzoyl Peroxide', 'Niacinamide']
    });
  }

  // Pore recommendations
  if (scores.pore && scores.pore > 0.4) {
    recommendations.push({
      product_category: 'toner',
      concern_target: 'pore',
      product_name: 'Exfoliating Toner',
      suitability_score: Math.min(scores.pore * 1.1, 1),
      routine_order: 2,
      is_morning_routine: true,
      ingredients: ['AHA', 'BHA', 'Witch Hazel']
    });
    recommendations.push({
      product_category: 'mask',
      concern_target: 'pore',
      product_name: 'Clay Pore Mask',
      suitability_score: Math.min(scores.pore, 1),
      routine_order: 4,
      is_morning_routine: false,
      ingredients: ['Kaolin Clay', 'Charcoal', 'Tea Tree']
    });
  }

  // Oiliness recommendations
  if (scores.oiliness && scores.oiliness > 0.4) {
    recommendations.push({
      product_category: 'cleanser',
      concern_target: 'oiliness',
      product_name: 'Oil-Control Foaming Cleanser',
      suitability_score: Math.min(scores.oiliness * 1.2, 1),
      routine_order: 1,
      is_morning_routine: true,
      ingredients: ['Salicylic Acid', 'Tea Tree', 'Peppermint']
    });
    recommendations.push({
      product_category: 'moisturizer',
      concern_target: 'oiliness',
      product_name: 'Lightweight Gel Moisturizer',
      suitability_score: Math.min(scores.oiliness * 0.9, 1),
      routine_order: 3,
      is_morning_routine: true,
      ingredients: ['Hyaluronic Acid', 'Niacinamide', 'Green Tea']
    });
  }

  // Dryness/Moisture recommendations
  if (scores.moisture && scores.moisture < 0.5) {
    const moistureScore = 1 - scores.moisture;
    recommendations.push({
      product_category: 'serum',
      concern_target: 'moisture',
      product_name: 'Hyaluronic Acid Serum',
      suitability_score: moistureScore,
      routine_order: 2,
      is_morning_routine: true,
      ingredients: ['Hyaluronic Acid', 'Vitamin B5', 'Aloe Vera']
    });
    recommendations.push({
      product_category: 'moisturizer',
      concern_target: 'moisture',
      product_name: 'Rich Hydrating Cream',
      suitability_score: moistureScore,
      routine_order: 3,
      is_morning_routine: true,
      ingredients: ['Ceramides', 'Shea Butter', 'Squalane']
    });
  }

  // Radiance recommendations
  if (scores.radiance && scores.radiance < 0.6) {
    const radianceScore = 1 - scores.radiance;
    recommendations.push({
      product_category: 'serum',
      concern_target: 'radiance',
      product_name: 'Vitamin C Brightening Serum',
      suitability_score: radianceScore,
      routine_order: 2,
      is_morning_routine: true,
      ingredients: ['Vitamin C', 'Ferulic Acid', 'Niacinamide']
    });
  }

  // Redness/Sensitivity recommendations
  if (scores.redness && scores.redness > 0.3) {
    recommendations.push({
      product_category: 'toner',
      concern_target: 'redness',
      product_name: 'Calming Rosewater Toner',
      suitability_score: Math.min(scores.redness * 1.1, 1),
      routine_order: 2,
      is_morning_routine: true,
      ingredients: ['Rose Water', 'Chamomile', 'Cucumber Extract']
    });
    recommendations.push({
      product_category: 'moisturizer',
      concern_target: 'redness',
      product_name: 'Barrier Repair Cream',
      suitability_score: Math.min(scores.redness, 1),
      routine_order: 3,
      is_morning_routine: true,
      ingredients: ['Ceramides', 'Centella Asiatica', 'Allantoin']
    });
  }

  // Wrinkle/Aging recommendations
  if (scores.wrinkle && scores.wrinkle > 0.3) {
    recommendations.push({
      product_category: 'serum',
      concern_target: 'wrinkle',
      product_name: 'Retinol Night Serum',
      suitability_score: Math.min(scores.wrinkle * 1.1, 1),
      routine_order: 2,
      is_morning_routine: false,
      ingredients: ['Retinol', 'Peptides', 'Vitamin E']
    });
    recommendations.push({
      product_category: 'eye_care',
      concern_target: 'wrinkle',
      product_name: 'Peptide Eye Cream',
      suitability_score: Math.min(scores.wrinkle, 1),
      routine_order: 4,
      is_morning_routine: true,
      ingredients: ['Peptides', 'Caffeine', 'Hyaluronic Acid']
    });
  }

  // Everyone needs sunscreen!
  recommendations.push({
    product_category: 'sunscreen',
    concern_target: 'radiance',
    product_name: 'Broad Spectrum SPF 50',
    suitability_score: 1.0,
    routine_order: 5,
    is_morning_routine: true,
    ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Niacinamide']
  });

  // Save recommendations to database
  for (const rec of recommendations) {
    try {
      await db.query(
        `INSERT INTO skincare_recommendations 
          (skin_analysis_id, product_name, product_category, concern_target, 
           suitability_score, ingredients, routine_order, is_morning_routine)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          analysisId,
          rec.product_name,
          rec.product_category,
          rec.concern_target,
          rec.suitability_score,
          rec.ingredients,
          rec.routine_order,
          rec.is_morning_routine
        ]
      );
    } catch (dbError) {
      logger.warn('[skinAnalysisWorker] Failed to save skincare recommendation:', dbError.message);
    }
  }

  return recommendations;
}

/**
 * Generate outfit suggestions based on skin condition
 */
async function generateOutfitSuggestions(analysisId, parsedResults, tenantId) {
  const suggestions = [];
  const { scores, skinColorHex, undertone } = parsedResults;

  // Calculate outfit boost factors based on skin condition
  const skinBoostFactors = {
    radianceBoost: scores.radiance ? scores.radiance * 30 : 15,
    evennessBonus: scores.redness ? (1 - scores.redness) * 20 : 10,
    clarityScore: scores.texture ? (1 - scores.texture) * 25 : 12
  };

  // Determine recommended colors based on undertone
  let recommendedColors = [];
  let occasionStyles = [];

  if (undertone === 'warm') {
    recommendedColors = [
      '#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', 
      '#D2691E', '#B8860B', '#CD853F', '#556B2F'
    ];
    occasionStyles = [
      { occasion: 'casual', tags: ['earth-tones', 'warmneutrals'] },
      { occasion: 'work', tags: ['professional', 'mutedwarm'] },
      { occasion: 'evening', tags: ['bold', 'jeweltones'] }
    ];
  } else if (undertone === 'cool') {
    recommendedColors = [
      '#A0C4FF', '#BDB2FF', '#FFC6FF', '#000080', 
      '#4169E1', '#DC143C', '#FF00FF', '#800080'
    ];
    occasionStyles = [
      { occasion: 'casual', tags: ['pastels', 'soft'] },
      { occasion: 'work', tags: ['professional', 'navy'] },
      { occasion: 'evening', tags: ['bold', 'contrast'] }
    ];
  } else {
    recommendedColors = [
      '#FFFFFF', '#000000', '#808080', '#F5F5DC',
      '#D4A574', '#C87F3D', '#A0C4FF', '#FFA07A'
    ];
    occasionStyles = [
      { occasion: 'casual', tags: ['versatile', 'neutral'] },
      { occasion: 'work', tags: ['classic', 'minimal'] },
      { occasion: 'evening', tags: ['elegant', 'statement'] }
    ];
  }

  // High radiance = soft pastels look great
  if (scores.radiance && scores.radiance > 0.6) {
    suggestions.push({
      look_name: 'Soft & Radiant',
      look_description: 'Your glowing skin pairs beautifully with soft pastels and light colors that enhance your natural radiance.',
      outfit_score: 75 + skinBoostFactors.radianceBoost,
      color_palette: ['#FFB6C1', '#E6E6FA', '#F0E68C', '#98FB98'],
      style_tags: ['pastels', 'feminine', 'light'],
      occasion: 'casual',
      season_recommendation: 'spring',
      skin_boost_factors: skinBoostFactors
    });
  }

  // High redness = earth tones calm the appearance
  if (scores.redness && scores.redness > 0.3) {
    suggestions.push({
      look_name: 'Calm & Grounded',
      look_description: 'Earth tones and warm neutrals will complement your skin and create a balanced, calming appearance.',
      outfit_score: 70 + skinBoostFactors.evennessBonus,
      color_palette: ['#8B4513', '#556B2F', '#D2691E', '#F5DEB3'],
      style_tags: ['earth-tones', 'natural', 'warm'],
      occasion: 'casual',
      season_recommendation: 'autumn',
      skin_boost_factors: skinBoostFactors
    });
  }

  // Balanced skin = can wear anything
  suggestions.push({
    look_name: 'Classic Neutral',
    look_description: 'Your well-balanced skin tone works beautifully with classic neutrals. Black, white, and beige create timeless elegance.',
    outfit_score: 80,
    color_palette: ['#000000', '#FFFFFF', '#F5F5DC', '#C0C0C0'],
    style_tags: ['classic', 'minimal', 'versatile'],
    occasion: 'work',
    season_recommendation: 'all',
    skin_boost_factors: skinBoostFactors
  });

  // High contrast for dull skin
  if (scores.radiance && scores.radiance < 0.5) {
    suggestions.push({
      look_name: 'Bold Contrast',
      look_description: 'High-contrast colors will brighten your complexion and draw attention to your features.',
      outfit_score: 72 + (skinBoostFactors.clarityScore / 2),
      color_palette: ['#000000', '#FFFFFF', '#DC143C', '#000080'],
      style_tags: ['bold', 'high-contrast', 'statement'],
      occasion: 'evening',
      season_recommendation: 'winter',
      skin_boost_factors: skinBoostFactors
    });
  }

  // Default suggestion for any occasion
  suggestions.push({
    look_name: 'Everyday Elegance',
    look_description: 'A versatile look that works for any occasion, designed to enhance your natural skin beauty.',
    outfit_score: 78,
    color_palette: recommendedColors.slice(0, 4),
    style_tags: occasionStyles[0]?.tags || ['versatile'],
    occasion: occasionStyles[0]?.occasion || 'casual',
    season_recommendation: 'all',
    skin_boost_factors: skinBoostFactors
  });

  // Save suggestions to database
  for (const suggestion of suggestions) {
    try {
      await db.query(
        `INSERT INTO outfit_skin_suggestions 
          (skin_analysis_id, look_name, look_description, outfit_score, 
           color_palette, style_tags, occasion, season_recommendation, skin_boost_factors)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          analysisId,
          suggestion.look_name,
          suggestion.look_description,
          suggestion.outfit_score,
          suggestion.color_palette,
          suggestion.style_tags,
          suggestion.occasion,
          suggestion.season_recommendation,
          JSON.stringify(suggestion.skin_boost_factors)
        ]
      );
    } catch (dbError) {
      logger.warn('[skinAnalysisWorker] Failed to save outfit suggestion:', dbError.message);
    }
  }

  return suggestions;
}

/**
 * Create a shopping journey for the user
 */
async function createShoppingJourney(userId, analysisId, parsedResults) {
  if (!userId) return null;

  try {
    const journeyId = uuidv4();
    
    // Define journey steps based on skin concerns
    const steps = [];
    
    // Step 1: View skin analysis
    steps.push({
      step: 1,
      title: 'Your Skin Profile',
      description: 'View your detailed skin analysis results',
      type: 'skin_results'
    });

    // Step 2: Skincare routine
    if (parsedResults.scores.acne || parsedResults.scores.moisture || parsedResults.scores.radiance) {
      steps.push({
        step: 2,
        title: 'Personalized Skincare',
        description: 'Get skincare products tailored to your skin needs',
        type: 'skincare_recommendations'
      });
    }

    // Step 3: Makeup suggestions
    if (parsedResults.skinColorHex) {
      steps.push({
        step: 3,
        title: 'Makeup Palette',
        description: 'Discover makeup shades that complement your skin',
        type: 'makeup_recommendations'
      });
    }

    // Step 4: Outfit suggestions
    steps.push({
      step: 4,
      title: 'Outfit Pairings',
      description: 'See clothing that enhances your skin glow',
      type: 'outfit_suggestions'
    });

    // Step 5: Complete
    steps.push({
      step: 5,
      title: 'Your Complete Look',
      description: 'View your full creative shopping journey',
      type: 'complete_look'
    });

    await db.query(
      `INSERT INTO skin_shopping_journeys 
        (id, user_id, skin_analysis_id, journey_type, current_step, total_steps, step_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        journeyId,
        userId,
        analysisId,
        'skin_health',
        1,
        steps.length,
        JSON.stringify({ steps, startedFrom: 'skin_analysis' })
      ]
    );

    return { id: journeyId, steps };

  } catch (dbError) {
    logger.warn('[skinAnalysisWorker] Failed to create shopping journey:', dbError.message);
    return null;
  }
}

// Create the worker
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    return await processSkinAnalysisJob(job);
  },
  {
    connection,
    concurrency: CONCURRENCY,
    limiter: {
      max: 10,
      duration: 1000 // 10 jobs per second max (respecting Perfect Corp rate limits)
    }
  }
);

// Event handlers
worker.on('completed', (job) => {
  logger.info(`[skinAnalysisWorker] Job ${job.id} completed`, {
    attempts: job.attemptsMade
  });
});

worker.on('failed', (job, err) => {
  logger.error(`[skinAnalysisWorker] Job ${job.id} failed`, {
    attempts: job.attemptsMade,
    error: err.message
  });
});

worker.on('error', (err) => {
  logger.error('[skinAnalysisWorker] Worker error:', err);
});

// Health check endpoint data
worker.getMetrics = () => ({
  ...metrics,
  avgDuration: metrics.processed > 0 
    ? Math.round(metrics.totalDuration / metrics.processed) 
    : 0
});

// Export for testing
module.exports = { 
  worker, 
  processSkinAnalysisJob,
  generateSkincareRecommendations,
  generateOutfitSuggestions,
  createShoppingJourney
};

// Start worker if run directly
if (require.main === module) {
  logger.info('[skinAnalysisWorker] Starting skin analysis worker...', {
    queue: QUEUE_NAME,
    concurrency: CONCURRENCY
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('[skinAnalysisWorker] Received SIGTERM, closing worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('[skinAnalysisWorker] Received SIGINT, closing worker...');
    await worker.close();
    process.exit(0);
  });
}

module.exports = { 
  worker, 
  processSkinAnalysisJob,
  generateSkincareRecommendations,
  generateOutfitSuggestions,
  createShoppingJourney
};