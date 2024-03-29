const fastRefreshGlobals = [
  "$RefreshReg$",
  "$RefreshSig$",
  "__vite_plugin_react_timeout",
  "__vite_plugin_react_preamble_installed__",
];

const preamblePath = "webworker-react/preamble";
const preambleCode = `
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(globalThis)
globalThis.$RefreshReg$ = () => {}
globalThis.$RefreshSig$ = () => (type) => type
globalThis.__vite_plugin_react_preamble_installed__ = true
`;

/** @param {string} val  @returns {string} */
function escapeRegex(val) {
  return val.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Plugin to modify output of @vitejs/react-plugin.
 * It changes all window references to globalThis and adds fast-refresh preamble to worker entry files.
 * @returns {import("vite").Plugin}
 */
function webWorkerReact() {
  let isServe = false;
  return {
    name: "webworker-react",
    enforce: "post",
    configResolved(config) {
      isServe = config.command === "serve";
    },
    resolveId(id) {
      //Resolve virtual preamble module
      if (id == preamblePath) {
        return preamblePath;
      }
    },
    load(id) {
      //Load virtual preamble module
      if (id === preamblePath) {
        return preambleCode;
      }
    },
    transform(code, id) {
      //Plugin can only be run in serve mode.
      if (!isServe) {
        return;
      }
      //Heuristic to check if code has been modified by react plugin
      const isReactCode = code.includes(
        "!window.__vite_plugin_react_preamble_installed__"
      );
      let formattedCode = isReactCode
        //Replace all reference to window with globalThis
        ? fastRefreshGlobals.reduce(
            (acc, global) =>
              acc.replace(
                new RegExp(`window.${escapeRegex(global)}`, "g"),
                `globalThis.${global}`
              ),
            code
          )
          //Also replace existing webworker check in file, which would disable fast refresh.
          .replace(/const inWebWorker = .*;/, `const inWebWorker = false;`)
        : code;

      //If this is a worker entry: import fast-refresh preamble as well.
      const isWorkerEntry =
        id.includes("?worker_file") ||
        id.endsWith("?type=module&worker_url_file");

      return isWorkerEntry
        ? `import "${preamblePath}";${formattedCode}`
        : formattedCode;
    },
  };
}
module.exports = webWorkerReact;
