// Test setup file for Vitest
import "./rn-patch.cjs";
import { vi } from "vitest";
import { View, Text } from "react-native";

// expo-localization is a native module; stub it with a Spanish device so the
// language detection (used by `src/i18n.ts` and the settings store) is
// deterministic in tests — matching the Spanish UI the tests were written
// against. `src/i18n.test.ts` overrides the return value to exercise the
// other language branches. `vi.hoisted` is required because `vi.mock`
// factories run before top-level `const` declarations.
const { getLocalesMock } = vi.hoisted(() => ({
  getLocalesMock: vi.fn(() => [{ languageCode: "es", regionCode: "ES" }]),
}));
vi.mock("expo-localization", () => ({
  getLocales: getLocalesMock,
  getCalendars: () => [],
}));

// Initialize i18n for components using `useTranslation`. Tests were written
// against the original Spanish UI, so force Spanish here (the app default at
// first launch before the user picks a language).
import i18n from "@/i18n";
i18n.changeLanguage("es");

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
    Switch: host("Switch"),
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
  router: { navigate: vi.fn(), push: vi.fn(), back: vi.fn() },
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
    Camera: ({ children, ...props }: any) => {
      // Tests (e.g. MapView settings integration) assert on the camera props
      // to verify follow-mode behaviour; the log is opt-in, read via the
      // `__MAP_CAMERA_PROPS__` global.
      const log = ((globalThis as any).__MAP_CAMERA_PROPS__ ??= []);
      log.push(props);
      return React.createElement(View, props, children);
    },
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

// Mock Expo notifications (native module, not available in the Node test env).
vi.mock("expo-notifications", () => ({
  __esModule: true,
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: vi.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: vi.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: vi.fn().mockResolvedValue(undefined),
  setNotificationCategoryAsync: vi.fn().mockResolvedValue(undefined),
  getNotificationCategoriesAsync: vi.fn().mockResolvedValue([]),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(undefined),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  addNotificationResponseReceivedListener: vi
    .fn()
    .mockReturnValue({ remove: vi.fn() }),
  NotificationPermission: { GRANTED: 'granted' },
  AndroidImportance: { HIGH: 'high', DEFAULT: 'default' },
}));

// `@expo/vector-icons` loads native icon fonts. Render every icon as plain
// text in the Node test env so components using icons mount cleanly.
vi.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text: RNText } = require("react-native");
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(RNText, props),
  };
});

// expo-constants exposes the app manifest; the settings footer reads the
// version from it. Stub a stable value for the Node test env.
vi.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" }, nativeAppVersion: "1.0.0" },
}));

// Mock expo-haptics (native module, not available in the Node test env).
vi.mock("expo-haptics", () => ({
  __esModule: true,
  impactAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackStyle: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

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

vi.mock("zustand", () => {
  // Store for created stores, keyed by a unique id
  const stores = new Map<string, AnyObject>();

  // Generate a unique key for each store creation
  const generateKey = (fn: any) => {
    // Use a combination of approach: try toString, then random
    try {
      return (fn?.toString?.() || 'zustand-store') + Math.random().toString(36).slice(2);
    } catch {
      return 'zustand-store-' + Math.random().toString(36).slice(2);
    }
  };

  return {
    create: (fn: any) => {
      const key = generateKey(fn);
      // If store already exists, return it
      if (stores.has(key)) {
        return stores.get(key);
      }
      let state: AnyObject = {};
      // Call the factory function to create initial state
      try {
        if (fn) {
          state = fn((newState: AnyObject) => {
            state = { ...state, ...newState } as AnyObject;
          });
        }
      } catch (e) {
        // Fallback: create minimal state
        state = {};
      }
      const store = {
        getState: () => state,
        setState: vi.fn((partial: AnyObject) => {
          if (typeof partial === 'function') {
            const newState = partial(state as any);
            state = { ...state, ...(newState || {}) } as AnyObject;
          } else {
            state = { ...state, ...partial } as AnyObject;
          }
        }),
        subscribe: vi.fn(),
        destroy: vi.fn(),
      };
      stores.set(key, store);
      return store;
    },
  };
});

global.__TEST__ = true;
