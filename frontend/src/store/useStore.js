import { create } from 'zustand';

const THEME_STORAGE_KEY = 'studycoach.theme';

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const storage = window.localStorage;
  const valid =
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function';

  return valid ? storage : null;
}

function safeThemeFromStorage() {
  const storage = getStorage();
  if (!storage) {
    return 'light';
  }

  const saved = storage.getItem(THEME_STORAGE_KEY);
  return saved === 'dark' || saved === 'light' ? saved : 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}

function persistTheme(theme) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(THEME_STORAGE_KEY, theme);
}

const initialTheme = safeThemeFromStorage();
applyTheme(initialTheme);

const defaultState = {
  documents: [],
  currentDocument: null,
  quiz: { questions: [], currentIndex: 0, attempts: [], sessionComplete: false },
  flashcards: { dueCards: [], currentIndex: 0, sessionComplete: false },
  weakTopics: [],
  stats: {},
  ui: {
    loading: {},
    errors: {},
    toasts: [],
    offline: false,
    queuedActions: [],
    theme: initialTheme
  }
};

function nextToastId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export const useStore = create((set, get) => ({
  ...defaultState,

  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (currentDocument) => set({ currentDocument }),
  setQuiz: (quiz) => set({ quiz: { ...get().quiz, ...quiz } }),
  setFlashcards: (flashcards) => set({ flashcards: { ...get().flashcards, ...flashcards } }),
  setWeakTopics: (weakTopics) => set({ weakTopics }),
  setStats: (stats) => set({ stats }),

  setTheme: (theme) => {
    if (theme !== 'light' && theme !== 'dark') {
      return;
    }
    applyTheme(theme);
    persistTheme(theme);
    set((state) => ({
      ui: {
        ...state.ui,
        theme
      }
    }));
  },

  toggleTheme: () => {
    const current = get().ui.theme;
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    persistTheme(next);
    set((state) => ({
      ui: {
        ...state.ui,
        theme: next
      }
    }));
  },

  setLoading: (key, value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        loading: {
          ...state.ui.loading,
          [key]: value
        }
      }
    })),

  setError: (key, value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        errors: {
          ...state.ui.errors,
          [key]: value
        }
      }
    })),

  addToast: (toast) =>
    set((state) => ({
      ui: {
        ...state.ui,
        toasts: [...state.ui.toasts, { id: nextToastId(), ...toast }]
      }
    })),

  removeToast: (id) =>
    set((state) => ({
      ui: {
        ...state.ui,
        toasts: state.ui.toasts.filter((toast) => toast.id !== id)
      }
    })),

  markOffline: (offline) =>
    set((state) => ({
      ui: {
        ...state.ui,
        offline
      }
    })),

  enqueueAction: (action) =>
    set((state) => ({
      ui: {
        ...state.ui,
        queuedActions: [...state.ui.queuedActions, action]
      }
    })),

  clearQueuedActions: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        queuedActions: []
      }
    }))
}));
