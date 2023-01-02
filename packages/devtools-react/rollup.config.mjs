import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

const pkg = await import(`${process.cwd()}/package.json`, {
  assert: { type: "json" },
});

export default {
  input: "./src/index.tsx",
  external: [
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
  ],
  output: [
    {
      dir: "./dist",
      format: "esm",
      sourcemap: true,
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
      entryFileNames: "[name].mjs",
    },
    {
      dir: "./dist",
      format: "esm",
      sourcemap: true,
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
      entryFileNames: "[name].esm.js",
    },
    {
      dir: "./dist",
      format: "cjs",
      sourcemap: true,
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
      entryFileNames: "[name].js",
    },
  ],
  plugins: [typescript(), commonjs({ exclude: "node_modules" })],
};
