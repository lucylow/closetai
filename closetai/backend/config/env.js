const dotenv = require('dotenv');
dotenv.config();

// Required environment variables (DATABASE_URL or individual DB vars)
const hasDbUrl = !!process.env.DATABASE_URL;
const hasDbVars = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER;
const hasPgVars = process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER;

if (!hasDbUrl && !hasDbVars && !hasPgVars) {
  console.error('Missing database configuration: set DATABASE_URL or DB_HOST/DB_NAME/DB_USER or PGHOST/PGDATABASE/PGUSER');
  process.exit(1);
}

/**
 * Subscription tiers with feature flags
 */
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    monthlyCredits: 10,
    features: {
      makeupTryOn: true,
      skinAnalysis: false,
      hairStyling: false,
      fashionTryOn: false,
      accessoryTryOn: false,
      lookbook: false,
      avatarCreation: false,
      funFilters: true,
      priorityProcessing: false,
      analytics: false,
      abTesting: false,
      customBranding: false,
      apiAccess: false,
      teamMembers: 1,
    },
  },
  starter: {
    name: 'Starter',
    monthlyCredits: 100,
    price: 29,
    features: {
      makeupTryOn: true,
      skinAnalysis: true,
      hairStyling: true,
      fashionTryOn: true,
      accessoryTryOn: true,
      lookbook: true,
      avatarCreation: true,
      funFilters: true,
      priorityProcessing: false,
      analytics: true,
      abTesting: false,
      customBranding: false,
      apiAccess: false,
      teamMembers: 2,
    },
  },
  professional: {
    name: 'Professional',
    monthlyCredits: 500,
    price: 79,
    features: {
      makeupTryOn: true,
      skinAnalysis: true,
      hairStyling: true,
      fashionTryOn: true,
      accessoryTryOn: true,
      lookbook: true,
      avatarCreation: true,
      funFilters: true,
      priorityProcessing: true,
      analytics: true,
      abTesting: true,
      customBranding: true,
      apiAccess: false,
      teamMembers: 5,
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthlyCredits: -1, // Unlimited
    price: null, // Custom pricing
    features: {
      makeupTryOn: true,
      skinAnalysis: true,
      hairStyling: true,
      fashionTryOn: true,
      accessoryTryOn: true,
      lookbook: true,
      avatarCreation: true,
      funFilters: true,
      priorityProcessing: true,
      analytics: true,
      abTesting: true,
      customBranding: true,
      apiAccess: true,
      teamMembers: -1, // Unlimited
    },
  },
};

/**
 * Feature flag definitions
 */
const FEATURES = {
  // AI Try-On Features
  MAKEUP_TRYON: 'makeupTryOn',
  SKIN_ANALYSIS: 'skinAnalysis',
  HAIR_STYLING: 'hairStyling',
  FASHION_TRYON: 'fashionTryOn',
  ACCESSORY_TRYON: 'accessoryTryOn',
  LOOKBOOK: 'lookbook',
  AVATAR_CREATION: 'avatarCreation',
  FUN_FILTERS: 'funFilters',
  
  // Premium Features
  PRIORITY_PROCESSING: 'priorityProcessing',
  ANALYTICS: 'analytics',
  AB_TESTING: 'abTesting',
  CUSTOM_BRANDING: 'customBranding',
  API_ACCESS: 'apiAccess',
};

module.exports = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.PGHOST || process.env.DB_HOST,
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
    name: process.env.PGDATABASE || process.env.DB_NAME,
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // S3 / Object Storage
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    endpoint: process.env.S3_ENDPOINT,
  },
  
  // Linode (S3-compatible)
  linode: {
    endpoint: process.env.LINODE_ENDPOINT,
    bucket: process.env.LINODE_BUCKET,
    accessKey: process.env.LINODE_ACCESS_KEY,
    secretKey: process.env.LINODE_SECRET_KEY,
  },
  
  // OpenAI
  openai: { apiKey: process.env.OPENAI_API_KEY },
  
  // Perfect Corp / YouCam API
  perfectCorp: {
    apiKey: process.env.YOUCAM_API_KEY || process.env.PERFECT_CORP_API_KEY || process.env.PERFECT_API_KEY,
    apiSecret: process.env.YOUCAM_SECRET_KEY || process.env.PERFECT_CORP_API_SECRET,
    baseUrl: process.env.PERFECT_CORP_BASE_URL || 'https://yce-api-01.makeupar.com',
    yceUrl: process.env.PERFECT_CORP_YCE_URL || 'https://yce-api-01.makeupar.com/s2s/v2.0',
    webhookSecret: process.env.PERFECT_CORP_WEBHOOK_SECRET,
  },
  
  // You.com API
  youcom: {
    apiKey: process.env.YOUCOM_API_KEY,
    baseUrl: process.env.YOUCOM_BASE_URL || 'https://api.ydc-index.io/v1',
  },
  
  // Background Removal
  removeBg: { apiKey: process.env.REMOVE_BG_API_KEY },
  
  // Weather API
  openWeatherMap: { apiKey: process.env.OPENWEATHERMAP_API_KEY },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL,
  },
  
  // Kilo AI
  kilo: {
    apiKey: process.env.KILO_API_KEY,
    gatewayBase: process.env.KILO_GATEWAY_BASE || 'https://api.kilo.ai/api/gateway',
    timeoutMs: parseInt(process.env.KILO_TIMEOUT_MS || '30000', 10),
  },
  
  // Stripe Billing
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Segment Analytics
  segment: {
    writeKey: process.env.SEGMENT_WRITE_KEY,
  },
  
  // A/B Testing
  abTest: {
    apiKey: process.env.AB_TEST_API_KEY,
    provider: process.env.AB_TEST_PROVIDER || 'internal', // 'internal', 'launchdarkly', 'optimizely'
  },
  
  // CRM Integrations
  crm: {
    hubspot: {
      apiKey: process.env.HUBSPOT_API_KEY,
      portalId: process.env.HUBSPOT_PORTAL_ID,
    },
    salesforce: {
      clientId: process.env.SALESFORCE_CLIENT_ID,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
      instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
    },
    mailchimp: {
      apiKey: process.env.MAILCHIMP_API_KEY,
      serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
    },
  },
  
  // Admin
  admin: {
    token: process.env.ADMIN_TOKEN,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Feature Flags
  features: FEATURES,
  
  // Subscription Tiers
  subscriptionTiers: SUBSCRIPTION_TIERS,
  
  // Get tier by name
  getTier: (tierName) => SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.free,
  
  // Check if feature is enabled for tier
  isFeatureEnabled: (tierName, feature) => {
    const tier = SUBSCRIPTION_TIERS[tierName];
    return tier?.features[feature] || false;
  },
};
