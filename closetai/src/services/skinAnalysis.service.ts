/**
 * Skin Analysis API Service
 * 
 * Frontend service for Perfect Corp skin analysis integration
 */

const API_BASE = '/api/skin-analysis';

export interface SkinAnalysisResult {
  status: string;
  taskId?: string;
  skin_color_hex?: string;
  undertone?: string;
  skin_type?: string;
  palette?: string[];
  season?: string;
  description?: string;
  analysis_data?: Record<string, unknown>;
  message?: string;
}

export interface SkinAnalysisHistory {
  id: string;
  skin_color_hex: string;
  undertone: string;
  skin_type: string;
  recommended_palette: string[];
  created_at: string;
}

export interface SkinBasedRecommendation {
  skinAnalysis: {
    skinColor: string | null;
    undertone: string | null;
    season: string | null;
    hasAnalysis: boolean;
  };
  recommendations: Array<{
    id: string;
    name: string;
    category: string;
    colors: string[];
    image_url: string;
    colorMatchScore: number;
  }>;
  colorScore: number;
  recommendedPalette: string[];
  tips: string[];
}

// Advanced Analysis Types
export interface SkinScores {
  acne: number | null;
  pore: number | null;
  wrinkle: number | null;
  texture: number | null;
  oiliness: number | null;
  radiance: number | null;
  moisture: number | null;
  redness: number | null;
}

export interface SkinVisual {
  id: string;
  overlay_type: string;
  s3_url: string;
  concern_level: string;
}

export interface SkincareRecommendation {
  id: string;
  product_name: string;
  product_category: string;
  concern_target: string;
  suitability_score: number;
  ingredients: string[];
  routine_order: number;
  is_morning_routine: boolean;
}

export interface OutfitSuggestion {
  id: string;
  look_name: string;
  look_description: string;
  outfit_score: number;
  color_palette: string[];
  style_tags: string[];
  occasion: string;
  season_recommendation: string;
}

export interface ShoppingJourney {
  id: string;
  skin_analysis_id: string;
  journey_type: string;
  current_step: number;
  total_steps: number;
  step_data: {
    steps: Array<{
      step: number;
      title: string;
      description?: string;
      completed?: boolean;
    }>;
  };
  is_completed: boolean;
}

export interface AdvancedAnalysisResult {
  id: string;
  status: string;
  created_at: string;
  skin_color_hex: string;
  undertone: string;
  skin_type: string;
  skin_age: number | null;
  overall_score: number | null;
  scores: SkinScores;
  visuals: SkinVisual[];
  skincare_recommendations: SkincareRecommendation[];
  outfit_suggestions: OutfitSuggestion[];
}

/**
 * Upload selfie and start skin analysis
 */
export async function startSkinAnalysis(file: File): Promise<{ taskId: string; status: string; message?: string }> {
  const formData = new FormData();
  formData.append('selfie', file);

  const response = await fetch(API_BASE, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to start analysis');
  }

  return response.json();
}

/**
 * Poll for analysis status
 */
export async function getAnalysisStatus(taskId: string): Promise<SkinAnalysisResult> {
  const response = await fetch(`${API_BASE}/status/${taskId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Status check failed' }));
    throw new Error(error.error || 'Failed to get status');
  }

  return response.json();
}

/**
 * Get user's skin analysis history
 */
export async function getSkinAnalysisHistory(): Promise<SkinAnalysisHistory[]> {
  const response = await fetch(`${API_BASE}/history`);
  
  if (!response.ok) {
    throw new Error('Failed to get history');
  }

  return response.json();
}

/**
 * Delete a skin analysis record
 */
export async function deleteSkinAnalysis(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete');
  }
}

/**
 * Get personalized recommendations based on skin analysis
 */
export async function getSkinBasedRecommendations(options?: {
  limit?: number;
  occasion?: string;
  season?: string;
}): Promise<SkinBasedRecommendation> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.occasion) params.set('occasion', options.occasion);
  if (options?.season) params.set('season', options.season);

  const response = await fetch(`/api/recommendations/skin-based?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get recommendations');
  }

  return response.json();
}

/**
 * Get shopping suggestions based on skin color
 */
export async function getShoppingSuggestions(skinColor: string): Promise<{
  recommendedColors: string[];
  avoidColors: string[];
  season: string;
  undertone: string;
  description: string;
}> {
  const params = new URLSearchParams({ skinColor });
  const response = await fetch(`/api/recommendations/shopping-suggestions?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get suggestions');
  }

  return response.json();
}

/**
 * Poll for analysis completion with timeout
 */
export async function pollForResults(
  taskId: string,
  onProgress?: (status: string) => void,
  options = { maxAttempts: 30, intervalMs: 2000 }
): Promise<SkinAnalysisResult> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    const result = await getAnalysisStatus(taskId);
    
    if (result.status === 'completed') {
      return result;
    }
    
    if (result.status === 'error') {
      throw new Error(result.message || 'Analysis failed');
    }
    
    if (onProgress) {
      onProgress(result.message || 'Processing...');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, options.intervalMs));
  }
  
  throw new Error('Analysis timed out');
}

/**
 * Start advanced skin analysis with detailed scoring
 */
export async function startAdvancedAnalysis(
  file: File,
  actions?: string[]
): Promise<{ taskId: string; fileId: string; analysisId: string; status: string; pollingInterval: number }> {
  const formData = new FormData();
  formData.append('selfie', file);
  if (actions) {
    formData.append('actions', JSON.stringify(actions));
  }

  const response = await fetch(`${API_BASE}/advanced`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to start advanced analysis');
  }

  return response.json();
}

/**
 * Get detailed analysis with scores and visuals
 */
export async function getAnalysisDetails(analysisId: string): Promise<AdvancedAnalysisResult> {
  const response = await fetch(`${API_BASE}/${analysisId}/details`);
  
  if (!response.ok) {
    throw new Error('Failed to get analysis details');
  }

  return response.json();
}

/**
 * Get skincare recommendations
 */
export async function getSkincareRecommendations(
  analysisId: string, 
  routine?: 'morning' | 'evening'
): Promise<SkincareRecommendation[]> {
  const params = new URLSearchParams();
  if (routine) params.set('routine', routine);

  const response = await fetch(`${API_BASE}/${analysisId}/skincare?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get skincare recommendations');
  }

  return response.json();
}

/**
 * Get outfit suggestions
 */
export async function getOutfitSuggestions(
  analysisId: string,
  options?: { occasion?: string; season?: string }
): Promise<OutfitSuggestion[]> {
  const params = new URLSearchParams();
  if (options?.occasion) params.set('occasion', options.occasion);
  if (options?.season) params.set('season', options.season);

  const response = await fetch(`${API_BASE}/${analysisId}/outfits?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to get outfit suggestions');
  }

  return response.json();
}

/**
 * Get shopping journey
 */
export async function getShoppingJourney(analysisId: string): Promise<ShoppingJourney> {
  const response = await fetch(`${API_BASE}/${analysisId}/journey`);
  
  if (!response.ok) {
    throw new Error('Failed to get shopping journey');
  }

  return response.json();
}

/**
 * Update shopping journey
 */
export async function updateShoppingJourney(
  analysisId: string,
  updates: { current_step?: number; completed_steps?: number[] }
): Promise<ShoppingJourney> {
  const response = await fetch(`${API_BASE}/${analysisId}/journey`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update shopping journey');
  }

  return response.json();
}
