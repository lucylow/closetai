const openaiService = require('../services/openai.service');
const explanationService = require('../services/explanation.service');
const { User, WardrobeItem } = require('../models');
const youcomService = require('../services/youcom.service');

/**
 * POST /api/ai/explain-outfit
 * Generate AI explanation for why an outfit was recommended.
 * Accepts: { outfitId } for saved outfits, OR { outfit } with full outfit data for recommendations.
 */
exports.explainOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { outfitId, outfit } = req.body;

    let explanation;
    if (outfitId) {
      // Saved outfit - use explanation service
      explanation = await explanationService.generateExplanation(userId, outfitId);
      return res.json({
        userPreference: explanation,
        trendInsight: 'Based on current fashion trends.',
        trendSource: 'ClosetAI Trends',
        weatherOccasion: 'Matched to your selected occasion and weather.',
        explanation,
      });
    }

    // In-memory recommendation outfit - build explanation from outfit object
    const items = outfit?.items || [];
    const itemsDesc =
      items.length > 0
        ? items
            .map(
              (i) =>
                `${i.extractedAttributes?.color || 'unknown'} ${i.extractedAttributes?.category || 'item'}`
            )
            .join(', ')
        : 'selected pieces';

    const user = await User.findByPk(userId);
    const stylePrefs = user?.stylePreferences || {};
    const trendsData = await youcomService.searchFashionTrends();
    const trends = youcomService.extractTrends(trendsData);
    const trendName = trends.trends?.[0]?.name || trends.keywords?.[0] || 'current trends';

    const prompt = `
The user prefers colors: ${(stylePrefs.colors || []).join(', ') || 'any'} and styles: ${(stylePrefs.styles || []).join(', ') || 'any'}.
This outfit consists of: ${itemsDesc}.
Current fashion trends: ${trendName}.
Weather: ${(outfit?.weatherTags || []).join(', ') || 'mild'} and occasion: ${outfit?.occasion || 'casual'}.
Explain in 3 short sentences why this outfit is a good match. Format as: 1) Based on your style. 2) Trending now. 3) Weather & occasion.
    `.trim();

    if (!openaiService.openai) {
      return res.json({
        userPreference: `This outfit combines ${itemsDesc} to match your style preferences.`,
        trendInsight: `The ${trendName} trend influences this look.`,
        trendSource: 'ClosetAI Trends',
        weatherOccasion: `Perfect for ${outfit?.occasion || 'casual'} in ${(outfit?.weatherTags || ['mild']).join(', ')} conditions.`,
        explanation: `This outfit combines ${itemsDesc} for a ${outfit?.occasion || 'casual'} look. It aligns with ${trendName} and suits the conditions.`,
      });
    }

    try {
      const response = await openaiService.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });
      const content = response.data.choices[0].message.content.trim();
      const parts = content.split(/[.\n]/).filter((p) => p.trim());
      res.json({
        userPreference: parts[0]?.trim() || `This outfit matches your style with ${itemsDesc}.`,
        trendInsight: parts[1]?.trim() || `Trending: ${trendName}.`,
        trendSource: 'ClosetAI Trends',
        weatherOccasion: parts[2]?.trim() || `Great for ${outfit?.occasion || 'casual'}.`,
        explanation: content,
      });
    } catch (e) {
      res.json({
        userPreference: `This outfit combines ${itemsDesc} to match your preferences.`,
        trendInsight: `The ${trendName} trend influences this look.`,
        trendSource: 'ClosetAI Trends',
        weatherOccasion: `Perfect for ${outfit?.occasion || 'casual'}.`,
        explanation: `This outfit combines ${itemsDesc} for a ${outfit?.occasion || 'casual'} look.`,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/chat
 * Style Coach - natural language styling questions powered by GPT.
 */
exports.chatWithAI = async (req, res, next) => {
  try {
    const { message, userContext } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const stylePrefs = userContext?.stylePrefs || {};
    const wardrobe = userContext?.wardrobe || [];
    const wardrobeStr = wardrobe
      .slice(0, 30)
      .map((i) => (typeof i === 'object' ? i.name || i.extractedAttributes?.category : i))
      .filter(Boolean)
      .join(', ') || 'No items yet';

    const prompt = `
You are a friendly and knowledgeable fashion stylist.
The user's style preferences: ${JSON.stringify(stylePrefs)}.
Their wardrobe includes: ${wardrobeStr}.
Answer the following question in a helpful, concise way (2-4 sentences): "${message}"
    `.trim();

    if (!openaiService.openai) {
      return res.json({
        reply: "I'd love to help with styling! Based on your wardrobe, try mixing different pieces for variety. Consider the occasion and weather when putting together an outfit. Add your OPENAI_API_KEY for personalized AI advice.",
      });
    }

    const response = await openaiService.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    res.json({
      reply: response.data.choices[0].message.content.trim(),
    });
  } catch (err) {
    next(err);
  }
};
