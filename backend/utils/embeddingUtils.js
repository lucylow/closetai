/**
 * Embedding similarity utilities for wardrobe item matching.
 * Uses cosine similarity when embeddings are available.
 */

/**
 * Compute cosine similarity between two vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} Similarity in [0, 1] (1 = identical)
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  const sim = dot / denom;
  return Math.max(0, Math.min(1, (sim + 1) / 2));
}

/**
 * Find items most similar to a target embedding.
 * @param {Object[]} items - Array of { id, embedding, ... }
 * @param {number[]} targetEmbedding
 * @param {number} limit
 * @returns {Object[]} Items with similarity score, sorted descending
 */
function findSimilarItems(items, targetEmbedding, limit = 10) {
  if (!targetEmbedding || !Array.isArray(targetEmbedding)) {
    return [];
  }

  const withScores = items
    .filter((item) => item.embedding && Array.isArray(item.embedding))
    .map((item) => ({
      ...item.toJSON ? item.toJSON() : item,
      similarity: cosineSimilarity(item.embedding, targetEmbedding),
    }))
    .filter((item) => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return withScores;
}

module.exports = { cosineSimilarity, findSimilarItems };
