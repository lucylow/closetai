/**
 * Prompt Templates Service - Creative shopping journey prompt engineering
 * 
 * Provides pre-built prompt templates for various fashion use cases:
 * - Hero product photography
 * - Personalized outfit composites
 * - Lookbook generation
 * - Social media assets
 * - Virtual try-on variations
 */

const TEMPLATES = {
  /**
   * A. Hero Product Photo
   * Professional studio shot for e-commerce
   */
  hero_product: {
    name: 'Hero Product Photo',
    description: 'Professional studio shot of product on model for e-commerce',
    prompt: `Photorealistic studio shot of {product_name} on model. Full body, neutral background, softbox lighting, high detail, accurate fabric texture, natural skin tones, no logos visible, {width}x{height}. Camera: 50mm lens, shallow depth of field, neutral color grading.`,
    negative_prompt: 'cartoon, sketch, watermark, logo, text, oversaturated colors, unrealistic eyes, broken anatomy, blurred details, low-resolution, 3d render, anime',
    variables: ['product_name', 'width', 'height'],
    defaults: {
      width: 2048,
      height: 2048,
      style: 'photorealistic'
    }
  },

  /**
   * B. Personalized Outfit Composite
   * Composite user photo with product
   */
  outfit_composite: {
    name: 'Personalized Outfit Composite',
    description: 'Composite user photo wearing the product',
    prompt: `Composite of user photo (reference: {user_image_url}) wearing the product (reference: {product_image_url}). Preserve user's face and proportions. Match lighting and shadows. Style: {style}; {accessories}. Output photorealistic {width}x{height}.`,
    negative_prompt: 'cartoon, sketch, distorted face, broken anatomy, mismatched lighting, watermark, text, logo, low-quality',
    variables: ['user_image_url', 'product_image_url', 'style', 'accessories', 'width', 'height'],
    defaults: {
      width: 2048,
      height: 2048,
      style: 'smart casual',
      accessories: 'accessories as mentioned'
    }
  },

  /**
   * C. Lookbook Grid
   * Multi-panel lookbook with various styles
   */
  lookbook: {
    name: 'Lookbook Grid',
    description: '4-panel lookbook featuring product styled four ways',
    prompt: `4-panel lookbook featuring {product_name} styled four ways: {styles}. Each panel full body shot, consistent model and lighting, background {background}, cohesive color palette. {width}x{height}, photorealistic, editorial quality.`,
    negative_prompt: 'cartoon, watermark, text, logo, inconsistent lighting, mismatched models, low-resolution, blurry',
    variables: ['product_name', 'styles', 'background', 'width', 'height'],
    defaults: {
      width: 2048,
      height: 2048,
      styles: 'casual, business casual, date night, weekend',
      background: 'urban/outdoor'
    }
  },

  /**
   * D. Social Promo Asset
   * Square social media image with CTA area
   */
  social_promo: {
    name: 'Social Promo Asset',
    description: 'Square social media image with placeholder for CTA',
    prompt: `Square social image {width}x{height}: close-up of {product_name} with soft gradient background ({colors}), placeholder area for CTA at bottom. Minimal shadows, product-focused, high contrast, no text overlays. {lighting} lighting, {mood} mood.`,
    negative_prompt: 'text, watermark, logo, cluttered background, harsh shadows, low-quality, cartoon',
    variables: ['product_name', 'colors', 'width', 'height', 'lighting', 'mood'],
    defaults: {
      width: 1200,
      height: 1200,
      colors: 'teal->violet',
      lighting: 'soft',
      mood: 'modern'
    }
  },

  /**
   * E. Virtual Try-On Variation
   * Generate variations of the same item
   */
  tryon_variation: {
    name: 'Try-On Variation',
    description: 'Generate variations of a garment try-on',
    prompt: `Fashion photograph of model wearing {product_name}. {variation_description}. Photorealistic, natural pose, studio lighting, {background}. {width}x{height}. Ensure garment fits naturally.`,
    negative_prompt: 'cartoon, distorted, poorly fitting clothes, watermark, text, logo, low-quality, blurry',
    variables: ['product_name', 'variation_description', 'background', 'width', 'height'],
    defaults: {
      width: 1024,
      height: 1024,
      background: 'neutral studio',
      variation_description: 'natural drape'
    }
  },

  /**
   * F. Colorway Exploration
   * Generate same item in different colors
   */
  colorway: {
    name: 'Colorway Exploration',
    description: 'Same product in different colorways',
    prompt: `Fashion photograph of {product_name} in {color} colorway. Clean studio background, product-focused, high detail, accurate fabric texture. {width}x{height}, photorealistic, e-commerce quality.`,
    negative_prompt: 'cartoon, sketch, watermark, text, logo, distorted colors, low-quality',
    variables: ['product_name', 'color', 'width', 'height'],
    defaults: {
      width: 1024,
      height: 1024
    }
  },

  /**
   * G. Lifestyle Shoot
   * Product in real-world context
   */
  lifestyle: {
    name: 'Lifestyle Shoot',
    description: 'Product in real-world context',
    prompt: `Lifestyle photograph of {product_name} in {setting}. Person wearing the item, natural pose, {lighting} lighting, {mood} mood. {width}x{height}, photorealistic, social media ready.`,
    negative_prompt: 'cartoon, watermark, text, logo, low-quality, blurry, artificial',
    variables: ['product_name', 'setting', 'lighting', 'mood', 'width', 'height'],
    defaults: {
      width: 1920,
      height: 1080,
      setting: 'urban street',
      lighting: 'natural',
      mood: 'casual'
    }
  },

  /**
   * H. Flat Lay
   * Flat lay photography of items
   */
  flat_lay: {
    name: 'Flat Lay',
    description: 'Flat lay photography for styling content',
    prompt: `Flat lay composition of {product_name} with {accessories}. Clean {background} background, artistic arrangement, {lighting} lighting, {width}x{height}. Perfect for Instagram, high detail, cohesive color palette.`,
    negative_prompt: 'cartoon, watermark, text, logo, messy, low-quality, blurry',
    variables: ['product_name', 'accessories', 'background', 'lighting', 'width', 'height'],
    defaults: {
      width: 1080,
      height: 1080,
      background: 'neutral',
      lighting: 'soft',
      accessories: 'complementary items'
    }
  },

  /**
   * I. DALL·E Slide Pitch - Advanced AI Technology Stack
   * Investor/Technical pitch deck slide for Closet A.I. + YouCam API
   * 16:9 horizontal slide visualization
   */
  dalle_slide_pitch: {
    name: 'DALL·E Slide Pitch - AI Tech Stack',
    description: '16:9 horizontal slide visualizing Closet A.I. AI Technology Stack with Perfect Corp/YouCam API features',
    prompt: `Create a high-fidelity horizontal slide (16:9 aspect ratio, 3840x2160px 4K resolution) that clearly conveys Closet A.I.'s AI Technology Stack & Perfect Corp / YouCam API Advanced Features for fashion and image augmentation. The slide is designed for an investor or technical pitch deck and must include legible text on the image. Render vector icons and diagrams that illustrate how each advanced AI function fits into Closet A.I.'s overall system.

VISUAL STYLE:
- Modern, minimalist, corporate design
- Vector illustrations only (no real photos)
- Colors: primary purple #6e4ae0, accent teal #00c9b7, charcoal text #222222, neutral gradients (#f6f0fc → #ffffff)
- Icons: thin line icons (1.5-2px) for features
- Typography: Inter/Roboto/Helvetica style; Title ~64pt, section headers ~32pt, body bullets ~18pt

SLIDE STRUCTURE (LEFT → CENTER → RIGHT):

1) TITLE AREA (full width, top):
- Render exactly: "ADVANCED AI TECHNOLOGY STACK" with subtitle "Closet A.I. + YouCam API (Perfect Corp) powered Fashion & Visual AI"

2) LEFT COLUMN - Core AI Feature Grid:
- Header: "CORE AI FEATURE CATEGORIES" (purple bold)
- 6 items with icons + text:
  1. Object Removal — Remove unwanted objects from fashion images
  2. Photo Enhance — Upscale & un-blur low-quality photos
  3. Photo Colorize — Restore B&W to color with AI accuracy
  4. Image Generator — Text-to-image fashion asset creation
  5. AIReplace / MakeupTransfer / FaceSwap — Swap faces, transfer texture or makeup styles
  6. Style Transfer & Image→Video — Apply artistic style + turn images into videos
- Microcopy: "Powered by Perfect Corp's Gen AI API — diverse REST endpoints for image & video transformation."

3) CENTER COLUMN - Integration Diagram (AI Pipeline):
- Header: "CLOSET A.I. + YOUCAM API TECH PIPELINE" (teal bold)
- Central hub graphic (neural network icon with concentric rings)
- Surrounding labeled nodes with crisp vector arrows showing flow: Upload → Process → Output
- Short labels on leader lines:
  * Background & Object Removal
  * Photo & Video Enhancement
  * Colorization & Correction
  * Generative Image Creation (AI Image Gen)
  * Makeup Transfer & Texture Blend
  * Face Swap & Identity Overlay
  * Style Transfer (artistic / fashion style)
  * Image→Video Generator (animated fashion loops)
- Inset box showing API workflow: Upload image → Create AI task → Poll for status → Retrieve result
- Input formats: jpg/png, long side ≤ 4096 px; video input ≤ 1920 px
- API microcallouts: "RESTful calls w/ Bearer auth", "Async task model → polling states", "Mask generation & blend logic"

4) RIGHT COLUMN - Outputs & UX Uses:
- Header: "REAL-WORLD OUTPUTS" (purple bold)
- 4 horizontal cards (icon + text):
  1. Enhanced Virtual Try-On — Realistic garment + accessories overlay
  2. Creative Content Generator — Generate editorial imagery + animated clips
  3. User Sharable Media — Stylized photos + hashtags + captions
  4. Retail & Ecommerce Boost — High-quality visuals for listings & AR catalogs
- Microcopy: "Advanced visual AI increases engagement, reduces returns, and drives conversion."

5) FOOTER KPI & Details:
- Thin horizontal strip with badges:
  * Supported Formats: jpg/png up to 4096 px
  * Video Support: video enhance up to 2× resolution
  * REST API Workflow: upload → task → poll → result
  * Credits & Rate Limit: 100 req/min; per-IP & token guards
- Footer central thesis (centered): "Closet A.I. + YouCam API delivers a full suite of advanced AI & visual computing tools for fashion discovery, immersive try-on, creative output and retail transformation."

ICONOGRAPHY:
- Simple thin line vectors: object erase, enhance graph, color palette, stylized image, swap icon, stylized video
- Purple for Closet A.I. internal tech, Teal for API integration flows, Charcoal for text
- Subtle dashed arrows for asynchronous processes

LAYOUT:
- 3 equal vertical zones: Left/Right ~30% each, Center ~40%
- Uniform spacing (72-96px gaps)
- Safe margins: 160px left/right, 120px top/bottom

NEGATIVE CONSTRAINTS - Do not include:
- Real faces / photography
- Product brand logos (YouCam Perfect logos)
- Dense paragraphs
- Neon/unrelated colors`,
    negative_prompt: 'real faces, photography, logos, watermark, text overlays, dense paragraphs, neon colors, cartoon, anime, 3d render, low-quality, blurry, cluttered background',
    variables: [],
    defaults: {
      width: 3840,
      height: 2160,
      style: 'slide_pitch'
    }
  }
};

// Style presets for variations
const STYLE_PRESETS = {
  photorealistic: {
    prompt_additions: 'photorealistic, realistic lighting, detailed textures, natural colors',
    negative_additions: 'cartoon, anime, 3d render, illustration, artificial'
  },
  editorial: {
    prompt_additions: 'editorial fashion, magazine style, high fashion, dramatic lighting',
    negative_additions: 'casual, snapshot, amateur, low-quality'
  },
  casual: {
    prompt_additions: 'casual wear, everyday style, relaxed, comfortable',
    negative_additions: 'formal, business, suit, tie'
  },
  streetwear: {
    prompt_additions: 'streetwear, urban, trendy, hip-hop influenced',
    negative_additions: 'formal, classic, vintage'
  },
  luxury: {
    prompt_additions: 'luxury fashion, high-end, designer, premium materials',
    negative_additions: 'budget, cheap, mass-market'
  },
  slide_pitch: {
    prompt_additions: 'slide, presentation, pitch deck, corporate, infographic, vector graphics, clean typography, professional layout',
    negative_additions: 'hand-drawn, messy, informal, social media style, advertisement'
  }
};

// Negative prompt base (always included)
const BASE_NEGATIVE = 'cartoon, sketch, watermark, logo, text, oversaturated colors, unrealistic eyes, broken anatomy, blurred details, low-resolution';

/**
 * Generate prompt from template
 */
function generateFromTemplate(templateName, variables = {}) {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}`);
  }
  
  const defaults = template.defaults || {};
  const mergedVars = { ...defaults, ...variables };
  
  // Replace variables in prompt
  let prompt = template.prompt;
  for (const [key, value] of Object.entries(mergedVars)) {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  // Build negative prompt
  let negativePrompt = template.negative_prompt || BASE_NEGATIVE;
  
  // Add style-specific negatives if provided
  if (mergedVars.style && STYLE_PRESETS[mergedVars.style]) {
    negativePrompt += `, ${STYLE_PRESETS[mergedVars.style].negative_additions}`;
  }
  
  return {
    prompt: prompt.trim(),
    negative_prompt: negativePrompt.trim(),
    template: templateName,
    metadata: {
      template_name: template.name,
      description: template.description,
      variables: mergedVars
    }
  };
}

/**
 * Generate multiple variations from template
 */
function generateVariations(templateName, baseVariables, count = 3) {
  const variations = [];
  
  for (let i = 0; i < count; i++) {
    const vars = {
      ...baseVariables,
      seed: i + 1
    };
    
    try {
      const generated = generateFromTemplate(templateName, vars);
      variations.push(generated);
    } catch (error) {
      console.error(`Failed to generate variation ${i}:`, error);
    }
  }
  
  return variations;
}

/**
 * Get all available templates
 */
function getTemplates() {
  return Object.entries(TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    variables: value.variables,
    defaults: value.defaults
  }));
}

/**
 * Get template by ID
 */
function getTemplate(templateId) {
  return TEMPLATES[templateId] || null;
}

/**
 * Get style presets
 */
function getStylePresets() {
  return STYLE_PRESETS;
}

module.exports = {
  TEMPLATES,
  STYLE_PRESETS,
  BASE_NEGATIVE,
  generateFromTemplate,
  generateVariations,
  getTemplates,
  getTemplate,
  getStylePresets
};
