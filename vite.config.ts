import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/space-worm/" : "/",
  server: {
    host: "127.0.0.1",
    port: 4173
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  }
});
