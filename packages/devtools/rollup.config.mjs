import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { pathToFileURL } from "url";
import { join } from "path";

const pkg = await import(pathToFileURL(join(process.cwd(), "package.json")).href, {
	with: { type: "json" },
});

export default {
	input: "src/index.ts",
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
