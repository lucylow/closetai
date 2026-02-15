/**
 * Thompson Sampling multi-armed bandit for outfit exploration.
 * Balances exploitation (showing known-good outfits) with exploration (trying new combinations).
 */
class BanditService {
  constructor() {
    this.alpha = 1; // prior successes
    this.beta = 1; // prior failures
    // In production, store per-outfit params in Redis/DB. For demo, use in-memory.
    this.outfitParams = new Map(); // outfitId -> { alpha, beta }
  }

  /**
   * Get or create params for an outfit.
   */
  _getParams(outfitId) {
    if (!this.outfitParams.has(outfitId)) {
      this.outfitParams.set(outfitId, { alpha: this.alpha, beta: this.beta });
    }
    return this.outfitParams.get(outfitId);
  }

  /**
   * Update beta distribution for a given outfit combination.
   * @param {string} outfitId - Outfit identifier
   * @param {number} reward - 1 for like/wear, 0 for dislike
   */
  update(outfitId, reward) {
    const params = this._getParams(outfitId);
    if (reward >= 0.5) {
      params.alpha += 1;
    } else {
      params.beta += 1;
    }
  }

  /**
   * Sample from beta distribution to get probability of being best.
   * Uses Thompson sampling: approximate Beta(alpha, beta) sample.
   */
  sample(outfitId) {
    const params = this._getParams(outfitId);
    const { alpha, beta } = params;
    // Mean of Beta(alpha, beta) is alpha/(alpha+beta). Add noise for exploration.
    const mean = alpha / (alpha + beta);
    const noise = (Math.random() - 0.5) * 0.4;
    return Math.max(0.01, Math.min(0.99, mean + noise));
  }

  /**
   * Select outfit using Thompson sampling (pick the one with highest sampled value).
   */
  selectOutfit(candidates) {
    if (!candidates?.length) return null;
    const samples = candidates.map((o) => ({ outfit: o, sample: this.sample(o.id) }));
    const best = samples.reduce((a, b) => (a.sample > b.sample ? a : b));
    return best.outfit;
  }
}

module.exports = new BanditService();
