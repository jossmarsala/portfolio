#!/usr/bin/env node
/**
 * Phase 3 — temporary bulk upload script for the standardized CDN media set.
 *
 * What it does:
 *  1. Scans cdn-assets-optimized/ (skips _reports and dotfiles).
 *  2. Uploads every media file to Vercel Blob under a stable prefix.
 *  3. Writes src/config/cdn-assets-map.json:
 *       { "assets": { "MISU__mockup-poster.webp": "https://…" } }
 *  4. Writes cdn-assets-upload-report.json with sizes, MIME types and URLs.
 *
 * Usage:
 *   npm run upload:cdn -- --dry-run     # preview only, no uploads
 *   npm run upload:cdn                  # upload + write map
 *   npm run upload:cdn -- --prefix portfolio --concurrency 3
 *   npm run upload:cdn -- --merge       # keep entries already in the map
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local (or .env).
 * The token is passed explicitly so VERCEL_OIDC_TOKEN cannot take over.
 */

import { put } from "@vercel/blob";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const DEFAULTS = {
  src: "cdn-assets-optimized",
  prefix: "portfolio",
  map: "src/config/cdn-assets-map.json",
  report: "cdn-assets-upload-report.json",
  concurrency: 3,
  /** 7 days. Media names are stable, so this is a deliberate middle ground. */
  cacheControlMaxAge: 7 * 24 * 60 * 60,
};

const MULTIPART_THRESHOLD = 4.5 * 1024 * 1024;

const MIME_TYPES = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".json": "application/json",
};

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = (message) => console.log(`${C.cyan}[cdn]${C.reset} ${message}`);
const ok = (message) => console.log(`${C.green}[ok ]${C.reset} ${message}`);
const warn = (message) => console.log(`${C.yellow}[warn]${C.reset} ${message}`);
const fail = (message) => console.error(`${C.red}[err ]${C.reset} ${message}`);

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function parseArgs(argv) {
  const args = { ...DEFAULTS, dryRun: false, merge: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--merge") args.merge = true;
    else if (arg === "--src") args.src = argv[++i];
    else if (arg === "--prefix") args.prefix = argv[++i];
    else if (arg === "--map") args.map = argv[++i];
    else if (arg === "--report") args.report = argv[++i];
    else if (arg === "--concurrency") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 1 || value > 8) {
        throw new Error("--concurrency must be an integer between 1 and 8");
      }
      args.concurrency = value;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/upload-cdn-assets.mjs [options]",
          "",
          "  --dry-run              Print the upload plan without uploading",
          "  --merge                Keep assets already listed in the existing map",
          "  --src <dir>            Source folder (default: cdn-assets-optimized)",
          "  --prefix <path>        Blob pathname prefix (default: portfolio)",
          "  --map <file>           JSON map output (default: src/config/cdn-assets-map.json)",
          "  --report <file>        Upload report output (default: cdn-assets-upload-report.json)",
          "  --concurrency <1-8>    Parallel uploads (default: 3)",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  args.prefix = String(args.prefix ?? "").replace(/^\/+|\/+$/g, "");
  return args;
}

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(path.join(ROOT, file));
      return file;
    } catch {
      // Try the next file.
    }
  }
  return null;
}

async function listMediaFiles(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."))
    .filter((name) => MIME_TYPES[path.extname(name).toLowerCase()])
    .sort((a, b) => a.localeCompare(b));
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

async function uploadWithRetry(file, { token, prefix, cacheControlMaxAge }) {
  const buffer = await fs.readFile(file.absolutePath);
  const pathname = prefix ? `${prefix}/${file.name}` : file.name;

  const attempt = async (remaining) => {
    try {
      return await put(pathname, buffer, {
        access: "public",
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: file.contentType,
        cacheControlMaxAge,
        multipart: buffer.length > MULTIPART_THRESHOLD,
      });
    } catch (error) {
      if (remaining <= 1) throw error;
      warn(`${file.name}: ${error.message} — retrying (${remaining - 1} left)`);
      await new Promise((resolve) => setTimeout(resolve, (4 - remaining) * 1500));
      return attempt(remaining - 1);
    }
  };

  return { pathname, result: await attempt(3), bytes: buffer.length };
}

async function writeJsonAtomic(target, value) {
  const temp = `${target}.tmp-${process.pid}`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temp, target);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envFile = loadEnv();
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token && !args.dryRun) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Run `vercel env pull .env.local` or add it to .env.local.",
    );
  }

  // Force read-write-token auth. The SDK ignores `token` when BLOB_STORE_ID and
  // VERCEL_OIDC_TOKEN are both present; `vercel env pull` injects the OIDC token
  // locally, so remove both to keep this script deterministic.
  if (token) {
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
  }

  const sourceDir = path.resolve(ROOT, args.src);
  try {
    await fs.access(sourceDir);
  } catch {
    throw new Error(`Source folder not found: ${sourceDir}`);
  }

  const names = await listMediaFiles(sourceDir);
  if (names.length === 0) {
    throw new Error(`No media files found in ${sourceDir}`);
  }

  const files = await Promise.all(
    names.map(async (name) => {
      const absolutePath = path.join(sourceDir, name);
      const stat = await fs.stat(absolutePath);
      return {
        name,
        absolutePath,
        bytes: stat.size,
        contentType: MIME_TYPES[path.extname(name).toLowerCase()],
      };
    }),
  );

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);

  console.log("");
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Phase 3 — Upload CDN assets to Vercel Blob${C.reset}`);
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.dim}  source      : ${path.relative(ROOT, sourceDir)}${C.reset}`);
  console.log(`${C.dim}  prefix      : ${args.prefix || "(root)"}${C.reset}`);
  console.log(`${C.dim}  files       : ${files.length}${C.reset}`);
  console.log(`${C.dim}  size        : ${fmtBytes(totalBytes)}${C.reset}`);
  console.log(`${C.dim}  env file    : ${envFile ?? "process environment"}${C.reset}`);
  console.log(`${C.dim}  mode        : ${args.dryRun ? "dry run" : "upload"}${C.reset}`);
  console.log("");

  if (args.dryRun) {
    for (const [index, file] of files.entries()) {
      const pathname = args.prefix ? `${args.prefix}/${file.name}` : file.name;
      console.log(
        `${C.dim}[${String(index + 1).padStart(2, "0")}/${files.length}]${C.reset} ` +
          `${file.name.padEnd(42)} ${fmtBytes(file.bytes).padStart(10)}  → ${pathname}`,
      );
    }
    console.log("");
    ok("Dry run complete. Nothing was uploaded.");
    return;
  }

  const startedAt = Date.now();
  const uploaded = await runPool(files, args.concurrency, async (file, index) => {
    const { pathname, result, bytes } = await uploadWithRetry(file, {
      token,
      prefix: args.prefix,
      cacheControlMaxAge: args.cacheControlMaxAge,
    });

    ok(
      `[${String(index + 1).padStart(2, "0")}/${files.length}] ` +
        `${file.name.padEnd(42)} ${fmtBytes(bytes).padStart(10)}  ${result.url}`,
    );

    return {
      file: file.name,
      pathname,
      url: result.url,
      downloadUrl: result.downloadUrl,
      size: bytes,
      contentType: result.contentType,
      uploadedAt: new Date().toISOString(),
    };
  });

  const assets = Object.fromEntries(
    [...uploaded]
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((item) => [item.file, item.url]),
  );
  const baseUrl = new URL(uploaded[0].url).origin;
  const generatedAt = new Date().toISOString();

  const mapPath = path.resolve(ROOT, args.map);
  const reportPath = path.resolve(ROOT, args.report);

  // `--merge` preserves assets uploaded in earlier runs (e.g. the bento set)
  // instead of replacing the whole map with whatever is in the source folder.
  let previous = null;
  if (args.merge && existsSync(mapPath)) {
    previous = JSON.parse(await fs.readFile(mapPath, "utf8"));
  }

  const map = {
    generatedAt,
    baseUrl: previous?.baseUrl ?? baseUrl,
    prefix: args.prefix,
    assets: { ...(previous?.assets ?? {}), ...assets },
  };

  const report = {
    generatedAt,
    store: "josmarsala-media",
    baseUrl: map.baseUrl,
    prefix: args.prefix,
    cacheControlMaxAge: args.cacheControlMaxAge,
    summary: {
      files: uploaded.length,
      bytes: uploaded.reduce((sum, item) => sum + item.size, 0),
      elapsedMs: Date.now() - startedAt,
    },
    items: [...uploaded].sort((a, b) => a.file.localeCompare(b.file)),
  };

  await writeJsonAtomic(mapPath, map);
  await writeJsonAtomic(reportPath, report);

  console.log("");
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Phase 3 complete${C.reset}`);
  console.log(`  uploaded : ${uploaded.length} files (${fmtBytes(report.summary.bytes)})`);
  console.log(`  map      : ${path.relative(ROOT, mapPath)}`);
  console.log(`  report   : ${path.relative(ROOT, reportPath)}`);
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log("");
  console.log("Verify a few URLs in the browser, then continue to Phase 4.");
}

main().catch((error) => {
  fail(error.stack ?? error.message);
  process.exit(1);
});
