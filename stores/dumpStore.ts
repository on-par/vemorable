import { create } from 'zustand';
import type { Dump, InsightMode, SearchResult, RecordingState, ProcessingState } from '@/types';
import { DEFAULT_INSIGHT_MODE } from '@/constants/insightModes';
import { getRandomPrompt } from '@/lib/prompts';
import * as supabaseLib from '@/lib/supabase';

interface DumpState {
  // Dumps data
  dumps: Dump[];
  selectedDump: Dump | null;
  tags: string[];
  searchResults: SearchResult[];

  // Recording state
  recording: RecordingState;

  // Processing state
  processing: ProcessingState;

  // UI state
  currentPrompt: string;
  selectedInsightMode: InsightMode;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDumps: (dumps: Dump[]) => void;
  setSelectedDump: (dump: Dump | null) => void;
  setTags: (tags: string[]) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setRecordingState: (state: Partial<RecordingState>) => void;
  setProcessingState: (state: Partial<ProcessingState>) => void;
  setCurrentPrompt: (prompt: string) => void;
  setSelectedInsightMode: (mode: InsightMode) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  rotatePrompt: () => void;

  // Async actions
  fetchDumps: () => Promise<void>;
  fetchDumpById: (id: string) => Promise<void>;
  fetchDumpsByTag: (tag: string) => Promise<void>;
  fetchTags: () => Promise<void>;
  deleteDump: (id: string) => Promise<void>;
  searchDumps: (query: string) => Promise<void>;
  processDump: (audioBase64: string) => Promise<Dump | null>;

  // Reset
  reset: () => void;
}

const initialRecordingState: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUri: null,
  error: null,
};

const initialProcessingState: ProcessingState = {
  isProcessing: false,
  step: 'idle',
  error: null,
};

export const useDumpStore = create<DumpState>((set, get) => ({
  // Initial state
  dumps: [],
  selectedDump: null,
  tags: [],
  searchResults: [],
  recording: initialRecordingState,
  processing: initialProcessingState,
  currentPrompt: getRandomPrompt(),
  selectedInsightMode: DEFAULT_INSIGHT_MODE,
  isLoading: false,
  error: null,

  // Simple setters
  setDumps: (dumps) => set({ dumps }),
  setSelectedDump: (dump) => set({ selectedDump: dump }),
  setTags: (tags) => set({ tags }),
  setSearchResults: (results) => set({ searchResults: results }),

  setRecordingState: (state) =>
    set((prev) => ({
      recording: { ...prev.recording, ...state },
    })),

  setProcessingState: (state) =>
    set((prev) => ({
      processing: { ...prev.processing, ...state },
    })),

  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  setSelectedInsightMode: (mode) => set({ selectedInsightMode: mode }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  rotatePrompt: () => set({ currentPrompt: getRandomPrompt() }),

  // Async actions
  fetchDumps: async () => {
    set({ isLoading: true, error: null });
    try {
      const dumps = await supabaseLib.fetchDumps();
      set({ dumps, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dumps',
        isLoading: false,
      });
    }
  },

  fetchDumpById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const dump = await supabaseLib.fetchDumpById(id);
      set({ selectedDump: dump, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dump',
        isLoading: false,
      });
    }
  },

  fetchDumpsByTag: async (tag) => {
    set({ isLoading: true, error: null });
    try {
      const dumps = await supabaseLib.fetchDumpsByTag(tag);
      set({ dumps, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dumps by tag',
        isLoading: false,
      });
    }
  },

  fetchTags: async () => {
    try {
      const tags = await supabaseLib.fetchAllTags();
      set({ tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  deleteDump: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await supabaseLib.deleteDump(id);
      const { dumps } = get();
      set({
        dumps: dumps.filter((d) => d.id !== id),
        selectedDump: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete dump',
        isLoading: false,
      });
    }
  },

  searchDumps: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const results = await supabaseLib.searchDumps(query);
      set({ searchResults: results, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search dumps',
        isLoading: false,
      });
    }
  },

  processDump: async (audioBase64) => {
    const { currentPrompt, selectedInsightMode } = get();

    set({
      processing: { isProcessing: true, step: 'uploading', error: null },
    });

    try {
      set({ processing: { isProcessing: true, step: 'transcribing', error: null } });

      const result = await supabaseLib.processDump(
        audioBase64,
        selectedInsightMode,
        currentPrompt
      );

      set({ processing: { isProcessing: true, step: 'saving', error: null } });

      // Fetch the full dump to get all fields
      const dump = await supabaseLib.fetchDumpById(result.id);

      set({
        processing: { isProcessing: false, step: 'idle', error: null },
        selectedDump: dump,
      });

      // Refresh dumps list and tags
      get().fetchDumps();
      get().fetchTags();

      // Rotate prompt for next recording
      get().rotatePrompt();

      return dump;
    } catch (error) {
      set({
        processing: {
          isProcessing: false,
          step: 'idle',
          error: error instanceof Error ? error.message : 'Failed to process dump',
        },
      });
      return null;
    }
  },

  reset: () =>
    set({
      dumps: [],
      selectedDump: null,
      tags: [],
      searchResults: [],
      recording: initialRecordingState,
      processing: initialProcessingState,
      currentPrompt: getRandomPrompt(),
      selectedInsightMode: DEFAULT_INSIGHT_MODE,
      isLoading: false,
      error: null,
    }),
}));
