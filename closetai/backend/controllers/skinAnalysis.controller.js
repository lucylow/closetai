/**
 * Skin Analysis Controller
 * 
 * Handles Perfect Corp YCE API integration for skin analysis
 * Flow: Upload image -> Create task -> Poll for results -> Map to palette
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const formidable = require('formidable');
const logger = require('../utils/logger');
const db = require('../lib/db');
const skinAnalysisService = require('../services/skinAnalysis.service');
const { mapSkinToneToPalette, getHexFromToneName } = require('../utils/skinColorMap');

// Analysis actions supported by Perfect Corp YCE API
const ANALYSIS_ACTIONS = ['skin_type', 'face_tone', 'redness', 'oiliness', 'texture'];

// Advanced analysis actions for detailed skin analysis
const ADVANCED_ACTIONS = ['wrinkle', 'pore', 'texture', 'acne', 'oiliness', 'radiance', 'moisture', 'redness'];

/**
 * Start skin analysis - Upload image and create task
 * POST /api/skin-analysis
 */
exports.startAnalysis = async (req, res) => {
  try {
    // Check for API key
    const apiKey = process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY;
    const useMock = !apiKey;
    
    if (useMock) {
      logger.warn('Perfect Corp API key not configured - using mock analysis');
      return handleMockAnalysis(req, res);
    }
    
    // Parse multipart form data
    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: (part) => {
        return part.mimetype?.startsWith('image/') || false;
      }
    });
    
    const [fields, files] = await form.parse(req);
    const selfie = files.selfie?.[0];
    
    if (!selfie) {
      return res.status(400).json({ error: 'No selfie image provided' });
    }
    
    // Read image file
    const imageBuffer = fs.readFileSync(selfie.filepath);
    const fileName = `${uuidv4()}_${selfie.originalFilename || 'selfie.jpg'}`;
    const contentType = selfie.mimetype || 'image/jpeg';
    const fileSize = imageBuffer.length;
    
    logger.info(`Starting skin analysis for file: ${fileName}, size: ${fileSize}`);
    
    // Step 1: Get presigned URL from Perfect Corp
    const { fileId, uploadUrl, uploadHeaders } = await skinAnalysisService.initSkinAnalysisFileUpload(
      fileName,
      fileSize,
      contentType
    );
    
    // Step 2: Upload image to presigned URL
    await skinAnalysisService.uploadToPresignedUrl(imageBuffer, uploadUrl, uploadHeaders);
    logger.info(`Image uploaded successfully, fileId: ${fileId}`);
    
    // Step 3: Create skin analysis task
    const { taskId, status: taskStatus } = await skinAnalysisService.createSkinAnalysisTask(
      fileId,
      ANALYSIS_ACTIONS
    );
    
    logger.info(`Skin analysis task created: ${taskId}, status: ${taskStatus}`);
    
    // Step 4: Store task in database (if user is authenticated)
    const userId = req.user?.id || null;
    if (userId) {
      await db.query(
        `INSERT INTO skin_analysis 
          (user_id, perfect_corp_file_id, perfect_corp_task_id, status, image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userId, fileId, taskId, 'processing', `/uploads/${fileName}`]
      );
    }
    
    // Return task ID for polling
    res.json({ 
      taskId,
      fileId,
      status: taskStatus,
      message: 'Image uploaded successfully. Processing may take a few seconds.'
    });
    
  } catch (error) {
    logger.error('Skin analysis error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to start skin analysis',
      code: error.code || 'ANALYSIS_ERROR'
    });
  }
};

/**
 * Get analysis status and results
 * GET /api/skin-analysis/status/:taskId
 */
exports.getStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const apiKey = process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY;
    const useMock = !apiKey;
    
    // Check database first
    const dbResult = await db.query(
      `SELECT * FROM skin_analysis WHERE perfect_corp_task_id = $1`,
      [taskId]
    );
    
    const existingTask = dbResult.rows?.[0];
    
    if (useMock) {
      return handleMockStatus(req, res, taskId);
    }
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // If already completed in DB, return cached results
    if (existingTask.status === 'completed') {
      return res.json({
        status: 'completed',
        skin_color_hex: existingTask.skin_color_hex,
        undertone: existingTask.undertone,
        skin_type: existingTask.skin_type,
        palette: existingTask.recommended_palette,
        analysis_data: existingTask.analysis_data
      });
    }
    
    // If errored, return error
    if (existingTask.status === 'error') {
      return res.json({
        status: 'error',
        message: existingTask.error_message
      });
    }
    
    // Poll Perfect Corp for status
    const pcStatus = await skinAnalysisService.checkSkinAnalysisStatus(taskId);
    
    // If completed, update DB and return results
    if (pcStatus.status === 'success' || pcStatus.status === 'completed') {
      const parsed = skinAnalysisService.parseAnalysisResults(pcStatus.results);
      
      // Generate palette based on skin color
      const skinColor = parsed.skinColorHex || getHexFromToneName(parsed.skinType);
      const paletteResult = mapSkinToneToPalette(skinColor);
      
      // Update database
      await db.query(
        `UPDATE skin_analysis 
         SET status = 'completed',
             skin_color_hex = $1,
             undertone = $2,
             skin_type = $3,
             analysis_data = $4,
             recommended_palette = $5,
             updated_at = NOW()
         WHERE perfect_corp_task_id = $6`,
        [
          skinColor,
          parsed.undertone,
          parsed.skinType,
          JSON.stringify(parsed.analysisData),
          JSON.stringify(paletteResult.palette),
          taskId
        ]
      );
      
      return res.json({
        status: 'completed',
        skin_color_hex: skinColor,
        undertone: parsed.undertone,
        skin_type: parsed.skinType,
        palette: paletteResult.palette,
        season: paletteResult.season,
        description: paletteResult.description,
        analysis_data: parsed.analysisData
      });
    }
    
    // Still processing
    if (pcStatus.status === 'running' || pcStatus.status === 'pending') {
      return res.json({
        status: 'processing',
        message: 'Analysis in progress...'
      });
    }
    
    // Error status
    await db.query(
      `UPDATE skin_analysis SET status = 'error', error_message = $1 WHERE perfect_corp_task_id = $2`,
      [pcStatus.message || 'Analysis failed', taskId]
    );
    
    return res.json({
      status: 'error',
      message: pcStatus.message || 'Analysis failed'
    });
    
  } catch (error) {
    logger.error('Get skin analysis status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get status' });
  }
};

/**
 * Get user's skin analysis history
 * GET /api/skin-analysis/history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await db.query(
      `SELECT id, skin_color_hex, undertone, skin_type, recommended_palette, created_at
       FROM skin_analysis 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
};

/**
 * Delete skin analysis record
 * DELETE /api/skin-analysis/:id
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await db.query(
      `DELETE FROM skin_analysis WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};

/**
 * Start advanced skin analysis with detailed scoring
 * POST /api/skin-analysis/advanced
 */
exports.startAdvancedAnalysis = async (req, res) => {
  try {
    const apiKey = process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY;
    const useMock = !apiKey;
    
    if (useMock) {
      return handleMockAdvancedAnalysis(req, res);
    }
    
    // Parse multipart form data
    const form = formidable({
      multiples: false,
      maxFileSize: 10 * 1024 * 1024,
      filter: (part) => part.mimetype?.startsWith('image/') || false
    });
    
    const [fields, files] = await form.parse(req);
    const selfie = files.selfie?.[0];
    
    if (!selfie) {
      return res.status(400).json({ error: 'No selfie image provided' });
    }
    
    const imageBuffer = fs.readFileSync(selfie.filepath);
    const fileName = `${uuidv4()}_${selfie.originalFilename || 'selfie.jpg'}`;
    const contentType = selfie.mimetype || 'image/jpeg';
    const fileSize = imageBuffer.length;
    
    // Get advanced analysis actions from body or use default
    const actions = req.body.actions ? JSON.parse(req.body.actions) : ADVANCED_ACTIONS;
    
    logger.info(`Starting advanced skin analysis for: ${fileName}`);
    
    // Step 1: Get presigned URL
    const { fileId, uploadUrl, uploadHeaders, pollingInterval } = 
      await skinAnalysisService.initSkinAnalysisFileUpload(fileName, fileSize, contentType);
    
    // Step 2: Upload image
    await skinAnalysisService.uploadToPresignedUrl(imageBuffer, uploadUrl, uploadHeaders);
    
    // Step 3: Create analysis task with advanced actions
    const { taskId, status: taskStatus } = await skinAnalysisService.createSkinAnalysisTask(
      fileId,
      actions
    );
    
    // Step 4: Store in database
    const userId = req.user?.id || null;
    const tenantId = req.user?.tenantId || null;
    const analysisId = uuidv4();
    
    if (userId) {
      await db.query(
        `INSERT INTO skin_analysis 
          (id, user_id, perfect_corp_file_id, perfect_corp_task_id, status, 
           image_url, polling_interval, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [analysisId, userId, fileId, taskId, 'processing', `/uploads/${fileName}`, pollingInterval, tenantId]
      );
    }
    
    res.json({
      taskId,
      fileId,
      analysisId,
      status: taskStatus,
      pollingInterval,
      message: 'Advanced skin analysis started. Use /status/:taskId to poll for results.'
    });
    
  } catch (error) {
    logger.error('Advanced skin analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to start advanced analysis' });
  }
};

/**
 * Get detailed analysis results with scores and visuals
 * GET /api/skin-analysis/:id/details
 */
exports.getAnalysisDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get analysis from database
    const result = await db.query(
      `SELECT * FROM skin_analysis WHERE id = $1`,
      [id]
    );
    
    const analysis = result.rows[0];
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Get visual overlays
    const visualsResult = await db.query(
      `SELECT * FROM skin_analysis_visuals WHERE skin_analysis_id = $1`,
      [id]
    );
    
    // Get skincare recommendations
    const skincareResult = await db.query(
      `SELECT * FROM skincare_recommendations WHERE skin_analysis_id = $1 ORDER BY routine_order`,
      [id]
    );
    
    // Get outfit suggestions
    const outfitResult = await db.query(
      `SELECT * FROM outfit_skin_suggestions WHERE skin_analysis_id = $1 ORDER BY outfit_score DESC`,
      [id]
    );
    
    res.json({
      id: analysis.id,
      status: analysis.status,
      created_at: analysis.created_at,
      skin_color_hex: analysis.skin_color_hex,
      undertone: analysis.undertone,
      skin_type: analysis.skin_type,
      skin_age: analysis.skin_age,
      overall_score: analysis.overall_score,
      scores: {
        acne: analysis.acne_score,
        pore: analysis.pore_score,
        wrinkle: analysis.wrinkle_score,
        texture: analysis.texture_score,
        oiliness: analysis.oiliness_score,
        radiance: analysis.radiance_score,
        moisture: analysis.moisture_score,
        redness: analysis.redness_score
      },
      visuals: visualsResult.rows,
      skincare_recommendations: skincareResult.rows,
      outfit_suggestions: outfitResult.rows,
      analysis_data: analysis.analysis_data
    });
    
  } catch (error) {
    logger.error('Get analysis details error:', error);
    res.status(500).json({ error: 'Failed to get analysis details' });
  }
};

/**
 * Get skincare recommendations for an analysis
 * GET /api/skin-analysis/:id/skincare
 */
exports.getSkincareRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { routine } = req.query; // 'morning' or 'evening'
    
    let query = `SELECT * FROM skincare_recommendations WHERE skin_analysis_id = $1`;
    const params = [id];
    
    if (routine) {
      query += ` AND is_morning_routine = $2`;
      params.push(routine === 'morning');
    }
    
    query += ` ORDER BY routine_order`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
    
  } catch (error) {
    logger.error('Get skincare recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

/**
 * Get outfit suggestions for an analysis
 * GET /api/skin-analysis/:id/outfits
 */
exports.getOutfitSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { occasion, season } = req.query;
    
    let query = `SELECT * FROM outfit_skin_suggestions WHERE skin_analysis_id = $1`;
    const params = [id];
    
    if (occasion) {
      query += ` AND occasion = $2`;
      params.push(occasion);
    }
    
    if (season) {
      query += params.length === 2 ? ` AND season_recommendation = $3` : ` AND season_recommendation = $2`;
      params.push(season);
    }
    
    query += ` ORDER BY outfit_score DESC`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
    
  } catch (error) {
    logger.error('Get outfit suggestions error:', error);
    res.status(500).json({ error: 'Failed to get outfit suggestions' });
  }
};

/**
 * Get or create shopping journey
 * GET /api/skin-analysis/:id/journey
 */
exports.getShoppingJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Check if journey exists
    let result = await db.query(
      `SELECT * FROM skin_shopping_journeys 
       WHERE skin_analysis_id = $1 AND user_id = $2 
       ORDER BY started_at DESC LIMIT 1`,
      [id, userId]
    );
    
    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }
    
    // Create new journey
    const journeyId = uuidv4();
    const stepData = {
      steps: [
        { step: 1, title: 'Your Skin Profile', completed: true },
        { step: 2, title: 'Personalized Skincare', completed: false },
        { step: 3, title: 'Makeup Palette', completed: false },
        { step: 4, title: 'Outfit Pairings', completed: false },
        { step: 5, title: 'Your Complete Look', completed: false }
      ]
    };
    
    await db.query(
      `INSERT INTO skin_shopping_journeys 
        (id, user_id, skin_analysis_id, journey_type, current_step, total_steps, step_data)
       VALUES ($1, $2, $3, 'skin_health', 1, 5, $4)`,
      [journeyId, userId, id, JSON.stringify(stepData)]
    );
    
    res.json({
      id: journeyId,
      skin_analysis_id: id,
      journey_type: 'skin_health',
      current_step: 1,
      total_steps: 5,
      step_data: stepData
    });
    
  } catch (error) {
    logger.error('Get shopping journey error:', error);
    res.status(500).json({ error: 'Failed to get shopping journey' });
  }
};

/**
 * Update shopping journey step
 * PATCH /api/skin-analysis/:id/journey
 */
exports.updateShoppingJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_step, completed_steps } = req.body;
    const userId = req.user?.id;
    
    const updates = [];
    const params = [id, userId];
    let paramIndex = 3;
    
    if (current_step !== undefined) {
      updates.push(`current_step = ${paramIndex++}`);
      params.push(current_step);
    }
    
    if (completed_steps !== undefined) {
      updates.push(`completed_steps = ${paramIndex++}`);
      params.push(completed_steps);
    }
    
    if (current_step >= 5) {
      updates.push(`is_completed = true, completed_at = NOW()`);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    const query = `UPDATE skin_shopping_journeys SET ${updates.join(', ')} 
                   WHERE skin_analysis_id = $1 AND user_id = $2 RETURNING *`;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    logger.error('Update shopping journey error:', error);
    res.status(500).json({ error: 'Failed to update journey' });
  }
};

// ============== Mock Handlers for Development ==============

async function handleMockAnalysis(req, res) {
  const taskId = `mock_task_${Date.now()}`;
  
  // Simulate processing delay
  setTimeout(async () => {
    // Store mock result
    const mockResult = {
      skin_color_hex: '#E7C8B0',
      undertone: 'warm',
      skin_type: 'normal',
      palette: ['#C87F3D', '#E3A857', '#F2C46C', '#D4A373', '#FAEDCD']
    };
    
    // Update in-memory store for polling
    mockTasks.set(taskId, {
      status: 'completed',
      ...mockResult
    });
  }, 5000);
  
  res.json({
    taskId,
    status: 'processing',
    message: 'Mock analysis started (no API key configured)'
  });
}

async function handleMockStatus(req, res, taskId) {
  const task = mockTasks.get(taskId);
  
  if (!task) {
    // Create new mock result if not exists
    const mockResult = {
      status: 'completed',
      skin_color_hex: '#E7C8B0',
      undertone: 'warm',
      skin_type: 'normal',
      palette: ['#C87F3D', '#E3A857', '#F2C46C', '#D4A373', '#FAEDCD']
    };
    mockTasks.set(taskId, mockResult);
    return res.json(mockResult);
  }
  
  res.json(task);
}

// In-memory store for mock tasks (development only)
const mockTasks = new Map();
