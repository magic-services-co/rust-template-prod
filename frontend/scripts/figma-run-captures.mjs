/**
 * Sequential Figma code-to-canvas runs against local Next dev.
 *
 * Base URL: license checks use the HTTP Host header. Use the same host you
 * browse with (e.g. http://192.168.1.161:3000) via FIGMA_CAPTURE_BASE or
 * NEXT_PUBLIC_DOMAIN in frontend/.env.
 *
 * Figma classifies only localhost / 127.0.0.1 / *.local as "local". LAN IPs
 * (192.168.x.x, 10.x, etc.) are EXTERNAL: opening #figmacapture=... on those
 * URLs silently fails. For external hosts we inject capture.js via Playwright
 * and call window.figma.captureForDesign() (see Figma MCP code-to-canvas docs).
 *
 * For true localhost, you can set NEXT_PUBLIC_FIGMA_CAPTURE=1 and use the hash
 * flow; external flow does not require that flag.
 *
 * Usage: node scripts/figma-run-captures.mjs < jobs.json
 * jobs.json: [ { "path": "/", "captureId": "uuid" }, ... ]
 *
 * Env (optional):
 * - FIGMA_CAPTURE_GOTO_TIMEOUT_MS — default 60000
 * - FIGMA_CAPTURE_WAIT_UNTIL — "load" (default) or "domcontentloaded". Use "load" so
 *   Next.js/Tailwind stylesheets apply before capture; domcontentloaded often yields unstyled HTML in Figma.
 * - FIGMA_CAPTURE_PRE_CAPTURE_MS — ms to wait after injecting capture.js before submit (default 2500).
 * - FIGMA_CAPTURE_DESIGN_TIMEOUT_MS — max wait for figma.captureForDesign() (default 120000).
 *   Without this, a hung Figma submit can block page.evaluate indefinitely.
 * - FIGMA_CAPTURE_POST_OK_WAIT_MS — ms to wait after a successful submit (default 18000) so Figma can ingest.
 * - FIGMA_CAPTURE_SUMMARY_PATH — write JSON summary of ok/failed jobs (default: scripts/figma-capture-last-run.json).
 */

import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CAPTURE_JS_URL = "https://mcp.figma.com/mcp/html-to-design/capture.js";

function isTargetClosedError(err) {
  const msg = err?.message ?? String(err);
  return (
    msg.includes("Target page, context or browser has been closed") ||
    msg.includes("Browser has been closed") ||
    msg.includes("Context has been closed") ||
    msg.includes("Target closed")
  );
}

function readNextPublicDomainFromEnvFile() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key.trim() !== "NEXT_PUBLIC_DOMAIN") continue;
      let v = rest.join("=").trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return v.replace(/^https?:\/\//, "").replace(/\/$/, "") || null;
    }
  } catch {
    // no .env
  }
  return null;
}

function resolveCaptureBase() {
  const explicit = process.env.FIGMA_CAPTURE_BASE?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const fromEnv =
    process.env.NEXT_PUBLIC_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    readNextPublicDomainFromEnvFile();
  if (fromEnv) return `http://${fromEnv}`;

  console.error(
    "figma-run-captures: No FIGMA_CAPTURE_BASE or NEXT_PUBLIC_DOMAIN — using http://127.0.0.1:3000 (may show License required). Set FIGMA_CAPTURE_BASE to the URL you use in the browser (e.g. http://192.168.1.161:3000)."
  );
  return "http://127.0.0.1:3000";
}

/** Hosts Figma MCP treats as "local" (hash + in-page script). */
function captureHostIsLocal(hostname) {
  const h = String(hostname).toLowerCase().replace(/^\[|\]$/g, "");
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local")
  );
}

function hashFor(id) {
  const endpoint = `https://mcp.figma.com/mcp/capture/${id}/submit`;
  return (
    `#figmacapture=${id}` +
    `&figmaendpoint=${encodeURIComponent(endpoint)}` +
    "&figmadelay=3500"
  );
}

const base = resolveCaptureBase();
console.error(`figma-run-captures: base URL = ${base}`);

const input = readFileSync(0, "utf8");
const jobs = JSON.parse(input);
if (!Array.isArray(jobs) || jobs.length === 0) {
  console.error("stdin must be a JSON array of { path, captureId }");
  process.exit(1);
}

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
if (!executablePath) {
  console.error(
    "Set PLAYWRIGHT_CHROMIUM_PATH to your chrome-headless-shell binary (run: npx playwright install chromium)"
  );
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(base.startsWith("http") ? base : `http://${base}`);
} catch {
  console.error("figma-run-captures: invalid base URL");
  process.exit(1);
}
const useExternalCapture = !captureHostIsLocal(baseUrl.hostname);
if (useExternalCapture) {
  console.error(
    "figma-run-captures: using EXTERNAL capture (inject capture.js + captureForDesign) — required for LAN IPs."
  );
} else {
  console.error(
    "figma-run-captures: using LOCAL capture (URL hash). Ensure NEXT_PUBLIC_FIGMA_CAPTURE=1 in dev."
  );
}

const gotoTimeoutMs = Number(process.env.FIGMA_CAPTURE_GOTO_TIMEOUT_MS) || 60_000;
const captureDesignTimeoutMs =
  Number(process.env.FIGMA_CAPTURE_DESIGN_TIMEOUT_MS) || 120_000;
const postOkWaitMs =
  Number(process.env.FIGMA_CAPTURE_POST_OK_WAIT_MS) || 18_000;
const navigationWaitUntil =
  process.env.FIGMA_CAPTURE_WAIT_UNTIL === "domcontentloaded"
    ? "domcontentloaded"
    : "load";
const preCaptureMs =
  Number(process.env.FIGMA_CAPTURE_PRE_CAPTURE_MS) || 2500;
const summaryPath =
  process.env.FIGMA_CAPTURE_SUMMARY_PATH?.trim() ||
  join(__dirname, "figma-capture-last-run.json");

/** Fail fast if the dev server is not reachable (common when .env has a LAN IP but the script runs elsewhere). */
async function preflightBaseUrl(origin) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(`${origin}/`, {
      method: "GET",
      signal: ac.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!r.ok && r.status >= 500) {
      console.error(
        `figma-run-captures: preflight ${origin}/ returned HTTP ${r.status} — check Next dev server.`
      );
    }
  } catch (e) {
    clearTimeout(t);
    console.error(
      `figma-run-captures: cannot reach ${origin} (${e?.cause?.code || e?.name || "error"}). ` +
        `The script must run on a machine that can open this URL (same host as Next, or fix FIGMA_CAPTURE_BASE). ` +
        `If Next binds only to localhost, use http://127.0.0.1:3000 and align license/NEXT_PUBLIC_DOMAIN separately.`
    );
    process.exit(1);
  }
}

await preflightBaseUrl(baseUrl.origin);

const browser = await chromium.launch({
  executablePath,
  headless: true,
});
const context = await browser.newContext();
const page = await context.newPage();

if (useExternalCapture) {
  // Proxy only main documents through fetch(). A global **/* fetch stalls or hangs when many
  // assets, HMR, or unreachable subresources never satisfy waitUntil: "load".
  await page.route("**/*", async (route) => {
    const req = route.request();
    const isDoc =
      req.resourceType() === "document" || req.isNavigationRequest();
    if (!isDoc) {
      await route.continue();
      return;
    }
    try {
      const response = await route.fetch({ timeout: gotoTimeoutMs });
      const headers = { ...response.headers() };
      delete headers["content-security-policy"];
      delete headers["content-security-policy-report-only"];
      await route.fulfill({ response, headers });
    } catch (err) {
      console.error(
        `figma-run-captures: document fetch failed: ${req.url()} — ${err?.message || err}`
      );
      await route.abort("failed");
    }
  });
}

console.error(
  `figma-run-captures: navigation waitUntil=${navigationWaitUntil}, gotoTimeoutMs=${gotoTimeoutMs}, captureDesignTimeoutMs=${captureDesignTimeoutMs}, preCaptureMs=${preCaptureMs}`
);

const captureJsBody = useExternalCapture
  ? await (async () => {
      const r = await context.request.get(CAPTURE_JS_URL);
      if (!r.ok()) {
        console.error(
          `figma-run-captures: failed to fetch capture.js: ${r.status()}`
        );
        await browser.close();
        process.exit(1);
      }
      return await r.text();
    })()
  : null;

let exitCode = 0;
/** @type {{ path: string, captureId: string }[]} */
const okJobs = [];
/** @type {{ path: string, captureId: string, error: string }[]} */
const failedJobs = [];

try {
  for (let i = 0; i < jobs.length; i++) {
    const { path: p, captureId } = jobs[i];
    const pathNorm = p.startsWith("/") ? p : `/${p}`;
    const pathPart = pathNorm === "/" ? "" : pathNorm;
    const targetUrl = `${baseUrl.origin}${pathPart}`;

    console.error(`[${i + 1}/${jobs.length}] ${pathNorm} -> ${captureId}`);

    try {
      if (useExternalCapture) {
        console.error(`  -> goto ${targetUrl}`);
        await page.goto(targetUrl, {
          waitUntil: navigationWaitUntil,
          timeout: gotoTimeoutMs,
        });
        console.error(`  -> inject capture.js`);
        await page.evaluate(() => {
          document
            .querySelectorAll("script[data-figma-capture-inject]")
            .forEach((n) => n.remove());
        });
        await page.evaluate((scriptText) => {
          const el = document.createElement("script");
          el.setAttribute("data-figma-capture-inject", "1");
          el.textContent = scriptText;
          document.head.appendChild(el);
        }, captureJsBody);
        try {
          await page.evaluate(() =>
            document.fonts?.ready != null
              ? document.fonts.ready
              : Promise.resolve()
          );
        } catch {
          /* ignore */
        }
        await page.waitForTimeout(preCaptureMs);
        const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
        console.error(
          `  -> captureForDesign (hard timeout ${captureDesignTimeoutMs}ms)`
        );
        const capResult = await page.evaluate(
          async ({ captureId: id, endpoint: ep, timeoutMs }) => {
            if (!globalThis.figma?.captureForDesign) {
              return {
                ok: false,
                error:
                  "window.figma.captureForDesign not available after script inject",
              };
            }
            const hang = new Promise((_, reject) => {
              setTimeout(() => {
                reject(
                  new Error(
                    `captureForDesign hung past ${timeoutMs}ms (stale captureId, Figma/network, or CORS — mint a new ID via MCP and retry)`
                  )
                );
              }, timeoutMs);
            });
            try {
              const out = await Promise.race([
                globalThis.figma.captureForDesign({
                  captureId: id,
                  endpoint: ep,
                  selector: "body",
                }),
                hang,
              ]);
              return { ok: true, out };
            } catch (e) {
              return { ok: false, error: String(e?.message || e) };
            }
          },
          { captureId, endpoint, timeoutMs: captureDesignTimeoutMs }
        );
        if (!capResult.ok) {
          console.error(`figma-run-captures: capture failed: ${capResult.error}`);
          failedJobs.push({
            path: pathNorm,
            captureId,
            error: capResult.error,
          });
          exitCode = 1;
          await page.waitForTimeout(2000);
        } else {
          console.error(
            `  -> capture ok, waiting ${postOkWaitMs}ms for Figma ingest`
          );
          await page.waitForTimeout(postOkWaitMs);
          okJobs.push({ path: pathNorm, captureId });
        }
      } else {
        const url = `${targetUrl}${hashFor(captureId)}`;
        await page.goto(url, {
          waitUntil: navigationWaitUntil,
          timeout: gotoTimeoutMs,
        });
        await page.waitForTimeout(16000);
        okJobs.push({ path: pathNorm, captureId });
      }
    } catch (err) {
      if (isTargetClosedError(err)) {
        console.error(
          "\nfigma-run-captures: stopped (browser/page closed — e.g. Ctrl+C during capture)."
        );
        exitCode = 130;
        break;
      }
      const msg = err?.message || String(err);
      console.error(`figma-run-captures: job error (${pathNorm}): ${msg}`);
      failedJobs.push({ path: pathNorm, captureId, error: msg });
      exitCode = 1;
      try {
        await page.waitForTimeout(1500);
      } catch {
        /* page may be broken; continue best-effort */
      }
    }
  }
} catch (err) {
  console.error("figma-run-captures:", err?.message || err);
  exitCode = 1;
} finally {
  try {
    await browser.close();
  } catch {
    /* already closed */
  }
}

const summary = {
  at: new Date().toISOString(),
  base: baseUrl.origin,
  total: jobs.length,
  ok: okJobs.length,
  failed: failedJobs.length,
  okJobs,
  failedJobs,
};
try {
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.error(`figma-run-captures: summary -> ${summaryPath}`);
} catch (e) {
  console.error(`figma-run-captures: could not write summary: ${e?.message || e}`);
}

if (failedJobs.length > 0) {
  console.error(
    `\nfigma-run-captures: ${failedJobs.length} job(s) did not complete successfully — those screens will be missing or stale in Figma.`
  );
  console.error(
    "Common fixes: mint a fresh captureId per path (Figma MCP generate_figma_design), increase FIGMA_CAPTURE_DESIGN_TIMEOUT_MS, check network/VPN, and scroll the Figma file — new captures often land on a separate page/canvas."
  );
  for (const f of failedJobs) {
    console.error(`  FAILED  ${f.path}  (${f.captureId})  — ${f.error}`);
  }
} else if (exitCode === 0) {
  console.error(`All ${jobs.length} navigations completed successfully.`);
}

process.exit(exitCode);
