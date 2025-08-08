import React, { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ItalianEntity, EntityExtractionResult } from '@/types/entities';
import {
  SemanticTriple,
  TripleExtractionResult,
  TripleAnalytics,
} from '@/types/triples';
import { SecureStorage, UserPreferences } from '@/utils/storage';
import { GeminiAPIService } from '@/services/geminiAPI';
import { ItalianEntityExtractor } from '@/services/entityExtractor';
import { ItalianTripleExtractor } from '@/services/tripleExtractor';
import ItalianSemanticSearchService from '@/services/semanticSearch';

export interface ApplicationState {
  // API and Services
  geminiService: GeminiAPIService | null;
  entityExtractor: ItalianEntityExtractor | null;
  tripleExtractor: ItalianTripleExtractor | null;
  semanticSearchService: ItalianSemanticSearchService | null;
  isApiKeyValid: boolean;
  useSemanticEnhancement: boolean;

  // User preferences
  preferences: UserPreferences;

  // Current analysis
  currentText: string;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisError: string | null;

  // Results
  entities: ItalianEntity[];
  triples: SemanticTriple[];
  analytics: TripleAnalytics | null;
  extractionResult: EntityExtractionResult | null;
  tripleResult: TripleExtractionResult | null;

  // UI State
  selectedEntity: ItalianEntity | null;
  selectedTriple: SemanticTriple | null;
  activeView: 'input' | 'entities' | 'triples' | 'graph' | 'analytics';
  sidebarOpen: boolean;
  highlightMode: boolean;

  // Actions
  initializeServices: (apiKey: string) => Promise<boolean>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  analyzeText: (text: string) => Promise<void>;
  clearResults: () => void;
  selectEntity: (entity: ItalianEntity | null) => void;
  selectTriple: (triple: SemanticTriple | null) => void;
  setActiveView: (view: ApplicationState['activeView']) => void;
  toggleSidebar: () => void;
  toggleHighlightMode: () => void;
  setAnalysisError: (error: string | null) => void;
  applyTheme: () => void;
  toggleSemanticEnhancement: () => void;
}

const useApplicationStore = create<ApplicationState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      geminiService: null,
      entityExtractor: null,
      tripleExtractor: null,
      semanticSearchService: null,
      isApiKeyValid: false,
      useSemanticEnhancement: false,

      preferences: SecureStorage.getPreferences(),

      currentText: '',
      isAnalyzing: false,
      analysisProgress: 0,
      analysisError: null,

      entities: [],
      triples: [],
      analytics: null,
      extractionResult: null,
      tripleResult: null,

      selectedEntity: null,
      selectedTriple: null,
      activeView: 'input',
      sidebarOpen: true,
      highlightMode: false,

      // Actions
      initializeServices: async (apiKey: string) => {
        try {
          const geminiService = new GeminiAPIService(apiKey);

          // Validate API key
          const isValid = await geminiService.validateApiKey(apiKey);
          if (!isValid) {
            set({
              analysisError:
                'Invalid API key. Please check your Gemini API key.',
            });
            return false;
          }

          // Initialize semantic search service
          const semanticSearchService = new ItalianSemanticSearchService();

          try {
            await semanticSearchService.initialize(apiKey);
            console.log('Semantic search service initialized successfully');
          } catch (error) {
            console.warn(
              'Semantic search service initialization failed, using standard extraction:',
              error
            );
          }

          // Initialize extractors with optional semantic enhancement
          const entityExtractor = new ItalianEntityExtractor(
            geminiService,
            semanticSearchService
          );
          const tripleExtractor = new ItalianTripleExtractor(
            geminiService,
            semanticSearchService
          );

          set({
            geminiService,
            entityExtractor,
            tripleExtractor,
            semanticSearchService,
            isApiKeyValid: true,
            analysisError: null,
            useSemanticEnhancement: semanticSearchService.isReady(),
          });

          // Save API key securely
          SecureStorage.saveApiKey(apiKey);

          return true;
        } catch (error) {
          console.error('Failed to initialize services:', error);
          set({
            analysisError: 'Failed to initialize services. Please try again.',
            isApiKeyValid: false,
          });
          return false;
        }
      },

      updatePreferences: (newPreferences: Partial<UserPreferences>) => {
        const currentPreferences = get().preferences;
        const updatedPreferences = { ...currentPreferences, ...newPreferences };

        set({ preferences: updatedPreferences });
        SecureStorage.savePreferences(updatedPreferences);

        // Apply theme if theme preference changed
        if (newPreferences.theme !== undefined) {
          get().applyTheme();
        }
      },

      analyzeText: async (text: string) => {
        const { entityExtractor, tripleExtractor, preferences } = get();

        if (!entityExtractor || !tripleExtractor) {
          set({
            analysisError:
              'Services not initialized. Please configure your API key.',
          });
          return;
        }

        set({
          isAnalyzing: true,
          analysisProgress: 0,
          analysisError: null,
          currentText: text,
        });

        try {
          // Check cache first
          const cachedResult = SecureStorage.getCachedResult(text);
          if (cachedResult && preferences.enableCache) {
            set({
              entities: cachedResult.entities,
              triples: cachedResult.triples,
              isAnalyzing: false,
              analysisProgress: 100,
            });
            return;
          }

          // Extract entities
          set({ analysisProgress: 25 });
          const extractionResult = await entityExtractor.extractEntities(text);

          set({
            entities: extractionResult.entities,
            extractionResult,
            analysisProgress: 50,
          });

          // Extract triples
          set({ analysisProgress: 75 });
          const tripleResult = await tripleExtractor.extractTriples(
            text,
            extractionResult.entities
          );

          set({
            triples: tripleResult.triples,
            tripleResult,
            analysisProgress: 90,
          });

          // Generate analytics
          const analytics = tripleExtractor.generateAnalytics(
            tripleResult.triples
          );

          set({
            analytics,
            analysisProgress: 100,
            isAnalyzing: false,
          });

          // Cache results
          if (preferences.enableCache) {
            SecureStorage.cacheResult(
              text,
              extractionResult.entities,
              tripleResult.triples,
              extractionResult.confidence
            );
          }

          // Save to history
          if (preferences.autoSave) {
            SecureStorage.saveAnalysisHistory({
              textLength: text.length,
              entitiesCount: extractionResult.entities.length,
              triplesCount: tripleResult.triples.length,
              confidence: extractionResult.confidence,
              processingTime:
                extractionResult.processingTime + tripleResult.processingTime,
              title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            });
          }
        } catch (error) {
          console.error('Analysis failed:', error);
          set({
            analysisError:
              error instanceof Error
                ? error.message
                : 'Analysis failed. Please try again.',
            isAnalyzing: false,
            analysisProgress: 0,
          });
        }
      },

      clearResults: () => {
        set({
          entities: [],
          triples: [],
          analytics: null,
          extractionResult: null,
          tripleResult: null,
          selectedEntity: null,
          selectedTriple: null,
          currentText: '',
          analysisError: null,
          analysisProgress: 0,
        });
      },

      selectEntity: (entity: ItalianEntity | null) => {
        set({ selectedEntity: entity, selectedTriple: null });
      },

      selectTriple: (triple: SemanticTriple | null) => {
        set({ selectedTriple: triple, selectedEntity: null });
      },

      setActiveView: (view: ApplicationState['activeView']) => {
        set({ activeView: view });
      },

      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      toggleHighlightMode: () => {
        set(state => ({ highlightMode: !state.highlightMode }));
      },

      setAnalysisError: (error: string | null) => {
        set({ analysisError: error });
      },

      applyTheme: () => {
        const { preferences } = get();
        const isDark =
          preferences.theme === 'dark' ||
          (preferences.theme === 'auto' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleSemanticEnhancement: () => {
        const {
          entityExtractor,
          tripleExtractor,
          semanticSearchService,
          useSemanticEnhancement,
        } = get();

        if (entityExtractor && tripleExtractor && semanticSearchService) {
          const newState = !useSemanticEnhancement;
          entityExtractor.setSemanticEnhancement(newState);
          tripleExtractor.setSemanticEnhancement(newState);

          set({ useSemanticEnhancement: newState });

          console.log(
            `Semantic enhancement ${newState ? 'enabled' : 'disabled'}`
          );
        } else {
          console.warn(
            'Semantic enhancement not available - services not initialized'
          );
        }
      },
    })),
    {
      name: 'italian-triple-extractor-store',
    }
  )
);

// Auto-initialize services if API key exists
useApplicationStore.subscribe(
  state => state.isApiKeyValid,
  isValid => {
    if (!isValid) {
      const storedApiKey = SecureStorage.getApiKey();
      if (storedApiKey) {
        useApplicationStore.getState().initializeServices(storedApiKey);
      }
    }
  },
  { fireImmediately: true }
);

// Initialize theme on app load
useApplicationStore.subscribe(
  state => state.preferences,
  () => {
    useApplicationStore.getState().applyTheme();
  },
  { fireImmediately: true }
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { preferences, applyTheme } = useApplicationStore.getState();
      if (preferences.theme === 'auto') {
        applyTheme();
      }
    });
}

// Context for React components
const ApplicationContext = createContext<typeof useApplicationStore | null>(
  null
);

export const ApplicationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ApplicationContext.Provider value={useApplicationStore}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const store = useContext(ApplicationContext);
  if (!store) {
    throw new Error('useApplication must be used within ApplicationProvider');
  }
  return store();
};

export default useApplicationStore;
