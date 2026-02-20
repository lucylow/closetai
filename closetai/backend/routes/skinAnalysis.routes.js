const express = require('express');
const router = express.Router();
const skinAnalysisController = require('../controllers/skinAnalysis.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/skin-analysis - Upload and start basic analysis (no auth required)
router.post('/', skinAnalysisController.startAnalysis);

// POST /api/skin-analysis/advanced - Upload and start advanced analysis (no auth required)
router.post('/advanced', skinAnalysisController.startAdvancedAnalysis);

// GET /api/skin-analysis/status/:taskId - Get analysis status/results (no auth required)
router.get('/status/:taskId', skinAnalysisController.getStatus);

// GET /api/skin-analysis/:id/details - Get detailed analysis with scores and visuals
router.get('/:id/details', skinAnalysisController.getAnalysisDetails);

// GET /api/skin-analysis/:id/skincare - Get skincare recommendations
router.get('/:id/skincare', skinAnalysisController.getSkincareRecommendations);

// GET /api/skin-analysis/:id/outfits - Get outfit suggestions
router.get('/:id/outfits', skinAnalysisController.getOutfitSuggestions);

// GET /api/skin-analysis/:id/journey - Get shopping journey
router.get('/:id/journey', authenticate, skinAnalysisController.getShoppingJourney);

// PATCH /api/skin-analysis/:id/journey - Update shopping journey
router.patch('/:id/journey', authenticate, skinAnalysisController.updateShoppingJourney);

// GET /api/skin-analysis/history - Get user's analysis history (requires auth)
router.get('/history', authenticate, skinAnalysisController.getHistory);

// DELETE /api/skin-analysis/:id - Delete analysis record (requires auth)
router.delete('/:id', authenticate, skinAnalysisController.deleteAnalysis);

module.exports = router;
