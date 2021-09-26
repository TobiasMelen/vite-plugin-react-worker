# vite-plugin-react-worker

> :warning: This plugin hot patches functionality from `vite` and `@vitejs/plugin-react` and is bound to break with updates in either. If you experience developer environment issues, suspect and disable this plugin before raising upstream issues.

Plugin for [Vite](https://vitejs.dev) to enable react fast-refresh in web worker code. Developed for OffscreenCanvas support in [react-three-fiber](https://github.com/pmndrs/react-three-fiber). Experimental and unstable, don't rely on it working.

## Installation

```bash
#npm
npm install -D vite-plugin-react-worker

#yarn
yarn add --dev vite-plugin-react-worker
```

Add the plugin to Vite configuration in combination with `@vitejs/plugin-react`. Example version of `./vite.config.js`:

```js
import react from "@vitejs/plugin-react";
import reactWorker from "vite-plugin-react-worker";

export default {
  plugins: [react(), reactWorker()],
  //...other config.
};
```

The plugin has no configuration options.

## How

This plugin is a merge of two plugins.

- **reactWorkerPlugin** will import a fast refresh module to any worker file entry. It will also find any files processed by `@vitejs/react-plugin` and change global references in hot reload code from `window` to `globalThis`.
- **clientWorkerPlugin** will modify Vites client code to also support websocket listeners and in that case use simplified event handling that doesn't rely on window or document.

The two plugins can be imported separately:

```js
import {
  reactWorkerPlugin,
  clientWorkerPlugin,
} from "vite-plugin-react-worker";
```

## Caveats

Except the already mentioned issues with stability due to patching other code, note the following:

- Worker has to be created as `{type: "worker"}`. Vite seems to ensure this already.
- CSS imported in worker context and will fail the plugin. This means all css imports must be removed from worker code.
- Inline workers using `?worker&inline` are not supported.
