/**
 * Segment analytics integration. Server-side event tracking.
 */
const env = require('../config/env');

let analytics = null;
if (env.segment?.writeKey) {
  try {
    const Analytics = require('analytics-node');
    analytics = new Analytics(env.segment.writeKey);
  } catch (err) {
    console.warn('Segment analytics not loaded:', err.message);
  }
}

async function trackEvent(userId, event, props = {}) {
  if (!analytics) return;
  try {
    analytics.track({
      userId: String(userId),
      event,
      properties: props,
    });
  } catch (err) {
    console.warn('Segment track failed:', err.message);
  }
}

async function identifyUser(userId, traits = {}) {
  if (!analytics) return;
  try {
    analytics.identify({
      userId: String(userId),
      traits,
    });
  } catch (err) {
    console.warn('Segment identify failed:', err.message);
  }
}

module.exports = {
  analytics,
  trackEvent,
  identifyUser,
};
