/**
 * Credits Module - Credit Management & Cost Estimation
 * 
 * Provides functionality for:
 * - Estimating credit costs for different job types
 * - Atomic credit reservation and deduction
 * - Per-tenant credit tracking
 * - Cost breakdown for UX display
 * 
 * Environment variables:
 * - DB_POOL: PostgreSQL connection pool
 * - REDIS_HOST: Redis for caching credit info
 * 
 * @module credits
 */

import { Pool } from 'pg';
import { getRedisClient } from './redisClient';

// ============================================================================
// Types
// ============================================================================

/**
 * Credit costs configuration
 */
export interface CreditCostConfig {
  baseCost: number;
  breakdown: string[];
  perExtraOption?: Record<string, number>;
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  tenantId?: string;
  amount: number;
  type: 'reserve' | 'deduct' | 'refund' | 'purchase' | 'bonus';
  jobId?: string;
  description: string;
  createdAt: Date;
}

/**
 * User credit balance
 */
export interface CreditBalance {
  userId: string;
  tenantId?: string;
  available: number;
  reserved: number;
  spent: number;
  totalPurchased: number;
}

/**
 * Cost estimate result
 */
export interface CostEstimate {
  credits: number;
  breakdown: string[];
  jobType: string;
  params: Record<string, unknown>;
  estimatedDuration?: number;
}

// ============================================================================
// Credit Cost Configuration
// ============================================================================

/**
 * Credit costs for different job types
 * These can be overridden per-tenant in the database
 */
export const CREDIT_COSTS: Record<string, CreditCostConfig> = {
  skin_analysis: {
    baseCost: 5,
    breakdown: ['Base analysis: 5 credits'],
  },
  hair_color: {
    baseCost: 8,
    breakdown: ['Color application: 8 credits'],
    perExtraOption: {
      highQuality: 2,
      multipleColors: 3,
    },
  },
  hair_style: {
    baseCost: 10,
    breakdown: ['Style application: 10 credits'],
  },
  makeup_tryon: {
    baseCost: 12,
    breakdown: ['Makeup try-on: 12 credits'],
    perExtraOption: {
      highQuality: 2,
      multipleProducts: 3,
    },
  },
  jewelry_tryon: {
    baseCost: 8,
    breakdown: ['Jewelry try-on: 8 credits'],
  },
  accessories_tryon: {
    baseCost: 6,
    breakdown: ['Accessories try-on: 6 credits'],
  },
  text_to_image: {
    baseCost: 15,
    breakdown: ['Text-to-image generation: 15 credits'],
    perExtraOption: {
      highResolution: 5,
      multipleImages: 10,
    },
  },
  image_edit: {
    baseCost: 10,
    breakdown: ['Image editing: 10 credits'],
  },
  aging: {
    baseCost: 8,
    breakdown: ['Aging simulation: 8 credits'],
  },
  thumbnail_generation: {
    baseCost: 1,
    breakdown: ['Thumbnail generation: 1 credit'],
  },
  export: {
    baseCost: 2,
    breakdown: ['HD export: 2 credits'],
    perExtraOption: {
      veryHighResolution: 3,
    },
  },
};

// ============================================================================
// Credit Estimation
// ============================================================================

/**
 * Estimate credit cost for a job
 * 
 * @param jobType - Type of job to estimate
 * @param params - Additional parameters that may affect cost
 * @returns Cost estimate with breakdown
 * 
 * @example
 * const estimate = estimateCost('hair_color', { highQuality: true });
 * // Returns: { credits: 10, breakdown: ['Color application: 8 credits', 'High quality: +2 credits'] }
 */
export function estimateCost(
  jobType: string,
  params?: Record<string, unknown>
): CostEstimate {
  const config = CREDIT_COSTS[jobType];
  
  if (!config) {
    console.warn(`[Credits] Unknown job type: ${jobType}, using default cost`);
    return {
      credits: 5,
      breakdown: [`Default cost: 5 credits`],
      jobType,
      params: params || {},
    };
  }

  const breakdown = [...config.breakdown];
  let credits = config.baseCost;

  // Apply extra options
  if (config.perExtraOption && params) {
    for (const [option, cost] of Object.entries(config.perExtraOption)) {
      if (params[option]) {
        credits += cost;
        breakdown.push(`${formatOptionName(option)}: +${cost} credits`);
      }
    }
  }

  // Estimate duration based on complexity
  const estimatedDuration = getEstimatedDuration(jobType, params);

  return {
    credits,
    breakdown,
    jobType,
    params: params || {},
    estimatedDuration,
  };
}

/**
 * Format option name for display
 */
function formatOptionName(option: string): string {
  return option
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Estimate job duration in seconds
 */
function getEstimatedDuration(jobType: string, params?: Record<string, unknown>): number {
  const baseDurations: Record<string, number> = {
    skin_analysis: 15,
    hair_color: 20,
    hair_style: 25,
    makeup_tryon: 20,
    jewelry_tryon: 15,
    accessories_tryon: 15,
    text_to_image: 30,
    image_edit: 20,
    aging: 20,
    thumbnail_generation: 5,
    export: 10,
  };

  let duration = baseDurations[jobType] || 15;

  // Add time for high quality or multiple images
  if (params?.highQuality) duration += 10;
  if (params?.numImages) duration += (params.numImages as number) * 5;

  return duration;
}

/**
 * Get all available job types with their costs
 */
export function getAvailableJobTypes(): Array<{ type: string; cost: number; description: string }> {
  return Object.entries(CREDIT_COSTS).map(([type, config]) => ({
    type,
    cost: config.baseCost,
    description: config.breakdown[0],
  }));
}

// ============================================================================
// Credit Database Operations
// ============================================================================

// PostgreSQL pool