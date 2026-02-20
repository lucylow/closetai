/**
 * Creative Shopping Journey Routes
 * REST API endpoints for recommendations and try-on functionality
 */
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { creativeService } from '../services/creativeService';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/generate',
  [body('seedItemIds').optional().isArray()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, seedItemIds, context, options } = req.body;
      const requestId = req.headers['x-request-id'] as string;
      const result = await creativeService.generateRecommendations({
        userId, seedItemIds: seedItemIds || [], context: context || {}, options: options || {}, requestId
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
);

router.post('/tryon',
  [body('consent').isBoolean()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, baseImageUrl, recommendationId, transforms, consent } = req.body;
      if (!consent) {
        return res.status(400).json({ error: 'Consent required' });
      }
      const requestId = req.headers['x-request-id'] as string;
      const result = await creativeService.createTryOnTask({
        userId, baseImageUrl, recommendationId, transforms: transforms || {}, consent, requestId
      });
      res.status(202).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create try-on task' });
    }
  }
);

router.get('/tryon/:taskId',
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const result = await creativeService.getTryOnResult(taskId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get try-on result' });
    }
  }
);

router.post('/save',
  [body('userId').isString(), body('recommendationId').isString()],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { userId, recommendationId, title, notes } = req.body;
      const result = await creativeService.saveRecommendation({ userId, recommendationId, title, notes });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save recommendation' });
    }
  }
);

router.get('/seed-items', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const items = await creativeService.getSeedItems(userId as string);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get seed items' });
  }
});

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { query: trendQuery } = req.query;
    const trends = await creativeService.getTrends(trendQuery as string);
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

export const creativeRouter = router;