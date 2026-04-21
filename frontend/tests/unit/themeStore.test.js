import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadFreshStore() {
  vi.resetModules();
  return import('../../src/store/useStore.js');
}

function installStorageMock() {
  let memory = {};
  const storage = {
    getItem: (key) => (key in memory ? memory[key] : null),
    setItem: (key, value) => {
      memory[key] = String(value);
    },
    removeItem: (key) => {
      delete memory[key];
    },
    clear: () => {
      memory = {};
    }
  };

  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true
  });

  return storage;
}

describe('theme store', () => {
  let storage;

  beforeEach(() => {
    storage = installStorageMock();
    storage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('hydrates theme from localStorage', async () => {
    storage.setItem('studycoach.theme', 'dark');
    const { useStore } = await loadFreshStore();

    expect(useStore.getState().ui.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme persists and updates document theme', async () => {
    const { useStore } = await loadFreshStore();

    useStore.getState().setTheme('light');
    useStore.getState().toggleTheme();

    expect(useStore.getState().ui.theme).toBe('dark');
    expect(storage.getItem('studycoach.theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
