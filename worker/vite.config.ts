import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// public/ is staged from the repo root by scripts/stage.mjs (the site itself stays at the root for GitHub Pages).
export default defineConfig({ plugins: [cloudflare()] });
