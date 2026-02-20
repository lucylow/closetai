const openaiService = require('./openai.service');

/**
 * GPT-powered trend summarizer for personalized style tips.
 */
class TrendSummarizerService {
  /**
   * Generate personalized style tips based on trends and user wardrobe.
   * @param {Object} trendsData - { trends, trendingColors, keywords }
   * @param {Array} userWardrobe - User's wardrobe items with extractedAttributes
   * @returns {Promise<string[]>} Array of style tip strings
   */
  async summarizeTrends(trendsData, userWardrobe = []) {
    if (!openaiService.openai) {
      return this._fallbackTips(trendsData, userWardrobe);
    }
    try {
      const trendsStr = JSON.stringify(trendsData.trends || trendsData.fallback || []);
      const wardrobeStr = userWardrobe
        .slice(0, 20)
        .map((i) => `${i.extractedAttributes?.category || 'item'} in ${i.extractedAttributes?.color || 'unknown'}`)
        .join(', ') || 'No items yet';

      const prompt = `
Based on the following fashion trend data:
${trendsStr}

And the user's wardrobe (categories and colors):
${wardrobeStr}

Write 3 personalized style tips. Each tip should be one sentence, friendly, and include specific suggestions.
Format: one tip per line, no numbering.
      `.trim();

      const response = await openaiService.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      const content = response.data.choices[0].message.content;
      return content
        .split('\n')
        .map((l) => l.replace(/^\d+\.\s*/, '').trim())
        .filter((l) => l.length > 0)
        .slice(0, 3);
    } catch (e) {
      return this._fallbackTips(trendsData, userWardrobe);
    }
  }

  _fallbackTips(trendsData, userWardrobe) {
    const colors = trendsData.trendingColors || ['navy', 'sage', 'cream'];
    const tips = [
      `Try pairing your wardrobe staples with ${colors[0]} accents for a fresh look.`,
      `Layering is key this season—mix textures for depth and interest.`,
      `Your existing pieces can be styled to match current trends with small tweaks.`,
    ];
    return tips;
  }
}

module.exports = new TrendSummarizerService();
