// src/stores/useCreativeStore.ts
import { create } from 'zustand';
import type { SeedItem, Recommendation, TryOnTask } from '../types';

type CreativeState = {
  seedItems: SeedItem[];
  addSeedItem: (item: SeedItem) => void;
  removeSeedItem: (id: string) => void;
  recommendations: Recommendation[];
  setRecommendations: (list: Recommendation[]) => void;
  currentTryOn?: TryOnTask | null;
  setTryOn: (t: TryOnTask | null) => void;
  ui: { tryOnOpen: boolean; setTryOnOpen: (open: boolean) => void };
};

export const useCreativeStore = create<CreativeState>((set, get) => ({
  seedItems: [],
  addSeedItem: (item) => set((s) => ({ seedItems: [...s.seedItems, item] })),
  removeSeedItem: (id) => set((s) => ({ seedItems: s.seedItems.filter((i) => i.id !== id) })),
  recommendations: [],
  setRecommendations: (list) => set(() => ({ recommendations: list })),
  currentTryOn: null,
  setTryOn: (t) => set(() => ({ currentTryOn: t })),
  ui: { tryOnOpen: false, setTryOnOpen: (open) => set((s) => ({ ui: { ...s.ui, tryOnOpen: open } })) },
}));
