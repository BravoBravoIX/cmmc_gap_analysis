// Global state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Framework, 
  Domain, 
  Session, 
  Answer, 
  Client, 
  AppConfig, 
  Question,
  NavigationState,
  LocalStorageKey 
} from './types';
import { 
  discoverFrameworks, 
  loadFramework, 
  loadDomains,
  getAllQuestions,
  calculateProgress,
  loadAppConfig 
} from './frameworkUtils';
import { handleAdaptiveLogic } from './adaptiveLogic';

interface AssessmentStore {
  // Current session data
  currentSession: Session | null;
  currentFramework: Framework | null;
  currentDomains: Domain[] | null;
  currentClient: Client | null;
  allQuestions: Question[];
  
  // Cached data
  frameworks: Framework[];
  appConfig: AppConfig | null;
  
  // Navigation state
  navigation: NavigationState;
  
  // UI state
  loading: boolean;
  error: string | null;
  unsavedChanges: boolean;
  
  // Actions - Data Loading
  loadFrameworks: () => Promise<void>;
  loadAppConfig: () => Promise<void>;
  setCurrentFramework: (frameworkId: string) => Promise<void>;
  setCurrentSession: (session: Session) => void;
  setCurrentClient: (client: Client) => void;
  
  // Actions - Session Management
  createSession: (clientId: string, frameworkId: string, mode: 'quick' | 'detailed') => Promise<Session>;
  loadSession: (sessionId: string) => Promise<void>;
  saveSession: () => Promise<void>;
  
  // Actions - Question Management
  setResponse: (questionId: string, answer: Answer) => void;
  skipQuestion: (questionId: string, reason: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (domainIndex: number, questionIndex: number) => void;
  
  // Actions - Navigation
  setNavigation: (nav: Partial<NavigationState>) => void;
  
  // Actions - Utility
  clearError: () => void;
  reset: () => void;
}

// Generate UUID helper
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Auto-save helper
function saveToLocalStorage(key: LocalStorageKey, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Load from localStorage helper
function loadFromLocalStorage(key: LocalStorageKey) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      currentFramework: null,
      currentDomains: null,
      currentClient: null,
      allQuestions: [],
      frameworks: [],
      appConfig: null,
      navigation: {
        currentDomain: 0,
        currentQuestion: 0,
        sidebarOpen: true,
        showProgress: true,
      },
      loading: false,
      error: null,
      unsavedChanges: false,
      
      // Load frameworks from discovery
      loadFrameworks: async () => {
        set({ loading: true, error: null });
        try {
          const frameworks = await discoverFrameworks();
          set({ frameworks, loading: false });
          
          // Cache frameworks
          saveToLocalStorage('frameworks', frameworks);
        } catch (error) {
          set({ 
            error: `Failed to load frameworks: ${error}`, 
            loading: false 
          });
        }
      },
      
      // Load app configuration
      loadAppConfig: async () => {
        try {
          const config = await loadAppConfig();
          set({ appConfig: config });
          saveToLocalStorage('appConfig', config);
        } catch (error) {
          console.error('Failed to load app config:', error);
        }
      },
      
      // Set current framework and load its domains
      setCurrentFramework: async (frameworkId: string) => {
        set({ loading: true, error: null });
        try {
          const framework = await loadFramework(frameworkId);
          if (!framework) {
            throw new Error(`Framework ${frameworkId} not found`);
          }
          
          const domains = await loadDomains(framework);
          const allQuestions = await getAllQuestions(framework);
          
          set({
            currentFramework: framework,
            currentDomains: domains,
            allQuestions,
            loading: false,
          });
        } catch (error) {
          set({ 
            error: `Failed to load framework: ${error}`, 
            loading: false 
          });
        }
      },
      
      // Set current session
      setCurrentSession: (session: Session) => {
        set({ 
          currentSession: session,
          navigation: {
            ...get().navigation,
            currentDomain: session.currentDomain,
            currentQuestion: session.currentQuestion,
          },
        });
      },
      
      // Set current client
      setCurrentClient: (client: Client) => {
        set({ currentClient: client });
      },
      
      // Create new assessment session
      createSession: async (clientId: string, frameworkId: string, mode: 'quick' | 'detailed') => {
        try {
          // Create session via API
          const response = await fetch('/api/assessments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId,
              frameworkId,
              mode
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }

          const session = await response.json();
          
          // Ensure framework is loaded
          const { currentFramework } = get();
          if (!currentFramework || currentFramework.id !== frameworkId) {
            await get().setCurrentFramework(frameworkId);
          }

          // Update session with proper progress calculation
          const updatedSession = {
            ...session,
            progress: {
              totalQuestions: get().allQuestions.length,
              answeredQuestions: 0,
              skippedQuestions: 0,
              percentage: 0,
            },
          };
          
          set({ 
            currentSession: updatedSession,
            navigation: { ...get().navigation, currentDomain: 0, currentQuestion: 0 },
            unsavedChanges: false, // Already saved via API
          });
          
          return updatedSession;
        } catch (error) {
          console.error('Failed to create session:', error);
          set({ error: `Failed to create assessment: ${error}` });
          throw error;
        }
      },
      
      // Load existing session
      loadSession: async (sessionId: string) => {
        set({ loading: true, error: null });
        try {
          // Load session via API
          const response = await fetch(`/api/assessments/${sessionId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Session ${sessionId} not found`);
            }
            throw new Error('Failed to load session');
          }

          const session = await response.json();
          
          // Load framework for this session
          await get().setCurrentFramework(session.frameworkId);
          
          set({ 
            currentSession: session,
            navigation: {
              ...get().navigation,
              currentDomain: session.currentDomain || 0,
              currentQuestion: session.currentQuestion || 0,
            },
            loading: false,
            unsavedChanges: false,
          });
        } catch (error) {
          console.error('Failed to load session:', error);
          set({ 
            error: `Failed to load session: ${error}`, 
            loading: false 
          });
        }
      },
      
      // Save current session
      saveSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        try {
          const updatedSession = {
            ...currentSession,
            updatedAt: new Date().toISOString(),
            progress: calculateProgress(
              get().allQuestions.length,
              currentSession.responses
            ),
          };

          // Save session via API
          const response = await fetch(`/api/assessments/${currentSession.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedSession),
          });

          if (!response.ok) {
            throw new Error('Failed to save session');
          }

          const savedSession = await response.json();
          
          set({ 
            currentSession: savedSession,
            unsavedChanges: false,
          });
        } catch (error) {
          console.error('Failed to save session:', error);
          // Don't set unsavedChanges to false if save failed
          set({ error: `Failed to save progress: ${error}` });
        }
      },
      
      // Set response and handle adaptive logic
      setResponse: (questionId: string, answer: Answer) => {
        const { currentSession, currentDomains, allQuestions } = get();
        if (!currentSession || !currentDomains) return;
        
        const question = allQuestions.find(q => q.id === questionId);
        if (!question) return;
        
        // Update responses
        const updatedResponses = {
          ...currentSession.responses,
          [questionId]: {
            ...answer,
            timestamp: new Date().toISOString(),
          },
        };
        
        // Handle adaptive logic
        const { updatedResponses: responsesWithLogic } = handleAdaptiveLogic(
          question,
          answer.answer,
          allQuestions,
          updatedResponses
        );
        
        // Update session
        const updatedSession = {
          ...currentSession,
          responses: responsesWithLogic,
          updatedAt: new Date().toISOString(),
        };
        
        set({ 
          currentSession: updatedSession,
          unsavedChanges: true,
        });
        
        // Auto-save individual response via API
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/assessments/${currentSession.id}/response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                questionId,
                answer: responsesWithLogic[questionId]
              }),
            });

            if (response.ok) {
              const result = await response.json();
              // Update progress from server response if provided
              if (result.progress) {
                set({
                  currentSession: {
                    ...get().currentSession!,
                    progress: result.progress
                  },
                  unsavedChanges: false,
                });
              } else {
                set({ unsavedChanges: false });
              }
            }
          } catch (error) {
            console.error('Failed to save response:', error);
          }
        }, 1000);
      },
      
      // Skip question
      skipQuestion: (questionId: string, reason: string) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const skippedAnswer: Answer = {
          answer: 'skipped',
          skipReason: reason,
          autoSkipped: true,
          timestamp: new Date().toISOString(),
          controlId: questionId,
          questionId,
        };
        
        get().setResponse(questionId, skippedAnswer);
      },
      
      // Navigate to next question
      nextQuestion: () => {
        const { currentSession, currentDomains, navigation } = get();
        if (!currentSession || !currentDomains) return;
        
        const currentDomain = currentDomains[navigation.currentDomain];
        if (!currentDomain || !currentDomain.questions) return;
        
        let { currentDomain: domainIndex, currentQuestion: questionIndex } = navigation;
        
        // Move to next question
        if (questionIndex < currentDomain.questions.length - 1) {
          questionIndex++;
        } else if (domainIndex < currentDomains.length - 1) {
          // Move to next domain
          domainIndex++;
          questionIndex = 0;
        } else {
          // Assessment complete
          const completedSession = {
            ...currentSession,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            currentDomain: domainIndex,
            currentQuestion: questionIndex,
          };
          set({ currentSession: completedSession });
          get().saveSession();
          return;
        }
        
        // Update navigation
        const updatedSession = {
          ...currentSession,
          currentDomain: domainIndex,
          currentQuestion: questionIndex,
        };
        
        set({
          currentSession: updatedSession,
          navigation: {
            ...navigation,
            currentDomain: domainIndex,
            currentQuestion: questionIndex,
          },
          unsavedChanges: true,
        });
      },
      
      // Navigate to previous question
      previousQuestion: () => {
        const { currentSession, currentDomains, navigation } = get();
        if (!currentSession || !currentDomains) return;
        
        let { currentDomain: domainIndex, currentQuestion: questionIndex } = navigation;
        
        // Move to previous question
        if (questionIndex > 0) {
          questionIndex--;
        } else if (domainIndex > 0) {
          // Move to previous domain
          domainIndex--;
          const previousDomain = currentDomains[domainIndex];
          questionIndex = previousDomain.questions ? previousDomain.questions.length - 1 : 0;
        }
        
        // Update navigation
        const updatedSession = {
          ...currentSession,
          currentDomain: domainIndex,
          currentQuestion: questionIndex,
        };
        
        set({
          currentSession: updatedSession,
          navigation: {
            ...navigation,
            currentDomain: domainIndex,
            currentQuestion: questionIndex,
          },
          unsavedChanges: true,
        });
      },
      
      // Go to specific question
      goToQuestion: (domainIndex: number, questionIndex: number) => {
        const { currentSession, navigation } = get();
        if (!currentSession) return;
        
        const updatedSession = {
          ...currentSession,
          currentDomain: domainIndex,
          currentQuestion: questionIndex,
        };
        
        set({
          currentSession: updatedSession,
          navigation: {
            ...navigation,
            currentDomain: domainIndex,
            currentQuestion: questionIndex,
          },
          unsavedChanges: true,
        });
      },
      
      // Set navigation state
      setNavigation: (nav: Partial<NavigationState>) => {
        set({
          navigation: {
            ...get().navigation,
            ...nav,
          },
        });
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Reset store
      reset: () => {
        set({
          currentSession: null,
          currentFramework: null,
          currentDomains: null,
          currentClient: null,
          allQuestions: [],
          navigation: {
            currentDomain: 0,
            currentQuestion: 0,
            sidebarOpen: true,
            showProgress: true,
          },
          loading: false,
          error: null,
          unsavedChanges: false,
        });
      },
    }),
    {
      name: 'cmmc-assessment-store',
      partialize: (state) => ({
        // Only persist essential data, not heavy cached data
        frameworks: state.frameworks,
        appConfig: state.appConfig,
        navigation: state.navigation,
      }),
    }
  )
);

// Auto-save utility - to be used in React components
export const createAutoSaveHook = () => {
  return function useAutoSave() {
    const { unsavedChanges, saveSession } = useAssessmentStore();
    
    // This will be implemented in React components
    // Left as template for now
  };
};