import { create } from 'zustand';
import { Recommendation, TryonTask, SeedItem } from '../services/types';

interface CreativeState {
  seedItems: SeedItem[];
  selectedSeedIds: string[];
  recommendations: Recommendation[];
  currentTryOnTask: TryonTask | null;
  tryOnStatus: 'idle' | 'loading' | 'success' | 'error';
  isGeneratorLoading: boolean;
  ui: { tryOnModalOpen: boolean };
  setSeedItems: (items: SeedItem[]) => void;
  toggleSeedSelection: (id: string) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setTryOnTask: (task: TryonTask | null) => void;
  setTryOnStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void;
  setGeneratorLoading: (loading: boolean) => void;
  openTryOnModal: () => void;
  closeTryOnModal: () => void;
}

export const useCreativeStore = create<CreativeState>((set) => ({
  seedItems: [],
  selectedSeedIds: [],
  recommendations: [],
  currentTryOnTask: null,
  tryOnStatus: 'idle',
  isGeneratorLoading: false,
  ui: { tryOnModalOpen: false },

  setSeedItems: (items) => set({ seedItems: items }),
  
  toggleSeedSelection: (id) => set((state) => ({
    selectedSeedIds: state.selectedSeedIds.includes(id)
      ? state.selectedSeedIds.filter((sid) => sid !== id)
      : [...state.selectedSeedIds, id]
  })),

  setRecommendations: (recs) => set({ recommendations: recs }),
  setTryOnTask: (task) => set({ currentTryOnTask: task }),
  setTryOnStatus: (status) => set({ tryOnStatus: status }),
  setGeneratorLoading: (loading) => set({ isGeneratorLoading: loading }),
  openTryOnModal: () => set((state) => ({ ui: { ...state.ui, tryOnModalOpen: true } })),
  closeTryOnModal: () => set((state) => ({ ui: { ...state.ui, tryOnModalOpen: false } })),
}));
