// Copies the site from the repo root into worker/public, the Worker's asset directory.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
const out = path.resolve(import.meta.dirname, "../public");
const files = ["index.html", "scene.js", "llms.txt", "robots.txt", "sitemap.xml", "site.webmanifest", "og.png", "og.mp4", "images", "fonts"];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of files) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
fs.writeFileSync(path.join(out, "_headers"), "/images/*\n  Cache-Control: public, max-age=86400\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n");
if (fs.statSync(path.join(out, "index.html")).size < 1000) throw new Error("index.html looks empty");
console.log("staged", files.length, "entries into", out);
