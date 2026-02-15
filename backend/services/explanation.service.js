const openaiService = require('./openai.service');
const { User, WardrobeItem, Outfit } = require('../models');

class ExplanationService {
  async generateExplanation(userId, outfitId) {
    const outfit = await Outfit.findOne({ where: { id: outfitId, userId } });
    if (!outfit) throw new Error('Outfit not found');

    const itemIds = outfit.items || [];
    const clothingItems = itemIds.length
      ? await WardrobeItem.findAll({ where: { id: itemIds, userId } })
      : [];

    const user = await User.findByPk(userId);
    const stylePrefs = user?.stylePreferences || {};

    const itemsDesc =
      clothingItems.length > 0
        ? clothingItems
            .map(
              (i) =>
                `${i.extractedAttributes?.color || 'unknown'} ${i.extractedAttributes?.category || 'item'} (${i.extractedAttributes?.style || 'styled'})`
            )
            .join(', ')
        : 'selected pieces';

    const prompt = `
      The user prefers colors: ${stylePrefs.colors?.join(', ') || 'any'} and styles: ${stylePrefs.styles?.join(', ') || 'any'}.
      This outfit consists of: ${itemsDesc}.
      The occasion is ${outfit.occasion || 'casual'}, and the weather is ${(outfit.weatherTags || []).join(', ') || 'mild'}.
      Explain in 2-3 short sentences why this outfit is a good match for the user.
    `;

    if (!openaiService.openai) {
      return `This outfit combines ${itemsDesc} for a ${outfit.occasion || 'casual'} look. The pieces work well together for the occasion and conditions.`;
    }

    try {
      const response = await openaiService.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      });
      return response.data.choices[0].message.content.trim();
    } catch (e) {
      return `This outfit combines ${itemsDesc} for a ${outfit.occasion || 'casual'} look. The pieces complement each other well.`;
    }
  }
}

module.exports = new ExplanationService();
