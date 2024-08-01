import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    ssr: './lambda/index.ts',
    outDir: './build/lambda',
    sourcemap: process.env.NODE_ENV === 'production'
  },
  appType: 'custom',
  publicDir: false,
  ssr: {
    target: 'node',
    noExternal: true
  },
  plugins: [
    tsconfigPaths(),
  ],
});
