// Test setup file for Vitest
import '@testing-library/jest-native';
import { vi } from 'vitest';
import { View } from 'react-native';

// Make View globally available for mocks
global.View = View;

// Mock React Native Paper
vi.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, StyleSheet } = require('react-native');
  const originalModule = vi.importActual('react-native-paper');

  const mockTheme = {
    colors: { primary: '#6200EE', background: '#FFFFFF', surface: '#FFFFFF', error: '#B00020', onBackground: '#000000', onSurface: '#000000' },
    dark: false,
    roundness: 4,
  };

  return {
    ...originalModule,
    Provider: ({ children, theme = mockTheme }) => React.createElement(originalModule.Provider, { theme }, children),
    useTheme: () => mockTheme,
    DefaultTheme: mockTheme,
    Portal: ({ children }) => children,
  };
});

// Mock MMKV
vi.mock('react-native-mmkv', () => {
  const storage = new Map();
  return {
    createMMKV: vi.fn().mockImplementation(() => ({
      set: vi.fn((key: string, value: unknown) => storage.set(key, value)),
      getString: vi.fn((key: string) => storage.get(key) || undefined),
      getNumber: vi.fn((key: string) => storage.get(key) || undefined),
      getBoolean: vi.fn((key: string) => storage.get(key) || undefined),
      remove: vi.fn((key: string) => storage.delete(key)),
      clearAll: vi.fn(() => storage.clear()),
      getAllKeys: vi.fn(() => Array.from(storage.keys())),
      contains: vi.fn((key: string) => storage.has(key)),
    })),
  };
});

// Mock Expo modules
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children, ...props }: any) => React.createElement(View, props, children),
  Stack: ({ children }: any) => React.createElement(View, {}, children),
  Tabs: ({ children }: any) => React.createElement(View, {}, children),
}));

vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: vi.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  addNotificationReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addNotificationResponseReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
}));

vi.mock('expo-task-manager', () => ({
  defineTask: vi.fn(),
  isTaskRegisteredAsync: vi.fn().mockResolvedValue(false),
  unregisterTaskAsync: vi.fn(),
}));

vi.mock('expo-background-fetch', () => ({
  registerTaskAsync: vi.fn(),
  unregisterTaskAsync: vi.fn(),
  setMinimumIntervalAsync: vi.fn(),
}));

vi.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => React.createElement(View, props, children),
    Marker: ({ children, ...props }: any) => React.createElement(View, props, children),
    Callout: ({ children, ...props }: any) => React.createElement(View, props, children),
    Polyline: ({ ...props }: any) => React.createElement(View, props),
  };
});

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({
    getQueryCache: () => ({ findAll: () => [] }),
    getMutationCache: () => ({ findAll: () => [] }),
    mount: vi.fn(),
    unmount: vi.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn(), getQueryData: vi.fn() }),
}));

vi.mock('zustand', () => ({
  create: (fn: any) => {
    const state = fn((newState: any) => newState);
    return {
      getState: () => state,
      setState: vi.fn((partial: any) => Object.assign(state, typeof partial === 'function' ? partial(state) : partial)),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    };
  },
}));

global.__TEST__ = true;