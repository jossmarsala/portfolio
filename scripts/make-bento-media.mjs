#!/usr/bin/env node
/**
 * Bento tile media — small, instant-loading derivatives for the index page.
 *
 * The index bentos render in cells that are at most ~450 CSS px wide, yet the
 * CDN hero masters are 1920×1080 H.264/VP9 files (one of them 14 MB). On a cold
 * load a tile therefore stayed black until megabytes arrived and the decoder
 * produced a frame.
 *
 * This script produces a dedicated, tiny set for the bento grids:
 *   - `BENTO__<PROJECT>.mp4`       720 px wide, CRF 30, 24 fps, no audio,
 *                                  +faststart (moov atom first, instant play)
 *   - `BENTO__<PROJECT>_poster.webp` representative frame, so the cell paints
 *                                  immediately while the video buffers
 *   - `BENTO__GYPSY.webp`          still image, downscaled from the 4501 px
 *                                  master to tile resolution
 *
 * Originals are never modified; output goes to `cdn-assets-optimized/` and is
 * uploaded with `npm run upload:cdn`.
 *
 * Usage:
 *   node scripts/make-bento-media.mjs
 *   node scripts/make-bento-media.mjs --src /path/to/portfolio-assets
 *   node scripts/make-bento-media.mjs --force
 *
 * Requires: ffmpeg/ffprobe on PATH and sharp (devDependency).
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const CONFIG = {
  /** Default longest edge of the derived video. Tiles are ~450 CSS px. */
  width: 720,
  crf: 30,
  fps: 24,
  /** Posters are captured from frames that read as intentional stills. */
  posterQuality: 80,
  /**
   * Source file → derived name. `posterAt` picks the poster frame: POSDATA
   * opens on black, so its still is taken once the CRT stack is lit.
   * `width` overrides the default where a tile is shown larger or cropped
   * (the tall VITALIA card shows a 9:16 slice of a 16:9 master).
   */
  videos: [
    {
      source: "VITALIA__hero-cover.mp4",
      name: "BENTO__VITALIA",
      posterAt: 1.2,
      width: 1440,
    },
    {
      source: "MISU__hero-cover.mp4",
      name: "BENTO__MISU",
      posterAt: 1.2,
      width: 960,
    },
    { source: "POSDATA__hero-video.mp4", name: "BENTO__POSDATA", posterAt: 1.2 },
    { source: "LILIUM__hero-cover.mp4", name: "BENTO__LILIUM", posterAt: 0.4 },
  ],
  images: [
    {
      source: "GYPSY_mockup-phone.webp",
      name: "BENTO__GYPSY.webp",
      /** Portrait tile height in CSS px (≈310) × 2 for retina. */
      resize: { height: 1200 },
      quality: 80,
    },
  ],
};

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { src: null, out: null, force: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--src") args.src = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/make-bento-media.mjs [options]",
          "",
          "  --src <dir>   Source media folder (default: portfolio-assets/)",
          "  --out <dir>   Output folder (default: cdn-assets-optimized/)",
          "  --force       Re-encode files that already exist",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

/** First existing folder wins: explicit flag, then the known working folders. */
function resolveSourceDir() {
  const candidates = [
    args.src,
    path.resolve(ROOT, "portfolio-assets"),
    path.resolve(ROOT, "cdn-assets"),
    path.resolve(ROOT, "..", "portfolio-assets"),
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));
  return found ? path.resolve(found) : path.resolve(ROOT, "portfolio-assets");
}

const SOURCE_DIR = resolveSourceDir();
const OUTPUT_DIR = path.resolve(ROOT, args.out ?? "cdn-assets-optimized");
const TMP_DIR = path.join(os.tmpdir(), `bento-media-${process.pid}`);

// ── Logging ───────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = (msg) => console.log(`${C.cyan}[bento]${C.reset} ${msg}`);
const ok = (msg) => console.log(`${C.green}[ok ]${C.reset} ${msg}`);
const skip = (msg) => console.log(`${C.yellow}[skip]${C.reset} ${msg}`);
const fail = (msg) => console.error(`${C.red}[err ]${C.reset} ${msg}`);

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

async function sizeOf(file) {
  const stat = await fs.stat(file);
  return stat.size;
}

// ── Process helper ────────────────────────────────────────────────────────────

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) =>
      reject(new Error(`${command} failed to start: ${error.message}`)),
    );
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const tail = stderr.trim().split("\n").slice(-8).join("\n");
        reject(new Error(`${command} exited with code ${code}\n${tail}`));
      }
    });
  });
}

// ── Encode ────────────────────────────────────────────────────────────────────

async function encodeVideo({ source, name, posterAt, width }) {
  const sourcePath = path.join(SOURCE_DIR, source);
  const videoPath = path.join(OUTPUT_DIR, `${name}.mp4`);
  const posterPath = path.join(OUTPUT_DIR, `${name}.webp`);
  const targetWidth = width ?? CONFIG.width;

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source video: ${sourcePath}`);
  }

  const haveBoth = existsSync(videoPath) && existsSync(posterPath);
  if (haveBoth && !args.force) {
    skip(`${name}.mp4 + poster already exist`);
    return;
  }

  log(`Encoding ${source} → ${name}.mp4`);

  await run("ffmpeg", [
    "-nostdin",
    "-y",
    "-i",
    sourcePath,
    "-vf",
    `scale=${targetWidth}:-2`,
    "-c:v",
    "libx264",
    "-crf",
    String(CONFIG.crf),
    "-preset",
    "slow",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(CONFIG.fps),
    "-movflags",
    "+faststart",
    "-map_metadata",
    "-1",
    "-an",
    "-loglevel",
    "error",
    videoPath,
  ]);

  const framePng = path.join(TMP_DIR, `${name}.png`);
  await run("ffmpeg", [
    "-nostdin",
    "-y",
    "-ss",
    String(posterAt),
    "-i",
    sourcePath,
    "-frames:v",
    "1",
    "-vf",
    `scale=${targetWidth}:-2`,
    "-loglevel",
    "error",
    framePng,
  ]);

  await sharp(framePng)
    .webp({ quality: CONFIG.posterQuality, effort: 6 })
    .toFile(posterPath);

  const sourceBytes = await sizeOf(sourcePath);
  const videoBytes = await sizeOf(videoPath);
  const posterBytes = await sizeOf(posterPath);

  ok(
    `  ${name}: ${fmtBytes(sourceBytes)} → ${fmtBytes(videoBytes)} video` +
      ` + ${fmtBytes(posterBytes)} poster`,
  );
}

async function encodeImage({ source, name, resize, quality }) {
  const sourcePath = path.join(SOURCE_DIR, source);
  const targetPath = path.join(OUTPUT_DIR, name);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source image: ${sourcePath}`);
  }

  if (existsSync(targetPath) && !args.force) {
    skip(`${name} already exists`);
    return;
  }

  log(`Resizing ${source} → ${name}`);

  await sharp(sourcePath)
    .resize({ ...resize, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(targetPath);

  const sourceBytes = await sizeOf(sourcePath);
  const targetBytes = await sizeOf(targetPath);

  ok(`  ${name}: ${fmtBytes(sourceBytes)} → ${fmtBytes(targetBytes)}`);
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`Source folder not found: ${SOURCE_DIR}`);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  console.log("");
  console.log(
    `${C.bold}══════════════════════════════════════════════════${C.reset}`,
  );
  console.log(`${C.bold}  Bento tile media — instant-load derivatives${C.reset}`);
  console.log(
    `${C.bold}══════════════════════════════════════════════════${C.reset}`,
  );
  console.log(`${C.dim}  source : ${path.relative(ROOT, SOURCE_DIR)}${C.reset}`);
  console.log(`${C.dim}  output : ${path.relative(ROOT, OUTPUT_DIR)}${C.reset}`);
  console.log("");

  const startedAt = Date.now();

  for (const video of CONFIG.videos) {
    await encodeVideo(video);
  }

  for (const image of CONFIG.images) {
    await encodeImage(image);
  }

  const generated = (await fs.readdir(OUTPUT_DIR)).filter(
    (name) => name.startsWith("BENTO__") && !name.startsWith("."),
  );

  let totalBytes = 0;
  for (const name of generated.sort()) {
    totalBytes += await sizeOf(path.join(OUTPUT_DIR, name));
  }

  console.log("");
  ok(
    `${generated.length} bento files — ${fmtBytes(totalBytes)} total — ` +
      `${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  );
  console.log(
    `${C.dim}  Next: npm run upload:cdn -- --merge${C.reset}`,
  );
  console.log("");
}

main()
  .catch((error) => {
    fail(error.stack ?? error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
  });
