const path = require("path");
const os = require("os");

//Path to client, implementation logic copied from vite.
const clientPath = require.resolve("vite/dist/client/client.mjs");
const normalizedClientPath = path.posix.normalize(
  os.platform() === "win32" ? clientPath.replace(/\\/g, "/") : clientPath
);

//Noop definitions for window things required to be defined in vite/client top scope.
const headerCode = `
const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;  
if(isWebWorker){
  globalThis.HTMLElement = class HTMLElement{};
  globalThis.customElements = false;
  const proxyCreator = (objectName) => new Proxy(
    {},
    {
      get(){ throw new Error(
\`Vite development client tried to access "\${objectName}" from worker context.
This is unsupported by vite-plugin-react-worker. 
Ensure that your worker code does not import css.
The stacktrace of this Error should also indicate its cause.\`
      )}
    }
  )
  globalThis.window = proxyCreator("window");
  globalThis.document = proxyCreator("document");
}
`;

const socketListener = "socketListener";
//If webworker, remove message handler and re-add a simplified one.
const footerCode = `
  if(isWebWorker){
    socket.removeEventListener("message", ${socketListener});
    const handleMessageForWorker = (payload) => {
      if(payload.type === "update"){
        payload.updates
          .filter(update => update.type === "js-update")
          .forEach(update => queueUpdate(fetchUpdate(update)));
      }
    };
    ${socketListener} = ({data}) => handleMessageForWorker(JSON.parse(data));
    socket.addEventListener('message', ${socketListener});
  }
`;

//The existing listener for websockets needs to be named so it can be removed.
//This regex does not handle changing syntax correctly and risks breaking with updates.
const onMessageRegex = new RegExp(
  String.raw`socket.addEventListener\('message',(.*?\})\)\;`,
  "s"
);

/**
 * Plugin to add basic worker support to Vites client code.
 * @returns {import("vite").Plugin}
 */
export default function webWorkerClient() {
  return {
    name: "webworker-client",
    transform(code, id) {
      if (id !== normalizedClientPath) {
        return code;
      }
      //Find and replace existing socket message listener with named one.
      //If a webworker loads client it needs to remove the listener and add it
      const [listenerCode, handlerCode] = code.match(onMessageRegex) ?? [];
      if (!listenerCode || !handlerCode) {
        console.error(
          "vite-plugin-react-worker could not parse vite client. Plugin is inactive."
        );
        return code;
      }
      code = code.replace(
        listenerCode,
        `let ${socketListener} = ${handlerCode};` +
          `socket.addEventListener('message', ${socketListener});`
      );
      //Only show connecting console message from main client
      code = code.replace(
        `console.log('[vite] connecting...')`,
        `!isWebWorker && console.log('[vite] connecting...')`
      );
      //Return code wrapped by webworker definition header and footer rewiring.
      return headerCode + code + footerCode;
    },
  };
}
