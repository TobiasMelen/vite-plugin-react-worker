//Noop definitions for window things required to be defined in vite/client top scope.
//document.querySelectorAll is noop polyfilled since vite client is using it everywhere 
const headerCode = `
const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;  
if(isWebWorker){
  globalThis.HTMLElement = class HTMLElement{};
  globalThis.customElements = false;
  const proxyCreator = (objectName) => new Proxy(
    {},
    {
      apply(target, prop){
        throw new Error(\`\${objectName}.\${prop}" was invoked from worker context.
window and document access does not exist in worker code. 
Ensure that your worker code does not import css.
Returning undefined value\`);
      },
      get(target, prop, receiver){
        if(prop === 'querySelectorAll'){
          return () => [];
        }
        return undefined;
      }
    }
  )
  globalThis.window = proxyCreator("window");
  globalThis.document = proxyCreator("document");
}
`;

//Find vite
const handleMessageRegex = /function handleMessage\(payload.*{/;

const webworkerMessageHandling = `
  if(isWebWorker){
    if(payload.type === "update"){
      payload.updates
        .filter(update => update.type === "js-update")
        .forEach(update => hmrClient.queueUpdate(update));
    }
    return;
  }
`

/**
 * Plugin to add basic worker support to Vites client code.
 * @returns {import("vite").Plugin}
 */
function webWorkerClient() {
  
  return {
    name: "webworker-client",
    transform(code, id) {
      //If this is not the vite client, do nothing
      if (!id.endsWith("vite/dist/client/client.mjs")) {
        return code;
      }

      //Add webworker case to message handling
      const handleMessageString = code.match(handleMessageRegex)[0];
      if(!handleMessageString){
          console.error(
          "vite-plugin-react-worker could not parse vite client. Plugin is inactive."
        );
        return code;
      }
      // console.log(`${handleMessageString}\n${webworkerMessageHandling}`)
      // const tempCode = code.replace(handleMessageString, `${handleMessageString}${webworkerMessageHandling}`)
      // console.log(tempCode);
      code = code.replace(handleMessageString, handleMessageString + webworkerMessageHandling)
      //Only show connecting console message from main client
      code = code.replace(
        `console.debug('[vite] connecting...')`,
        `!isWebWorker && console.debug('[vite] connecting...')`
      );
      //Return code wrapped by webworker definition header and footer rewiring.
      return headerCode + code;
    },
  };
}
module.exports = webWorkerClient;

