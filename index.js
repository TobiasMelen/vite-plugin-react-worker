import clientWorkerPlugin from "./src/clientWorkerPlugin";
import reactWorkerPlugin from "./src/reactWorkerPlugin";
export { clientWorkerPlugin, reactWorkerPlugin };
const pluginReactWorker = () => [clientWorkerPlugin, reactWorkerPlugin];
export default pluginReactWorker;
