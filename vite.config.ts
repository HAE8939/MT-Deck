import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri expects a fixed dev port; keep it strict.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Rust build artifacts churn while cargo compiles — never watch them.
      ignored: ["**/src-tauri/target/**"],
    },
  },
  build: {
    target: "es2022",
  },
});
