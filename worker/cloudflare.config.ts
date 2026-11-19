import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

// amrith.co on the "Amrith Domains" account (free Workers plan, shared 100k requests/day).
// Everything is a static asset (free, unlimited) except the paths below, which run the Worker:
// "/" for the www redirect, and /og.png + /og.mp4, which pick the card for Amsterdam's current sky.
export default defineConfig({
	worker: {
		name: "amrith",
		compatibilityDate: "2026-09-25",
		entrypoint,
		env: { ASSETS: bindings.assets() },
		assets: {
			notFoundHandling: "none",
			runWorkerFirst: ["/", "/og.png", "/og.mp4"],
		},
		domains: [],
		workersDev: true,
		previewUrls: false,
		observability: { enabled: true },
	},
});
