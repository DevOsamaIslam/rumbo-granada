// Test setup file for Vitest
import "./rn-patch.cjs";
import { vi } from "vitest";
import { View, Text } from "react-native";

// Make View/Text available for mocks declared in this file.
global.View = View;
global.Text = Text;

// `__DEV__` is injected by Metro at build time; RN and Expo internals read it.
globalThis.__DEV__ = true;

// `react-native-paper` is a native-ish component library. Mocking it keeps unit
// tests free of theme/portal plumbing while preserving the component surface the
// app actually uses.
vi.mock("react-native-paper", () => {
  const React = require("react");
  const { Text: RNText } = require("react-native");

  // Mirrors React Native's rule that bare strings must live inside <Text>:
  // Paper components render their label children directly, so wrap them.
  const host = (name: string) => {
    const C = (props: any) => {
      const { children } = props ?? {};
      const content =
        typeof children === "string"
          ? React.createElement(RNText, null, children)
          : children;
      return React.createElement(name, props, content);
    };
    C.displayName = name;
    return C;
  };

  const mockTheme = {
    dark: false,
    roundness: 4,
    colors: {
      primary: "#6200EE",
      background: "#FFFFFF",
      surface: "#FFFFFF",
      error: "#B00020",
      onBackground: "#000000",
      onSurface: "#000000",
    },
  };

  return {
    Provider: ({ children }: any) => children,
    Portal: ({ children }: any) => children,
    useTheme: () => mockTheme,
    DefaultTheme: mockTheme,
    MD3LightTheme: mockTheme,
    MD3DarkTheme: mockTheme,
    configureFonts: (config: unknown) => config,
    ActivityIndicator: host("ActivityIndicator"),
    // React Native's Modal renders nothing when `visible` is false; mirror that so
    // visibility assertions behave like the real component.
    Modal: (props: any) =>
      props.visible === false
        ? null
        : React.createElement("Modal", props, props.children),
    Button: host("Button"),
    IconButton: host("IconButton"),
    Searchbar: host("Searchbar"),
    Snackbar: host("Snackbar"),
    TextInput: host("TextInput"),
    Title: host("Title"),
    Text: host("Text"),
    Card: host("Card"),
    Chip: host("Chip"),
    Divider: host("Divider"),
    FAB: host("FAB"),
    List: host("List"),
    ProgressBar: host("ProgressBar"),
    Surface: host("Surface"),
  };
});

// Mock MMKV
vi.mock("react-native-mmkv", () => {
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
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children, ...props }: any) =>
    React.createElement(View, props, children),
  Stack: ({ children }: any) => React.createElement(View, {}, children),
  Tabs: ({ children }: any) => React.createElement(View, {}, children),
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: vi.fn().mockResolvedValue("notification-id"),
  cancelScheduledNotificationAsync: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  addNotificationReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addNotificationResponseReceivedListener: vi
    .fn()
    .mockReturnValue({ remove: vi.fn() }),
}));

vi.mock("expo-task-manager", () => ({
  defineTask: vi.fn(),
  isTaskRegisteredAsync: vi.fn().mockResolvedValue(false),
  unregisterTaskAsync: vi.fn(),
}));

vi.mock("expo-background-fetch", () => ({
  registerTaskAsync: vi.fn(),
  unregisterTaskAsync: vi.fn(),
  setMinimumIntervalAsync: vi.fn(),
}));

// Expo native modules touch `globalThis.expo`, which only exists in a real
// build. Unit tests exercise the web/fetch code path instead.
vi.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: vi.fn().mockResolvedValue(""),
}));

vi.mock("expo-asset", () => ({
  Asset: {
    fromModule: vi.fn(),
  },
}));

vi.mock("@maplibre/maplibre-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    MapLibreGL: {
      setAccessToken: vi.fn(),
    },
    Map: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    Camera: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    Marker: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    RasterSource: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    GeoJSONSource: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    Layer: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    UserLocation: ({ ...props }: any) => React.createElement(View, props),
    Callout: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    ViewAnnotation: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn().mockImplementation(() => ({
    getQueryCache: () => ({ findAll: () => [] }),
    getMutationCache: () => ({ findAll: () => [] }),
    mount: vi.fn(),
    unmount: vi.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  }),
}));

vi.mock("zustand", () => ({
  create: (fn: any) => {
    const state = fn((newState: any) => newState);
    return {
      getState: () => state,
      setState: vi.fn((partial: any) =>
        Object.assign(
          state,
          typeof partial === "function" ? partial(state) : partial,
        ),
      ),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    };
  },
}));

global.__TEST__ = true;
