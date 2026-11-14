// Test-only shim: makes `require('react-native')` return the lightweight stub in
// `./rn.cjs` instead of RN 0.88's real entry point.
//
// Why this is needed: `react-native/index.js` contains Flow syntax
// (`import typeof * as ReactNativePublicAPI from './index.js.flow'`). Node 26
// loads it through require(esm) and throws
// `SyntaxError: Unexpected token 'typeof'`, which killed every suite before a
// single test ran. This file is registered first in `setupFiles` so the patch is
// in place before `@testing-library/react-native` is loaded.
const Module = require("node:module");
const path = require("node:path");

const STUB = path.join(__dirname, "rn.cjs");
const originalLoad = Module._load;

// `gtfs.ts` imports its CSV files as bundled assets (`require('.../routes.txt')`).
// Metro resolves those to asset IDs; Node would try to parse them as JavaScript.
// Tests read the same files through `fetch`, so a numeric placeholder is enough.
require.extensions[".txt"] = (module) => {
  module.exports = 1;
};

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "react-native") {
    return originalLoad.call(this, STUB, parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};
