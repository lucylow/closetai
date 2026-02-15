const fashionResearchService = require('../services/fashionResearch.service');

const getUserTrendReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { occasion } = req.query;
    const report = await fashionResearchService.researchUserFashion(userId, occasion);
    res.json(report);
  } catch (err) {
    next(err);
  }
};

const getTrendAwareOutfits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;
    const outfits = await fashionResearchService.getTrendAwareOutfits(
      userId,
      limit ? parseInt(limit, 10) : 5
    );
    res.json(outfits);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserTrendReport, getTrendAwareOutfits };
