/**
 * Collaborative Filtering Service
 * Matrix factorization on user-outfit ratings using pure JavaScript.
 * No native dependencies - works on all platforms.
 */
const { Rating } = require('../models');

class CollaborativeFilteringService {
  constructor() {
    this.userMap = new Map();
    this.outfitMap = new Map();
    this.reverseUserMap = [];
    this.reverseOutfitMap = [];
    this.userEmbeddings = null;
    this.outfitEmbeddings = null;
    this.trained = false;
  }

  /**
   * Build user-outfit rating matrix from DB.
   */
  async buildMatrix() {
    const ratings = await Rating.findAll({
      attributes: ['userId', 'outfitId', 'rating'],
    });

    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const outfitIds = [...new Set(ratings.map((r) => r.outfitId))];
    userIds.forEach((id, idx) => {
      this.userMap.set(id, idx);
      this.reverseUserMap[idx] = id;
    });
    outfitIds.forEach((id, idx) => {
      this.outfitMap.set(id, idx);
      this.reverseOutfitMap[idx] = id;
    });

    return ratings.map((r) => ({
      userIdx: this.userMap.get(r.userId),
      outfitIdx: this.outfitMap.get(r.outfitId),
      rating: r.rating / 5,
    }));
  }

  /**
   * Train matrix factorization using stochastic gradient descent.
   * Factorizes R ≈ U * V^T where U is user embeddings, V is outfit embeddings.
   */
  async train(latentFactors = 10, epochs = 50, learningRate = 0.01, reg = 0.01) {
    const entries = await this.buildMatrix();
    if (entries.length < 5) {
      this.trained = false;
      return;
    }

    const numUsers = this.userMap.size;
    const numOutfits = this.outfitMap.size;
    if (numUsers < 2 || numOutfits < 2) {
      this.trained = false;
      return;
    }

    // Initialize embeddings randomly
    const init = () => (Math.random() - 0.5) * 0.1;
    this.userEmbeddings = Array.from({ length: numUsers }, () =>
      Array.from({ length: latentFactors }, init)
    );
    this.outfitEmbeddings = Array.from({ length: numOutfits }, () =>
      Array.from({ length: latentFactors }, init)
    );

    // SGD
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      for (const { userIdx, outfitIdx, rating } of entries) {
        const pred = this._dot(
          this.userEmbeddings[userIdx],
          this.outfitEmbeddings[outfitIdx]
        );
        const err = rating - pred;
        totalError += err * err;

        for (let f = 0; f < latentFactors; f++) {
          const uf = this.userEmbeddings[userIdx][f];
          const of = this.outfitEmbeddings[outfitIdx][f];
          this.userEmbeddings[userIdx][f] += learningRate * (err * of - reg * uf);
          this.outfitEmbeddings[outfitIdx][f] += learningRate * (err * uf - reg * of);
        }
      }
      if (epoch % 10 === 0 && totalError < 0.01) break;
    }

    this.trained = true;
  }

  _dot(a, b) {
    return a.reduce((s, v, i) => s + v * b[i], 0);
  }

  _sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x))));
  }

  /**
   * Predict rating for user-outfit pair (0-1 normalized).
   */
  async predictRating(userId, outfitId) {
    if (!this.trained) {
      const entries = await this.buildMatrix();
      if (entries.length >= 5) await this.train();
      else return 0.5;
    }

    const userIdx = this.userMap.get(userId);
    const outfitIdx = this.outfitMap.get(outfitId);
    if (userIdx === undefined || outfitIdx === undefined) return 0.5;

    const raw = this._dot(
      this.userEmbeddings[userIdx],
      this.outfitEmbeddings[outfitIdx]
    );
    return this._sigmoid(raw);
  }

  /**
   * Get top N outfit recommendations for a user (from rated outfits in DB).
   */
  async recommendForUser(userId, limit = 10) {
    if (!this.trained) {
      const entries = await this.buildMatrix();
      if (entries.length >= 5) await this.train();
      else return [];
    }

    const userIdx = this.userMap.get(userId);
    if (userIdx === undefined) return [];

    const scores = this.reverseOutfitMap.map((outfitId, idx) => ({
      outfitId,
      score: this._sigmoid(
        this._dot(this.userEmbeddings[userIdx], this.outfitEmbeddings[idx])
      ),
    }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }

  /**
   * Batch predict ratings for multiple user-outfit pairs.
   */
  async predictBatch(pairs) {
    const scores = await Promise.all(
      pairs.map(({ userId, outfitId }) => this.predictRating(userId, outfitId))
    );
    return scores;
  }
}

module.exports = new CollaborativeFilteringService();
