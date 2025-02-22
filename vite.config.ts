import { UserConfig, defineConfig } from "vite";
import path from "node:path";
import builtins from "builtin-modules";
import { viteStaticCopy } from "vite-plugin-static-copy";
export default defineConfig(async ({ mode }) => {
	const { resolve } = path;
	const prod = mode === "production";

	return {
		plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "./manifest.json",
            dest: ".",
          },
        ],
      }),
    ],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		build: {
			lib: {
				entry: resolve(__dirname, "src/main.ts"),
				name: "main",
				fileName: () => "main.js",
				formats: ["cjs"],
			},
			minify: prod,
			sourcemap: prod ? false : "inline",
			cssCodeSplit: false,
			emptyOutDir: false,
			outDir: "dist",
			rollupOptions: {
				input: {
					main: resolve(__dirname, "src/main.ts"),
				},
				output: {
					entryFileNames: "main.js",
					assetFileNames: "styles.css",
				},
				external: [
					"obsidian",
					"electron",
					"@codemirror/autocomplete",
					"@codemirror/collab",
					"@codemirror/commands",
					"@codemirror/language",
					"@codemirror/lint",
					"@codemirror/search",
					"@codemirror/state",
					"@codemirror/view",
					"@lezer/common",
					"@lezer/highlight",
					"@lezer/lr",
					...builtins,
				],
			},
		},
	} as UserConfig;
});
