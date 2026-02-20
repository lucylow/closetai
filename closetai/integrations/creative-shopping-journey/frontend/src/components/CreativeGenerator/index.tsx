import { useState } from 'react';
import { useCreativeStore } from '../../stores/useCreativeStore';
import { api } from '../../services/api';
import { GeneratorForm } from './GeneratorForm';
import { RecommendationList } from './RecommendationList';

export function CreativeGenerator({ userId }: { userId?: string }) {
  const { recommendations, isGeneratorLoading, setRecommendations, setGeneratorLoading } = useCreativeStore();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (params: {
    seedItemIds: string[];
    context: { occasion?: string; weather?: string; vibe?: string };
    options: { numResults?: number; includeContent?: boolean };
  }) => {
    setGeneratorLoading(true);
    setError(null);
    try {
      const response = await api.generate({ userId, ...params });
      setRecommendations(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGeneratorLoading(false);
    }
  };

  return (
    <div className="creative-generator">
      <h2 className="text-2xl font-bold mb-4">Creative Generator</h2>
      <GeneratorForm onGenerate={handleGenerate} isLoading={isGeneratorLoading} />
      {error && <div className="error-message text-red-500 mt-4">{error}</div>}
      {recommendations.length > 0 && <RecommendationList recommendations={recommendations} />}
    </div>
  );
}
