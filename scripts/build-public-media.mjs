#!/usr/bin/env node
/**
 * Build the media set that ships with the deployment.
 *
 * Earlier the portfolio served every image and clip from a public Vercel Blob
 * store. When that store is suspended (blocked billing, quota, abuse flag…) the
 * whole site 403s its media, so the hero carousel and every case study go
 * blank. Building the standardized set into `public/media` instead makes the
 * assets part of the deployment: no third-party origin, no CORS, no 403.
 *
 * What it does:
 *  1. Reads the standardized source set (default `cdn-assets/`, which mirrors
 *     the filenames referenced through `cdnAsset(...)`).
 *  2. Images: PNG/JPG/AVIF -> WebP, longest edge capped at 2000 px. WebP and
 *     animated GIF sources are copied untouched.
 *  3. Videos: MP4/MOV/WebM -> H.264 MP4, max width 1920, fast-start, no audio
 *     (every clip is muted in the UI). A `.webp` poster is captured at 1 s so
 *     `posterForVideoSource()` can paint a still while the clip buffers.
 *  4. Copies the bento derivatives already produced by `make-bento-media.mjs`
 *     when present.
 *  5. Rewrites `src/config/cdn-assets-map.json` so every `cdnAsset("…")` call
 *     resolves to `/media/…` on the same origin.
 *
 * Usage:
 *   node scripts/build-public-media.mjs
 *   node scripts/build-public-media.mjs --src ~/Documents/portfolio-assets
 *   node scripts/build-public-media.mjs --force
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

const DEFAULTS = {
  src: "cdn-assets",
  derivatives: "cdn-assets-optimized",
  out: "public/media",
  map: "src/config/cdn-assets-map.json",
  /** Longest edge for a bundled still. Case-study art never needs more. */
  maxImageEdge: 2000,
  imageQuality: 86,
  /** Display size of the largest hero; larger masters are downscaled. */
  maxVideoWidth: 1920,
  videoCrf: 26,
  videoPreset: "medium",
  posterAt: 1,
  posterWidth: 1280,
  posterQuality: 80,
};

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".avif"]);
const COPY_EXTENSIONS = new Set([".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".m4v"]);

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = (message) => console.log(`${C.cyan}[media]${C.reset} ${message}`);
const ok = (message) => console.log(`${C.green}[ ok  ]${C.reset} ${message}`);
const skip = (message) => console.log(`${C.yellow}[skip ]${C.reset} ${message}`);
const fail = (message) => console.error(`${C.red}[err  ]${C.reset} ${message}`);

function parseArgs(argv) {
  const args = { ...DEFAULTS, force: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") args.force = true;
    else if (arg === "--src") args.src = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--map") args.map = argv[++i];
    else if (arg === "--derivatives") args.derivatives = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/build-public-media.mjs [options]",
          "",
          "  --src <dir>          Standardized sources (default: cdn-assets)",
          "  --out <dir>          Public output folder (default: public/media)",
          "  --derivatives <dir>  Bento outputs (default: cdn-assets-optimized)",
          "  --map <file>         Generated asset map (default: src/config/cdn-assets-map.json)",
          "  --force              Rebuild even when the output is newer than the source",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: ROOT,
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim().split("\n").at(-1)}`));
    });
  });
}

async function isFresh(outputPath, sourcePath) {
  try {
    const [output, source] = await Promise.all([
      fs.stat(outputPath),
      fs.stat(sourcePath),
    ]);
    return output.mtimeMs >= source.mtimeMs;
  } catch {
    return false;
  }
}

async function buildImage(sourcePath, outputPath, args) {
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: args.maxImageEdge,
      height: args.maxImageEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: args.imageQuality, effort: 6 })
    .toFile(outputPath);
}

async function buildVideo(sourcePath, outputPath, args) {
  await run("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-vf",
    `scale=w='min(${args.maxVideoWidth},iw)':h=-2`,
    "-c:v",
    "libx264",
    "-preset",
    args.videoPreset,
    "-crf",
    String(args.videoCrf),
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function buildPoster(sourcePath, outputPath, args) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "media-poster-"));
  const framePath = path.join(tempDir, "frame.png");

  try {
    await run("ffmpeg", [
      "-y",
      "-ss",
      String(args.posterAt),
      "-i",
      sourcePath,
      "-frames:v",
      "1",
      framePath,
    ]);

    await sharp(framePath)
      .resize({ width: args.posterWidth, withoutEnlargement: true })
      .webp({ quality: args.posterQuality, effort: 5 })
      .toFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = path.resolve(ROOT, args.src);
  const outputDir = path.resolve(ROOT, args.out);
  const derivativesDir = path.resolve(ROOT, args.derivatives);
  const mapPath = path.resolve(ROOT, args.map);

  if (!existsSync(sourceDir)) {
    throw new Error(
      `Source folder not found: ${sourceDir}\n` +
        "Point --src at the standardized media set (the filenames used by cdnAsset()).",
    );
  }

  await fs.mkdir(outputDir, { recursive: true });

  const entries = (await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b));

  let written = 0;
  let copied = 0;
  let skipped = 0;

  for (const name of entries) {
    const extension = path.extname(name).toLowerCase();
    const baseName = path.basename(name, path.extname(name));
    const sourcePath = path.join(sourceDir, name);

    const isImage = IMAGE_EXTENSIONS.has(extension);
    const isCopy = COPY_EXTENSIONS.has(extension);
    const isVideo = VIDEO_EXTENSIONS.has(extension);

    if (!isImage && !isCopy && !isVideo) {
      log(`${name} — unsupported type, ignored`);
      continue;
    }

    const outputName = isImage
      ? `${baseName}.webp`
      : isVideo
        ? `${baseName}.mp4`
        : name;
    const outputPath = path.join(outputDir, outputName);

    if (!args.force && (await isFresh(outputPath, sourcePath))) {
      skipped += 1;
    } else {
      if (isImage) await buildImage(sourcePath, outputPath, args);
      else if (isCopy) await fs.copyFile(sourcePath, outputPath);
      else await buildVideo(sourcePath, outputPath, args);
      written += 1;
    }

    if (isVideo) {
      const posterPath = path.join(outputDir, `${baseName}.webp`);
      if (args.force || !(await isFresh(posterPath, sourcePath))) {
        await buildPoster(sourcePath, posterPath, args);
        written += 1;
      } else {
        skipped += 1;
      }
    }

    const outputStat = await fs.stat(outputPath);
    ok(`${outputName.padEnd(38)} ${fmtBytes(outputStat.size).padStart(9)}`);
  }

  if (existsSync(derivativesDir)) {
    const derivatives = (await fs.readdir(derivativesDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.startsWith("BENTO__"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const name of derivatives) {
      const sourcePath = path.join(derivativesDir, name);
      const outputPath = path.join(outputDir, name);

      if (!args.force && (await isFresh(outputPath, sourcePath))) {
        skipped += 1;
        continue;
      }

      await fs.copyFile(sourcePath, outputPath);
      copied += 1;
      ok(`${name.padEnd(38)} ${fmtBytes((await fs.stat(outputPath)).size).padStart(9)}  (bento)`);
    }
  } else {
    skip(`${path.relative(ROOT, derivativesDir)} not found — bento media untouched`);
  }

  const assets = {};
  for (const name of (await fs.readdir(outputDir)).sort((a, b) => a.localeCompare(b))) {
    if (name.startsWith(".")) continue;
    assets[name] = `/media/${name}`;
  }

  const map = {
    generatedAt: new Date().toISOString(),
    baseUrl: "",
    prefix: "media",
    assets,
  };

  await fs.writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`);

  const totalBytes = (await Promise.all(
    Object.keys(assets).map(async (name) => (await fs.stat(path.join(outputDir, name))).size),
  )).reduce((sum, bytes) => sum + bytes, 0);

  console.log("");
  log(
    `${Object.keys(assets).length} assets · ${fmtBytes(totalBytes)} · ` +
      `${written} built, ${copied} copied, ${skipped} up to date`,
  );
  log(`map: ${path.relative(ROOT, mapPath)}`);
}

main().catch((error) => {
  fail(error.stack ?? error.message);
  process.exit(1);
});
