// Test-only React Native surface.
//
// Why: RN 0.88's entry (`react-native/index.js`) is Flow-typed (`import typeof * as
// ReactNativePublicAPI from './index.js.flow'`). Node 26's require(esm) support
// parses it as ESM and throws "SyntaxError: Unexpected token 'typeof'", so every
// suite touching React Native died before running a single test.
//
// `@testing-library/react-native` requires `react-native` from CJS, so this stub
// is CommonJS and installed via the Module._load patch in `setup.tsx`.
const React = require("react");

function host(name) {
  const C = (props) =>
    React.createElement(name, props, props && props.children);
  C.displayName = name;
  return C;
}

const View = host("View");
const Text = host("Text");

module.exports = {
  View,
  Text,
  Pressable: host("Pressable"),
  ScrollView: host("ScrollView"),
  // FlatList/SectionList need to actually render their data, otherwise list
  // screens render empty in tests.
  FlatList: (props) => {
    const data = props.data || [];
    const rendered = data.map((item, index) =>
      React.createElement(
        React.Fragment,
        { key: props.keyExtractor ? props.keyExtractor(item, index) : index },
        props.renderItem
          ? props.renderItem({ item, index, separators: {} })
          : null,
      ),
    );
    const header = props.ListHeaderComponent
      ? React.createElement(
          typeof props.ListHeaderComponent === "function"
            ? props.ListHeaderComponent
            : React.Fragment,
          null,
          typeof props.ListHeaderComponent === "function"
            ? null
            : props.ListHeaderComponent,
        )
      : null;
    const Empty = props.ListEmptyComponent;
    const empty =
      data.length === 0 && Empty
        ? React.createElement(
            typeof Empty === "function" ? Empty : React.Fragment,
            null,
            typeof Empty === "function" ? null : Empty,
          )
        : null;
    return React.createElement("FlatList", props, header, rendered, empty);
  },
  SectionList: (props) => {
    const sections = props.sections || [];
    const rendered = sections.map((section, index) =>
      React.createElement(
        React.Fragment,
        { key: index },
        props.renderSectionHeader
          ? props.renderSectionHeader({ section })
          : null,
        ...(section.data || []).map((item, i) =>
          props.renderItem
            ? props.renderItem({ item, index: i, section })
            : null,
        ),
      ),
    );
    return React.createElement("SectionList", props, rendered);
  },
  SafeAreaView: host("SafeAreaView"),
  TextInput: host("TextInput"),
  Image: host("Image"),
  ActivityIndicator: host("ActivityIndicator"),
  // React Native's Modal renders nothing when `visible` is false; mirror that so
  // visibility assertions behave like the real component.
  Modal: (props) =>
    props.visible === false
      ? null
      : React.createElement("Modal", props, props.children),
  Switch: host("Switch"),
  KeyboardAvoidingView: host("KeyboardAvoidingView"),
  RefreshControl: host("RefreshControl"),
  TouchableHighlight: host("TouchableHighlight"),
  TouchableOpacity: host("TouchableOpacity"),

  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    compose: (a, b) => [a, b],
    hairlineWidth: 1,
    absoluteFillObject: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },

  Platform: {
    OS: "ios",
    Version: 17,
    isPad: false,
    isTV: false,
    select: (spec) => (spec ? (spec.ios ?? spec.default) : undefined),
  },

  Dimensions: {
    get: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
  },
  useWindowDimensions: () => ({
    width: 390,
    height: 844,
    scale: 2,
    fontScale: 1,
  }),
  Appearance: {
    getColorScheme: () => "light",
    addChangeListener: () => ({ remove: () => {} }),
  },
  useColorScheme: () => "light",
  I18nManager: { isRTL: false, allowRTL: () => {}, forceRTL: () => {} },
  NativeModules: {},
  Linking: {
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(true),
  },
  Alert: { alert: () => {} },
  AppState: {
    currentState: "active",
    addEventListener: () => ({ remove: () => {} }),
  },

  Animated: {
    View: host("Animated.View"),
    Text: host("Animated.Text"),
    Value: class Value {
      constructor(value = 0) {
        this._value = value;
      }
      setValue(value) {
        this._value = value;
      }
      // Mirrors React Native's internal accessor so tests can assert the
      // current animated value without running the animation loop.
      __getValue() {
        return this._value;
      }
      addListener() {
        return { remove: () => {} };
      }
      removeListener() {}
      stopAnimation() {}
    },
    timing: () => ({ start: (cb) => cb && cb(), stop: () => {} }),
    sequence: (animations) => ({ start: () => {}, stop: () => {} }),
    loop: () => ({ start: () => {}, stop: () => {} }),
  },
};
