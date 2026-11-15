#!/usr/bin/env node
/**
 * Phase 1 — near-lossless media optimisation for the standardised CDN set.
 *
 * Images : PNG/GIF/WebP -> WebP (dimensions preserved)
 * Videos : MP4/MOV      -> WebM (VP9, dimensions + frame rate preserved)
 *
 * Design rules:
 *  - Never upscale and never resize. Resolution is data; we do not throw it away.
 *  - Images must pass a measured quality gate (PSNR >= 42 dB, SSIM >= 0.995)
 *    unless the encode is mathematically lossless.
 *  - Videos must pass SSIM >= 0.985 against the source.
 *  - A conversion is only accepted when the output is at least 2% smaller.
 *  - Otherwise the original file is copied forward unchanged, so the output
 *    folder is always a complete, uploadable set.
 *  - Nothing in the source folder is modified or deleted.
 *
 * Usage:
 *   node scripts/optimize-cdn-assets.mjs
 *   node scripts/optimize-cdn-assets.mjs --src cdn-assets --out cdn-assets-optimized
 *   node scripts/optimize-cdn-assets.mjs --force
 *
 * Requires: sharp (devDependency) and ffmpeg/ffprobe on PATH.
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
  image: {
    /** Lossless for assets at or below this size; near-lossless above it. */
    losslessThresholdBytes: 1 * 1024 * 1024,
    /** Candidate quality ladder, highest quality first. */
    qualities: [97, 95, 92],
    /** Minimum measured quality for a lossy WebP. */
    minPsnr: 44,
    minSsim: 0.995,
    /** Never accept an encode that saves less than this. */
    minSavingRatio: 0.02,
    effort: 6,
  },
  video: {
    /** VP9 CRF 18 is visually transparent for this material. */
    crf: 18,
    retryCrf: 14,
    /**
     * Median-based gates. Mean SSIM collapses at hard cuts because one frame is
     * compared against the next scene; the median reflects what viewers see.
     */
    minMedianSsim: 0.995,
    minMedianPsnr: 45,
    minMeanSsim: 0.975,
    minSavingRatio: 0.02,
    cpuUsed: 2,
    tileColumns: 2,
  },
  imageExtensions: new Set([".png", ".webp", ".gif", ".jpg", ".jpeg", ".avif"]),
  videoExtensions: new Set([".mp4", ".mov", ".webm", ".m4v"]),
  /** Extensions removed for the same basename when regenerating the output set. */
  staleExtensions: [".webp", ".png", ".gif", ".jpg", ".jpeg", ".avif", ".mp4", ".mov", ".webm", ".m4v"],
};

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { src: null, out: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--src") args.src = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/optimize-cdn-assets.mjs [--src <dir>] [--out <dir>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const SOURCE_DIR = path.resolve(
  ROOT,
  args.src ?? (existsSync(path.resolve(ROOT, "cdn-assets")) ? "cdn-assets" : "src/cdn-assets"),
);
const OUTPUT_DIR = path.resolve(ROOT, args.out ?? "cdn-assets-optimized");
const REPORT_PATH = path.join(OUTPUT_DIR, "_optimization-report.json");

function fsExists(absolutePath) {
  return existsSync(absolutePath);
}

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

const log = (msg) => console.log(`${C.cyan}[cdn]${C.reset} ${msg}`);
const ok = (msg) => console.log(`${C.green}[ok ]${C.reset} ${msg}`);
const skip = (msg) => console.log(`${C.yellow}[skip]${C.reset} ${msg}`);
const fail = (msg) => console.error(`${C.red}[err ]${C.reset} ${msg}`);

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function pct(value) {
  return `${(value * 100).toFixed(0)}%`;
}

// ── Process helpers ───────────────────────────────────────────────────────────

function run(command, commandArgs, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: ROOT,
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (!capture) process.stderr.write(chunk);
    });

    child.on("error", (error) => {
      reject(new Error(`${command} failed to start: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else {
        const tail = stderr.trim().split("\n").slice(-8).join("\n");
        reject(new Error(`${command} exited with code ${code}\n${tail}`));
      }
    });
  });
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function writeAtomic(target, data) {
  const temp = `${target}.tmp-${process.pid}`;
  await fs.writeFile(temp, data);
  await fs.rename(temp, target);
}

// ── Quality metrics ───────────────────────────────────────────────────────────

/** Full-resolution RGBA PSNR. Returns Infinity when the bytes are identical. */
function psnrFromBuffers(a, b) {
  const length = Math.min(a.length, b.length);
  if (length === 0) return Infinity;

  let mse = 0;
  for (let i = 0; i < length; i += 1) {
    const delta = a[i] - b[i];
    mse += delta * delta;
  }
  mse /= length;

  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
}

/** Global SSIM on a small grayscale proxy — enough to catch structural damage. */
function ssimFromBuffers(a, b) {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 1;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < length; i += 1) {
    sumA += a[i];
    sumB += b[i];
  }

  const meanA = sumA / length;
  const meanB = sumB / length;

  let varianceA = 0;
  let varianceB = 0;
  let covariance = 0;

  for (let i = 0; i < length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    varianceA += da * da;
    varianceB += db * db;
    covariance += da * db;
  }

  varianceA /= length;
  varianceB /= length;
  covariance /= length;

  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;

  return (
    ((2 * meanA * meanB + c1) * (2 * covariance + c2)) /
    ((meanA * meanA + meanB * meanB + c1) * (varianceA + varianceB + c2))
  );
}

// ── Image pipeline ────────────────────────────────────────────────────────────

async function encodeWebp(input, options) {
  return sharp(input, { animated: true })
    .webp({
      effort: CONFIG.image.effort,
      smartSubsample: true,
      alphaQuality: 100,
      ...options,
    })
    .toBuffer();
}

async function measureImage(input, encodedBuffer, { animated }) {
  if (animated) return { psnr: null, ssim: null };

  // Composite over white before measuring. Transparent pixels often carry
  // arbitrary hidden RGB values that no user can see; comparing them directly
  // produces false negatives (and occasionally false positives).
  const flatten = { background: "#ffffff" };

  const source = await sharp(input).flatten(flatten).raw().toBuffer();
  const decoded = await sharp(encodedBuffer).flatten(flatten).raw().toBuffer();
  const psnr = psnrFromBuffers(source, decoded);

  const proxySource = await sharp(input)
    .flatten(flatten)
    .resize({ width: 1024, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer();
  const proxyDecoded = await sharp(encodedBuffer)
    .flatten(flatten)
    .resize({ width: 1024, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer();

  return { psnr, ssim: ssimFromBuffers(proxySource, proxyDecoded) };
}

async function optimizeImage(sourcePath, outputPath) {
  const sourceStat = await fs.stat(sourcePath);
  const extension = path.extname(sourcePath).toLowerCase();
  const metadata = await sharp(sourcePath, { animated: true }).metadata();
  const animated = (metadata.pages ?? 1) > 1;
  const notes = [];

  // Tiny, already-WebP files are almost never improved by re-encoding.
  if (extension === ".webp" && sourceStat.size <= 500 * 1024) {
    return {
      action: "copied",
      notes: ["already WebP and under 500 KB; re-encoding would risk quality for no practical gain"],
      width: metadata.width,
      height: metadata.pageHeight ?? metadata.height,
      animated,
    };
  }

  const losslessFirst =
    sourceStat.size <= CONFIG.image.losslessThresholdBytes || animated;

  let best = null;

  const tryCandidate = async ({ label, buffer, quality }) => {
    if (buffer.length >= sourceStat.size * (1 - CONFIG.image.minSavingRatio)) {
      notes.push(`${label} rejected: less than ${pct(CONFIG.image.minSavingRatio)} smaller`);
      return false;
    }

    let metrics = { psnr: null, ssim: null };
    if (!animated) {
      metrics = await measureImage(sourcePath, buffer, { animated });
      const qualityOk =
        quality === null ||
        (metrics.psnr >= CONFIG.image.minPsnr && metrics.ssim >= CONFIG.image.minSsim);

      if (!qualityOk) {
        notes.push(
          `${label} rejected: PSNR ${metrics.psnr.toFixed(2)} dB / SSIM ${metrics.ssim.toFixed(5)}`,
        );
        return false;
      }
    }

    best = { label, buffer, quality, metrics };
    return true;
  };

  // Small or animated assets: try a mathematically lossless WebP first. If it
  // already saves real bytes, it beats any lossy encode on quality.
  if (losslessFirst) {
    const buffer = await encodeWebp(sourcePath, { lossless: true });
    await tryCandidate({ label: "webp-lossless", buffer, quality: null });
  }

  // Heavy still images: quality ladder, highest quality first. The first
  // candidate that clears the measured gate wins; q97 is visually transparent
  // for photographic work and still far smaller than the source PNG.
  if (!animated && !best) {
    for (const quality of CONFIG.image.qualities) {
      const buffer = await encodeWebp(sourcePath, {
        quality,
      });
      if (await tryCandidate({ label: `webp-q${quality}`, buffer, quality })) break;
    }
  }

  // Last resort for large PNGs that miss the lossy gate: a lossless WebP may
  // still be meaningfully smaller than the PNG, with mathematically zero loss.
  if (!animated && !best && !losslessFirst && extension !== ".webp") {
    const buffer = await encodeWebp(sourcePath, { lossless: true });
    await tryCandidate({ label: "webp-lossless", buffer, quality: null });
  }

  if (!best) {
    return {
      action: "copied",
      notes: [...notes, "no conversion met the quality + size gates; original copied unchanged"],
      width: metadata.width,
      height: metadata.pageHeight ?? metadata.height,
      animated,
    };
  }

  await writeAtomic(outputPath, best.buffer);

  return {
    action: "converted",
    notes,
    width: metadata.width,
    height: metadata.pageHeight ?? metadata.height,
    animated,
    encoder: best.label,
    psnr: best.metrics.psnr,
    ssim: best.metrics.ssim,
  };
}

// ── Video pipeline ────────────────────────────────────────────────────────────

async function probeVideo(file) {
  const { stdout } = await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,r_frame_rate,avg_frame_rate,codec_name,pix_fmt",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      file,
    ],
    { capture: true },
  );

  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0] ?? {};
  const format = parsed.format ?? {};

  return {
    width: stream.width,
    height: stream.height,
    codec: stream.codec_name,
    pixFmt: stream.pix_fmt,
    frameRate: stream.avg_frame_rate ?? stream.r_frame_rate,
    duration: Number(format.duration),
    size: Number(format.size),
  };
}

async function hasAudio(file) {
  const { stdout } = await run(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file],
    { capture: true },
  );
  return stdout.trim().length > 0;
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
  return {
    frames: sorted.length,
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: at(0.5),
    min: sorted[0],
  };
}

function parseStatsFile(text, key) {
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const match = line.match(new RegExp(`${key}:([0-9.]+|inf)`));
      if (!match) return null;
      return match[1] === "inf" ? Infinity : Number(match[1]);
    })
    .filter((value) => value !== null);
}

async function measureVideoQuality(sourcePath, encodedPath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cdn-video-quality-"));
  const ssimLog = path.join(tempDir, "ssim.log");
  const psnrLog = path.join(tempDir, "psnr.log");

  try {
    await run(
      "ffmpeg",
      [
        "-nostdin",
        "-i",
        sourcePath,
        "-i",
        encodedPath,
        "-lavfi",
        `[0:v][1:v]ssim=stats_file=${ssimLog}`,
        "-f",
        "null",
        "-",
      ],
      { capture: true },
    );

    await run(
      "ffmpeg",
      [
        "-nostdin",
        "-i",
        sourcePath,
        "-i",
        encodedPath,
        "-lavfi",
        `[0:v][1:v]psnr=stats_file=${psnrLog}`,
        "-f",
        "null",
        "-",
      ],
      { capture: true },
    );

    const ssim = summarize(parseStatsFile(await fs.readFile(ssimLog, "utf8"), "All"));
    const psnr = summarize(parseStatsFile(await fs.readFile(psnrLog, "utf8"), "psnr_avg"));

    return {
      ssim,
      psnr,
      pass:
        ssim.frames > 0 &&
        psnr.frames > 0 &&
        ssim.median >= CONFIG.video.minMedianSsim &&
        psnr.median >= CONFIG.video.minMedianPsnr &&
        ssim.mean >= CONFIG.video.minMeanSsim,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function encodeWebm(sourcePath, outputPath, crf) {
  await run("ffmpeg", [
    "-nostdin",
    "-y",
    "-i",
    sourcePath,
    "-map",
    "0:v:0",
    "-an", // every PortfolioMedia video is muted; drop the unused audio track
    "-c:v",
    "libvpx-vp9",
    "-crf",
    String(crf),
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-tile-columns",
    String(CONFIG.video.tileColumns),
    "-deadline",
    "good",
    "-cpu-used",
    String(CONFIG.video.cpuUsed),
    "-pix_fmt",
    "yuv420p",
    "-loglevel",
    "error",
    outputPath,
  ]);
}

async function optimizeVideo(sourcePath, outputPath) {
  const sourceStat = await fs.stat(sourcePath);
  const sourceInfo = await probeVideo(sourcePath);
  const audioPresent = await hasAudio(sourcePath);
  const notes = audioPresent ? ["audio track removed (PortfolioMedia renders every video muted)"] : [];

  let encodedInfo = null;
  let quality = null;
  let usedCrf = CONFIG.video.crf;

  for (const crf of [CONFIG.video.crf, CONFIG.video.retryCrf]) {
    usedCrf = crf;
    await encodeWebm(sourcePath, outputPath, crf);
    encodedInfo = await probeVideo(outputPath);

    if (encodedInfo.width !== sourceInfo.width || encodedInfo.height !== sourceInfo.height) {
      throw new Error(
        `resolution changed: ${sourceInfo.width}x${sourceInfo.height} -> ${encodedInfo.width}x${encodedInfo.height}`,
      );
    }

    const durationDelta = Math.abs(encodedInfo.duration - sourceInfo.duration);
    if (durationDelta > 0.25) {
      throw new Error(`duration changed by ${durationDelta.toFixed(2)}s`);
    }

    quality = await measureVideoQuality(sourcePath, outputPath);
    if (quality.pass) break;
    notes.push(
      `CRF ${crf} rejected: median SSIM ${quality.ssim.median.toFixed(4)}, ` +
        `median PSNR ${quality.psnr.median.toFixed(2)} dB, mean SSIM ${quality.ssim.mean.toFixed(4)}`,
    );
  }

  const encodedStat = await fs.stat(outputPath);
  const qualityOk = quality?.pass ?? false;
  const sizeOk = encodedStat.size < sourceStat.size * (1 - CONFIG.video.minSavingRatio);

  if (!qualityOk || !sizeOk) {
    return {
      action: "copied",
      notes: [
        ...notes,
        !qualityOk
          ? "no WebM encode met the quality gate; original copied unchanged"
          : "WebM was not meaningfully smaller; original copied unchanged",
      ],
      width: sourceInfo.width,
      height: sourceInfo.height,
      duration: sourceInfo.duration,
      encoder: sourceInfo.codec,
    };
  }

  return {
    action: "converted",
    notes,
    width: encodedInfo.width,
    height: encodedInfo.height,
    duration: encodedInfo.duration,
    encoder: `vp9-crf${usedCrf}`,
    ssim: quality.ssim.median,
    psnr: quality.psnr.median,
    quality: {
      ssim: quality.ssim,
      psnr: quality.psnr,
    },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fsExists(SOURCE_DIR)) {
    throw new Error(`Source folder not found: ${SOURCE_DIR}`);
  }

  const files = await listFiles(SOURCE_DIR);

  console.log("");
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Phase 1 — Near-lossless CDN media optimisation${C.reset}`);
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.dim}  source : ${path.relative(ROOT, SOURCE_DIR)}${C.reset}`);
  console.log(`${C.dim}  output : ${path.relative(ROOT, OUTPUT_DIR)}${C.reset}`);
  console.log(`${C.dim}  images : WebP, dimensions preserved, PSNR >= ${CONFIG.image.minPsnr} dB${C.reset}`);
  console.log(`${C.dim}  videos : WebM VP9 CRF ${CONFIG.video.crf}, median SSIM >= ${CONFIG.video.minMedianSsim}, median PSNR >= ${CONFIG.video.minMedianPsnr} dB${C.reset}`);
  console.log("");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const items = [];
  let totalOriginal = 0;
  let totalOutput = 0;

  for (const [index, name] of files.entries()) {
    const sourcePath = path.join(SOURCE_DIR, name);
    const extension = path.extname(name).toLowerCase();
    const isImage = CONFIG.imageExtensions.has(extension);
    const isVideo = CONFIG.videoExtensions.has(extension);

    if (!isImage && !isVideo) {
      skip(`${name} — unsupported type, ignored`);
      continue;
    }

    const baseName = path.basename(name, extension);
    const candidateExtension = isVideo ? ".webm" : ".webp";
    const candidateName = `${baseName}${candidateExtension}`;
    const candidatePath = path.join(OUTPUT_DIR, candidateName);

    console.log(
      `${C.dim}[${String(index + 1).padStart(2, "0")}/${files.length}]${C.reset} ${C.bold}${name}${C.reset}`,
    );

    let result;
    try {
      result = isVideo
        ? await optimizeVideo(sourcePath, candidatePath)
        : await optimizeImage(sourcePath, candidatePath);
    } catch (error) {
      fail(`${name}: ${error.message}`);
      result = { action: "copied", notes: [`optimisation failed: ${error.message}`] };
    }

    // A rejected conversion must keep its ORIGINAL extension. Writing MP4 bytes
    // to a .webm path (or GIF bytes to .webp) would break MIME types on the CDN.
    const outputName = result.action === "converted" ? candidateName : name;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    if (result.action === "copied") {
      if (candidatePath !== outputPath) await fs.rm(candidatePath, { force: true });
      await fs.copyFile(sourcePath, outputPath);
    }

    // Remove stale variants from an earlier run for the same basename.
    for (const staleExtension of CONFIG.staleExtensions) {
      const stalePath = path.join(OUTPUT_DIR, `${baseName}${staleExtension}`);
      if (stalePath !== outputPath) await fs.rm(stalePath, { force: true });
    }

    const sourceStat = await fs.stat(sourcePath);
    const outputStat = await fs.stat(outputPath);
    totalOriginal += sourceStat.size;
    totalOutput += outputStat.size;

    const saved = sourceStat.size - outputStat.size;
    const savedRatio = saved / sourceStat.size;

    if (result.action === "converted") {
      const qualityLabel = result.psnr === null
        ? ""
        : result.psnr === Infinity
          ? ", lossless"
          : `, PSNR ${result.psnr.toFixed(1)} dB`;
      ok(
        `${outputName}  ${fmtBytes(sourceStat.size)} → ${fmtBytes(outputStat.size)}  ` +
          `(${pct(savedRatio)} saved${qualityLabel}` +
          `${result.ssim ? `, SSIM ${result.ssim.toFixed(4)}` : ""})`,
      );
    } else if (saved > 0) {
      skip(`${outputName}  copied (${fmtBytes(sourceStat.size)}) — ${result.notes.at(-1)}`);
    } else {
      skip(`${outputName}  copied unchanged`);
    }

    for (const note of result.notes ?? []) {
      console.log(`${C.dim}       ↳ ${note}${C.reset}`);
    }

    items.push({
      source: path.relative(ROOT, sourcePath),
      output: path.relative(ROOT, outputPath),
      type: isVideo ? "video" : "image",
      action: result.action,
      originalBytes: sourceStat.size,
      outputBytes: outputStat.size,
      savedBytes: saved,
      savedRatio: Number(savedRatio.toFixed(4)),
      width: result.width ?? null,
      height: result.height ?? null,
      duration: result.duration ?? null,
      encoder: result.encoder ?? null,
      psnr: result.psnr ?? null,
      ssim: result.ssim ?? null,
      lossless: result.psnr === Infinity,
      quality: result.quality ?? null,
      notes: result.notes ?? [],
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 1,
    sourceDir: path.relative(ROOT, SOURCE_DIR),
    outputDir: path.relative(ROOT, OUTPUT_DIR),
    settings: CONFIG,
    summary: {
      files: items.length,
      converted: items.filter((item) => item.action === "converted").length,
      copied: items.filter((item) => item.action === "copied").length,
      originalBytes: totalOriginal,
      outputBytes: totalOutput,
      savedBytes: totalOriginal - totalOutput,
      savedRatio: totalOriginal ? Number(((totalOriginal - totalOutput) / totalOriginal).toFixed(4)) : 0,
    },
    items,
  };

  await writeAtomic(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log("");
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Phase 1 complete${C.reset}`);
  console.log(`  files      : ${report.summary.files}`);
  console.log(`  converted  : ${report.summary.converted}`);
  console.log(`  copied     : ${report.summary.copied}`);
  console.log(`  size       : ${fmtBytes(totalOriginal)} → ${fmtBytes(totalOutput)} (${pct(report.summary.savedRatio)} saved)`);
  console.log(`  report     : ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`${C.bold}══════════════════════════════════════════════════════════${C.reset}`);
  console.log("");
  console.log("Originals were not modified. Review the report, then continue to Phase 2.");
}

main().catch((error) => {
  fail(error.stack ?? error.message);
  process.exit(1);
});
