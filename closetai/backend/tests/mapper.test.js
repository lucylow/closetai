/**
 * Mapper Tests
 */
const { normalizeKeypoints, computeScaleAndRotationForGarment, computeShoePlacement, occlusionMaskingRules } = require('../src/integrations/perfectcorp-artryon/mapper');

describe('mapper', () => {
  test('normalizeKeypoints', () => {
    const raw = [{ name: 'nose', x: 100, y: 50, confidence: 0.9 }];
    const result = normalizeKeypoints(raw);
    expect(result[0].name).toBe('nose');
    expect(result[0].x).toBe(100);
  });

  test('computeScaleAndRotationForGarment', () => {
    const userBbox = { x: 0, y: 0, w: 200, h: 400 };
    const garmentBbox = { x: 0, y: 0, w: 100, h: 200 };
    const result = computeScaleAndRotationForGarment(userBbox, garmentBbox);
    expect(result.scale).toBe(2);
  });

  test('occlusionMaskingRules - face in front', () => {
    const garmentBbox = { x: 50, y: 50, w: 100, h: 100 };
    const faceBbox = { x: 80, y: 60, w: 40, h: 50 };
    const result = occlusionMaskingRules(garmentBbox, faceBbox);
    expect(result).toBe('occluded');
  });

  test('occlusionMaskingRules - no intersection', () => {
    const garmentBbox = { x: 50, y: 200, w: 100, h: 100 };
    const faceBbox = { x: 80, y: 60, w: 40, h: 50 };
    const result = occlusionMaskingRules(garmentBbox, faceBbox);
    expect(result).toBe('above');
  });
});
