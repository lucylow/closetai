/**
 * ClosetAI Analytics & Product Telemetry
 * Supports investor-ready metrics: engagement, conversions, affiliate attribution.
 * Designed for future integration with Mixpanel, Amplitude, or PostHog.
 */

import type { PlanTier } from "@/lib/config";

export type AnalyticsEvent =
  | { name: "outfit_generated"; occasion?: string; itemCount?: number }
  | { name: "outfit_rated"; outfitId: string; rating: number }
  | { name: "wardrobe_item_added"; category?: string }
  | { name: "virtual_tryon_completed" }
  | { name: "caption_generated"; tone?: string }
  | { name: "affiliate_click"; productId?: string; brand?: string }
  | { name: "upgrade_prompt_shown"; feature: string; plan: PlanTier }
  | { name: "onboarding_completed"; stepCount?: number }
  | { name: "trend_report_viewed"; trendId?: string };

const isDev = import.meta.env.DEV;

export const analytics = {
  /** Track product events for growth and conversion analysis */
  track(event: AnalyticsEvent): void {
    const payload = {
      ...event,
      timestamp: new Date().toISOString(),
      ...(isDev && { _dev: true }),
    };
    if (isDev) {
      console.debug("[Analytics]", payload);
    }
    // Future: send to analytics provider
    // window.gtag?.('event', event.name, payload);
    // mixpanel.track(event.name, payload);
  },

  /** Track affiliate/product clicks for revenue attribution */
  trackAffiliateClick(productId?: string, brand?: string): void {
    this.track({ name: "affiliate_click", productId, brand });
  },

  /** Track upgrade prompts for conversion funnel analysis */
  trackUpgradePrompt(feature: string, plan: PlanTier): void {
    this.track({ name: "upgrade_prompt_shown", feature, plan });
  },
};
