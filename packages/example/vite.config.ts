import { defineConfig } from "vite";
import * as path from "path";
import react from "@vitejs/plugin-react";
console.log(path.resolve(process.cwd(), "../batshit/src/index.ts"));
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      events: "rollup-plugin-node-polyfills/polyfills/events",
      "@yornaath/batshit/*": path.resolve(process.cwd(), "../batshit/src/*"),
      "@yornaath/batshit-devtools/*": path.resolve(
        process.cwd(),
        "../devtools/src/*"
      ),
      "@yornaath/batshit-devtools-react/*": path.resolve(
        process.cwd(),
        "../devtools-react/src/*"
      ),
      "@yornaath/batshit": path.resolve(
        process.cwd(),
        "../batshit/src/index.ts"
      ),
      "@yornaath/batshit-devtools": path.resolve(
        process.cwd(),
        "../devtools/src/index.ts"
      ),
      "@yornaath/batshit-devtools-react": path.resolve(
        process.cwd(),
        "../devtools-react/src/index.tsx"
      ),
    },
  },
});
