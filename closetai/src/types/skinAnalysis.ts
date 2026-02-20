export type SkinAnalysisResult = {
  taskId: string;
  status: 'pending' | 'completed' | 'error';
  skin_color_hex?: string;
  undertone?: 'warm' | 'cool' | 'neutral';
  skin_type?: string;
  notes?: string;
  palette?: string[];
};
