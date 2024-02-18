# vite-plugin-react-worker

Last updated for Vite version **5.1.3**.

> :warning: **Any update to Vite is likely to break this plugin!** The plugin hot patches functionality from `vite` and `@vitejs/plugin-react` and is bound to break with updates in either. If you experience developer environment issues, suspect and disable this plugin before raising upstream issues.

Plugin for [Vite](https://vitejs.dev) to enable react fast-refresh in web worker code. Developed for OffscreenCanvas support in [react-three-fiber](https://github.com/pmndrs/react-three-fiber). 

This is experimental and unstable, don't rely on it working.

## Installation

```bash
#npm
npm install vite-plugin-react-worker -D

#yarn
yarn add vite-plugin-react-worker --dev 

#bun
bun add vite-plugin-react-worker --dev
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
- **clientWorkerPlugin** will modify Vites client code to be used by web workers and in that case use simplified HMR functionality.

## Caveats

Except the already mentioned issues with stability due to patching other code, note the following:

- CSS imported in worker context will fail the plugin. This means all css imports must be removed from worker code.
- No code in workers can rely on window or document
- Inline workers using `?worker&inline` are not supported.
