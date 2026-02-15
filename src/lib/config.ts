/**
 * ClosetAI Feature & Plan Configuration
 * Supports freemium model and scalable startup architecture.
 * Aligns with $3.5B styling app market and VC-backed competitors (Alta, BNTO, Stylitics).
 */

export type PlanTier = "free" | "premium" | "enterprise";

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    wardrobeItems: number;
    outfitGenerationsPerDay: number;
    virtualTryOnsPerMonth: number;
    aiCaptionsPerDay: number;
    trendReportsPerWeek: number;
    hasAdvancedStyling: boolean;
    hasAffiliateLinks: boolean;
    hasPriorityProcessing: boolean;
  }
> = {
  free: {
    wardrobeItems: 25,
    outfitGenerationsPerDay: 5,
    virtualTryOnsPerMonth: 3,
    aiCaptionsPerDay: 10,
    trendReportsPerWeek: 2,
    hasAdvancedStyling: false,
    hasAffiliateLinks: true, // Monetization: affiliate revenue on free tier
    hasPriorityProcessing: false,
  },
  premium: {
    wardrobeItems: 500,
    outfitGenerationsPerDay: 50,
    virtualTryOnsPerMonth: 50,
    aiCaptionsPerDay: 100,
    trendReportsPerWeek: 20,
    hasAdvancedStyling: true,
    hasAffiliateLinks: true,
    hasPriorityProcessing: true,
  },
  enterprise: {
    wardrobeItems: -1, // unlimited
    outfitGenerationsPerDay: -1,
    virtualTryOnsPerMonth: -1,
    aiCaptionsPerDay: -1,
    trendReportsPerWeek: -1,
    hasAdvancedStyling: true,
    hasAffiliateLinks: true,
    hasPriorityProcessing: true,
  },
};

/** Feature flags for gradual rollout and A/B testing */
export const FEATURE_FLAGS = {
  virtualTryOn: true,
  contentGenerator: true,
  shoppingAnalysis: true,
  impactDashboard: true,
  socialSharing: true,
  affiliateRecommendations: true,
} as const;

/** Keys for usage tracking (aligned with plan limits) */
export type UsageKey =
  | "outfitGenerations"
  | "virtualTryOns"
  | "aiCaptions"
  | "trendReports";

export function getPlanLimits(plan: PlanTier = "free") {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function isWithinLimit(
  plan: PlanTier,
  key: keyof (typeof PLAN_LIMITS)["free"],
  current: number
): boolean {
  const limits = getPlanLimits(plan);
  const max = limits[key];
  if (typeof max !== "number") return true;
  return max < 0 || current < max;
}
