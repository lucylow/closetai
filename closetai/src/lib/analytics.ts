// src/lib/analytics.ts
// Lightweight analytics client for tracking events
// Uses sendBeacon for reliability and falls back to fetch

const API_BASE = import.meta.env.VITE_API_BASE || '';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface AnalyticsEvent {
  event: string;
  props?: Record<string, any>;
  demo?: boolean;
}

const analytics = {
  /**
   * Track an analytics event
   * Uses sendBeacon for reliability (survives page unload)
   * Falls back to fetch if sendBeacon is not available
   */
  track: async (eventName: string, props: Record<string, any> = {}): Promise<void> => {
    try {
      const payload: AnalyticsEvent = { 
        event: eventName, 
        props,
        demo: DEMO_MODE 
      };
      
      const payloadStr = JSON.stringify(payload);
      
      // Try sendBeacon first (more reliable for page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([payloadStr], { type: 'application/json' });
        const success = navigator.sendBeacon(`${API_BASE}/api/analytics`, blob);
        if (success) {
          console.log('[Analytics] Event tracked:', eventName, props);
          return;
        }
      }
      
      // Fallback to fetch
      await fetch(`${API_BASE}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
        // Use keepalive to survive page unload
        keepalive: true,
      });
      
      console.log('[Analytics] Event tracked:', eventName, props);
    } catch (e) {
      // Non-blocking: just log warning in demo mode
      console.warn('[Analytics] Failed to track event:', e);
    }
  },

  /**
   * Get recent analytics events (for debugging/demo)
   */
  getRecentEvents: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/recent`);
      if (response.ok) {
        const data = await response.json();
        return data.events || [];
      }
    } catch (e) {
      console.warn('[Analytics] Failed to fetch recent events:', e);
    }
    return [];
  },

  /**
   * Check analytics service health
   */
  healthCheck: async (): Promise<{ ok: boolean; demo: boolean } | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('[Analytics] Health check failed:', e);
    }
    return null;
  },

  // Convenience methods for common events
  trackPageView: (page: string) => analytics.track('ui.page_view', { page }),
  trackOnboardStart: () => analytics.track('user.onboard.start', {}),
  trackOnboardComplete: (stepsCompleted: number) => 
    analytics.track('user.onboard.complete', { stepsCompleted }),
  trackItemUpload: (itemId: string, size: number, name: string) => 
    analytics.track('item.upload', { item_id: itemId, size, name }),
  trackOutfitSave: (outfitId: string) => 
    analytics.track('outfit.saved', { outfit_id: outfitId }),
  trackTryOn: (sponsor: string, success: boolean) => 
    analytics.track('tryon.request', { sponsor, success }),
  trackGeneration: (sponsor: string, success: boolean) => 
    analytics.track('generation.request', { sponsor, success }),
};

export default analytics;
