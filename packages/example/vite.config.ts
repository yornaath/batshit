import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      events: "rollup-plugin-node-polyfills/polyfills/events",
      // "@yornaath/batshit/*": "../packages/batshit/src/*",
      // "@yornaath/batshit-devtools/*": "../packages/devtools/src/*",
      // "@yornaath/batshit-devtools-react/*": "../packages/devtools-react/src/*",
    },
  },
});
