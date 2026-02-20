/**
 * useFeatureAccess - Premium feature gating for freemium model
 * Gates features by plan tier and usage limits.
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlanLimits,
  type PlanTier,
  FEATURE_FLAGS,
  type UsageKey,
} from "@/lib/config";
import { analytics } from "@/services/analytics.service";

type FeatureKey =
  | "advancedStyling"
  | "virtualTryOn"
  | "affiliateLinks"
  | "priorityProcessing"
  | keyof typeof FEATURE_FLAGS;

interface UsageState {
  outfitGenerations: number;
  virtualTryOns: number;
  aiCaptions: number;
  trendReports: number;
}

/** In-memory usage for demo; replace with API-backed usage in production */
const defaultUsage: UsageState = {
  outfitGenerations: 0,
  virtualTryOns: 0,
  aiCaptions: 0,
  trendReports: 0,
};

export function useFeatureAccess(usage?: Partial<UsageState>) {
  const { user } = useAuth();
  const plan: PlanTier = (user as { plan?: PlanTier })?.plan ?? "free";
  const limits = useMemo(() => getPlanLimits(plan), [plan]);

  const mergedUsage = useMemo(
    () => ({ ...defaultUsage, ...usage }),
    [usage?.outfitGenerations, usage?.virtualTryOns, usage?.aiCaptions, usage?.trendReports]
  );

  const canUse = useMemo(() => {
    const check = (key: FeatureKey): boolean => {
      if (key in FEATURE_FLAGS && !FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS])
        return false;

      switch (key) {
        case "advancedStyling":
          return limits.hasAdvancedStyling;
        case "virtualTryOn":
          return FEATURE_FLAGS.virtualTryOn && (limits.virtualTryOnsPerMonth < 0 || mergedUsage.virtualTryOns < limits.virtualTryOnsPerMonth);
        case "affiliateLinks":
          return limits.hasAffiliateLinks;
        case "priorityProcessing":
          return limits.hasPriorityProcessing;
        default:
          return true;
      }
    };
    return check;
  }, [limits, mergedUsage]);

  const checkLimit = (key: UsageKey): { allowed: boolean; remaining: number } => {
    const limitMap = {
      outfitGenerations: limits.outfitGenerationsPerDay,
      virtualTryOns: limits.virtualTryOnsPerMonth,
      aiCaptions: limits.aiCaptionsPerDay,
      trendReports: limits.trendReportsPerWeek,
    };
    const max = limitMap[key];
    const current = mergedUsage[key as keyof UsageState] ?? 0;
    const remaining = max < 0 ? Infinity : Math.max(0, max - current);
    return { allowed: remaining > 0, remaining };
  };

  const showUpgradePrompt = (feature: string) => {
    analytics.trackUpgradePrompt(feature, plan);
  };

  return {
    plan,
    limits,
    canUse,
    checkLimit,
    showUpgradePrompt,
    isPremium: plan === "premium" || plan === "enterprise",
  };
}
