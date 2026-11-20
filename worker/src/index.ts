// amrith.co. The site is static assets; this Worker only runs for "/", /og.png and /og.mp4.
// /og.png and /og.mp4 return the card that matches Amsterdam right now: sun phase from the
// sun's altitude, weather from Open-Meteo (cached 15 minutes). Cards: images/og/<phase>-<weather>.

interface Env {
	ASSETS: Fetcher;
}

const LAT = 52.3676;
const LON = 4.9041;
const WEATHER_TTL = 900;

type Phase = "dawn" | "sunrise" | "day" | "sunset" | "dusk" | "night";
type Weather = "clear" | "partly" | "cloudy" | "rain" | "snow";

const rad = Math.PI / 180;

// Sun altitude (degrees) and whether it is before solar noon. Low-precision solar position, good to ~0.5°.
export function sun(date: Date, lat = LAT, lon = LON): { alt: number; rising: boolean } {
	const d = date.getTime() / 86400000 - 10957.5;
	const g = (357.529 + 0.98560028 * d) * rad;
	const q = 280.459 + 0.98564736 * d;
	const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
	const e = (23.439 - 0.00000036 * d) * rad;
	const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
	const dec = Math.asin(Math.sin(e) * Math.sin(L));
	const gmst = 280.46061837 + 360.98564736629 * d;
	let h = (((gmst + lon - ra) % 360) + 540) % 360 - 180; // hour angle, -180..180
	const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(h * rad)) / rad;
	return { alt, rising: h < 0 };
}

// Same bands as the sun-phase table in scene.js.
export function phaseFor(alt: number, rising: boolean): Phase {
	if (alt >= 6) return "day";
	if (alt >= -1) return rising ? "sunrise" : "sunset";
	if (alt >= -8) return rising ? "dawn" : "dusk";
	return "night";
}

// WMO weather codes, mapped as scene.js does.
export function weatherFor(code: number): Weather {
	if (code <= 0) return "clear";
	if (code <= 2) return "partly";
	if (code === 3 || code === 45 || code === 48) return "cloudy";
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
	return "cloudy";
}

async function weatherCode(ctx: ExecutionContext): Promise<number> {
	const key = new Request("https://amrith.co/__weather");
	const cache = caches.default;
	const hit = await cache.match(key);
	if (hit) return Number(await hit.text());
	try {
		const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=weather_code`, {
			signal: AbortSignal.timeout(2500),
		});
		const j = (await r.json()) as { current?: { weather_code?: number } };
		const code = j.current?.weather_code ?? 0;
		ctx.waitUntil(cache.put(key, new Response(String(code), { headers: { "Cache-Control": `max-age=${WEATHER_TTL}` } })));
		return code;
	} catch {
		return 0;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.hostname === "www.amrith.co") {
			url.hostname = "amrith.co";
			return Response.redirect(url.toString(), 301);
		}
		if (url.pathname === "/og.png" || url.pathname === "/og.mp4") {
			const ext = url.pathname.endsWith(".png") ? "png" : "mp4";
			const s = sun(new Date());
			const variant = `${phaseFor(s.alt, s.rising)}-${weatherFor(await weatherCode(ctx))}`;
			let asset = await env.ASSETS.fetch(new URL(`/images/og/${variant}.${ext}`, url));
			if (!asset.ok) asset = await env.ASSETS.fetch(new URL(`/og.${ext}`, url)); // static day-clear fallback
			const headers = new Headers(asset.headers);
			headers.set("Cache-Control", "public, max-age=900");
			headers.set("X-OG-Variant", variant);
			headers.set("Accept-Ranges", "bytes");
			// Static assets ignore Range, but Safari and iMessage need 206 responses to play video. Files are under 1 MB.
			const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") ?? "");
			if (ext === "mp4" && range && (range[1] || range[2])) {
				const buf = await asset.arrayBuffer();
				const size = buf.byteLength;
				let start = range[1] ? Number(range[1]) : size - Number(range[2]);
				let end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
				start = Math.max(0, start);
				if (start >= size || start > end) {
					headers.set("Content-Range", `bytes */${size}`);
					return new Response(null, { status: 416, headers });
				}
				headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
				headers.set("Content-Length", String(end - start + 1));
				return new Response(buf.slice(start, end + 1), { status: 206, headers });
			}
			return new Response(asset.body, { status: asset.status, headers });
		}
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
