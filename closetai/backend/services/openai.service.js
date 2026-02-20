const env = require('../config/env');

class OpenAIService {
  constructor() {
    this.openai = null;
    if (env.openai?.apiKey) {
      try {
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({ apiKey: env.openai.apiKey });
        this.openai = new OpenAIApi(configuration);
      } catch (e) {
        this.openai = null;
      }
    }
  }

  buildCaptionPrompt(outfitDescription, tone, occasion) {
    const toneMap = {
      casual: 'keep it casual and friendly',
      funny: 'make it humorous and witty',
      inspirational: 'make it inspiring and uplifting',
      professional: 'keep it polished and professional',
    };
    const toneInstruction = toneMap[tone] || toneMap.casual;
    return `Write a social media caption for an outfit consisting of: ${outfitDescription}.
The occasion is ${occasion}. The tone should ${toneInstruction}.
Include relevant emojis and keep it under 220 characters.`;
  }

  async generateCaption(outfitDescription, tone = 'casual', occasion = 'casual') {
    if (!this.openai) {
      const items = outfitDescription || 'your outfit';
      return `✨ Today's #OOTD: ${items}. Loving the ${occasion} vibe! #AIstylist #ClosetAI #fashion`;
    }
    try {
      const prompt = this.buildCaptionPrompt(outfitDescription, tone, occasion);
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a creative social media assistant specializing in fashion.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.8,
      });
      return response.data.choices[0].message.content.trim();
    } catch (e) {
      return `✨ Styled by AI: ${outfitDescription}. #ClosetAI #fashion`;
    }
  }
}

module.exports = new OpenAIService();
