import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "content", "projects");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "locales", "projects");

/**
 * Normalizes heading strings for forgiving matching (removes accents and casing).
 */
function normalizeHeading(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parses markdown tables or bulleted lists into arrays of strings.
 */
function parseListOrTable(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      // Skip markdown divider row |---|---|
      if (cells.length > 0 && !cells[0].match(/^[-:]+$/)) {
        rows.push(cells);
      }
    } else if (line.startsWith("-") || line.startsWith("*")) {
      const content = line.replace(/^[-*]\s+/, "");
      const boldMatch = content.match(/^\*\*([^*]+)\*\*[:\s—-]+(.*)$/);
      if (boldMatch) {
        rows.push([boldMatch[1].trim(), boldMatch[2].trim()]);
      } else {
        const parts = content.split(/\s*[/|—]\s*/);
        rows.push(parts);
      }
    }
  }
  return rows;
}

/**
 * Parses a project's Markdown string into the ProjectLocale JSON structure.
 */
export function parseProjectMarkdown(mdContent) {
  let frontmatter = {};
  let body = mdContent;

  const fmMatch = mdContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    try {
      frontmatter = load(fmMatch[1]) || {};
    } catch (e) {
      console.error("[parse-projects] YAML frontmatter parse error:", e.message);
    }
    body = fmMatch[2];
  }

  const result = {
    tags: Array.isArray(frontmatter.tags)
      ? frontmatter.tags.map((t) => String(t).trim())
      : [],
    summary: typeof frontmatter.summary === "string" ? frontmatter.summary.trim() : "",
    role: typeof frontmatter.role === "string" ? frontmatter.role.trim() : "",
    galleryDescription:
      typeof frontmatter.galleryDescription === "string"
        ? frontmatter.galleryDescription.trim()
        : "",
    bannerTitle:
      typeof frontmatter.bannerTitle === "string"
        ? frontmatter.bannerTitle.trim()
        : "",
    bannerDescription:
      typeof frontmatter.bannerDescription === "string"
        ? frontmatter.bannerDescription.trim()
        : "",
    processSteps: Array.isArray(frontmatter.processSteps) ? frontmatter.processSteps : [],
    awards: Array.isArray(frontmatter.awards) ? frontmatter.awards : [],
    metrics: Array.isArray(frontmatter.metrics) ? frontmatter.metrics : [],
    extraSections: Array.isArray(frontmatter.extraSections) ? frontmatter.extraSections : [],
  };

  // Split body into # H1 sections
  const sections = [];
  const lines = body.split(/\r?\n/);
  let currentTitle = "";
  let currentLines = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      if (currentTitle || currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
      }
      currentTitle = h1Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle || currentLines.length > 0) {
    sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
  }

  for (const sec of sections) {
    const norm = normalizeHeading(sec.title);

    // Summary / Overview
    if (["summary", "overview", "resumen", "intro", "descripcion"].includes(norm)) {
      result.summary = sec.content;
    }
    // Gallery description / Problem & Solution
    else if (
      [
        "gallery",
        "galeria",
        "gallerydescription",
        "caption",
        "problematicaysolucion",
        "problematica",
      ].some((key) => norm.includes(key))
    ) {
      result.galleryDescription = sec.content;
    }
    // Banner description / video caption
    else if (
      [
        "banner",
        "bannerdescription",
        "videobanner",
        "video",
      ].some((key) => norm.includes(key))
    ) {
      if (!result.bannerTitle) result.bannerTitle = sec.title;
      result.bannerDescription = sec.content;
    }
    // Role (if not set in frontmatter)
    else if (norm === "role" || norm === "rol") {
      if (!result.role) result.role = sec.content;
    }
    // Tags (if not set in frontmatter)
    else if (norm === "tags" || norm === "etiquetas") {
      if (result.tags.length === 0) {
        result.tags = sec.content
          .split(/\r?\n/)
          .map((l) => l.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean);
      }
    }
    // Process Steps
    else if (["process", "proceso", "steps", "pasos", "metodologia", "features", "caracteristicas"].includes(norm)) {
      const stepSections = [];
      const stepLines = sec.content.split(/\r?\n/);
      let sTitle = "";
      let sLines = [];

      for (const sLine of stepLines) {
        const h2Match = sLine.match(/^##\s+(.+)$/);
        if (h2Match) {
          if (sTitle || sLines.length > 0) {
            stepSections.push({ rawTitle: sTitle, body: sLines.join("\n").trim() });
          }
          sTitle = h2Match[1].trim();
          sLines = [];
        } else {
          sLines.push(sLine);
        }
      }
      if (sTitle || sLines.length > 0) {
        stepSections.push({ rawTitle: sTitle, body: sLines.join("\n").trim() });
      }

      result.processSteps = stepSections.map((s, idx) => {
        let index = String(idx + 1).padStart(2, "0");
        let title = s.rawTitle;
        const numMatch = s.rawTitle.match(/^(\d+)[.\s\-:]+(.*)$/);
        if (numMatch) {
          index = numMatch[1].padStart(2, "0");
          title = numMatch[2].trim();
        }
        return {
          index,
          title,
          description: s.body,
        };
      });
    }
    // Metrics (if not set in frontmatter)
    else if (["metrics", "metricas", "impact", "impacto", "resultados"].includes(norm)) {
      if (result.metrics.length === 0) {
        const rows = parseListOrTable(sec.content);
        // Header detection for tables
        const startIdx =
          rows.length > 0 &&
          normalizeHeading(rows[0][0]) === "value"
            ? 1
            : 0;

        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 2) {
            result.metrics.push({
              value: String(row[0]).trim(),
              label: String(row[1]).trim(),
            });
          }
        }

        // If no structured metrics were parsed, treat as prose extra section
        if (result.metrics.length === 0 && sec.content.trim()) {
          result.extraSections.push({ title: sec.title, content: sec.content });
        }
      }
    }
    // Awards (if not set in frontmatter)
    else if (["awards", "premios", "reconocimientos"].includes(norm)) {
      if (result.awards.length === 0) {
        const rows = parseListOrTable(sec.content);
        const startIdx =
          rows.length > 0 &&
          ["name", "nombre", "award", "premio"].includes(normalizeHeading(rows[0][0]))
            ? 1
            : 0;

        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 3) {
            result.awards.push({
              name: String(row[0]).trim(),
              issuer: String(row[1]).trim(),
              year: String(row[2]).trim(),
            });
          } else if (row.length === 2) {
            result.awards.push({
              name: String(row[0]).trim(),
              issuer: String(row[1]).trim(),
              year: "",
            });
          }
        }
      }
    }
    // Unknown sections → extra content sections (e.g. El desafío, Desarrollo técnico, Impacto)
    else {
      result.extraSections.push({ title: sec.title, content: sec.content });
    }
  }

  // Ensure metric values and labels are strings
  result.metrics = result.metrics.map((m) => ({
    value: String(m.value ?? ""),
    label: String(m.label ?? ""),
  }));

  // Ensure award properties are strings
  result.awards = result.awards.map((a) => ({
    name: String(a.name ?? ""),
    issuer: String(a.issuer ?? ""),
    year: String(a.year ?? ""),
  }));

  return result;
}

/**
 * Discovers and parses all project markdown files in content/projects
 */
export function parseAllProjects({ silent = false } = {}) {
  if (!fs.existsSync(CONTENT_DIR)) {
    if (!silent) console.warn(`[parse-projects] Directory ${CONTENT_DIR} not found.`);
    return [];
  }

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true, recursive: true });
  const compiled = [];

  for (const entry of entries) {
    if (!entry.isFile() || !/\.(md|markdown)$/i.test(entry.name)) continue;

    const fullPath = path.join(entry.parentPath || entry.path, entry.name);
    const relPath = path.relative(CONTENT_DIR, fullPath);
    const parts = relPath.split(path.sep);

    let slug = "";
    let lang = "";

    // Case 1: content/projects/<slug>/<lang>.md
    if (parts.length >= 2) {
      slug = parts[0];
      lang = path.basename(parts[1], path.extname(parts[1]));
    }
    // Case 2: content/projects/<slug>.<lang>.md
    else if (parts.length === 1) {
      const match = parts[0].match(/^([^.]+)\.([^.]+)\.(md|markdown)$/i);
      if (match) {
        slug = match[1];
        lang = match[2];
      }
    }

    if (!slug || !lang) continue;

    const mdContent = fs.readFileSync(fullPath, "utf8");
    const jsonOutput = parseProjectMarkdown(mdContent);

    // Save to public/locales/projects/<slug>/<lang>.json
    const targetDir = path.join(OUTPUT_DIR, slug);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${lang}.json`);
    fs.writeFileSync(targetPath, JSON.stringify(jsonOutput, null, 2) + "\n", "utf8");
    compiled.push({ slug, lang, targetPath });

    // Handle lilium / ascii alias
    if (slug === "lilium") {
      const asciiDir = path.join(OUTPUT_DIR, "ascii");
      fs.mkdirSync(asciiDir, { recursive: true });
      const asciiPath = path.join(asciiDir, `${lang}.json`);
      fs.writeFileSync(asciiPath, JSON.stringify(jsonOutput, null, 2) + "\n", "utf8");
      compiled.push({ slug: "ascii", lang, targetPath: asciiPath });
    }
  }

  if (!silent) {
    console.log(`[parse-projects] Successfully parsed ${compiled.length} project locale files from markdown.`);
  }

  return compiled;
}

/**
 * Vite plugin for dev watch and build hooks
 */
export function projectsMarkdownPlugin() {
  return {
    name: "vite-plugin-projects-markdown",
    buildStart() {
      parseAllProjects({ silent: false });
    },
    configureServer(server) {
      if (!fs.existsSync(CONTENT_DIR)) return;

      server.watcher.add(CONTENT_DIR);
      server.watcher.on("change", (file) => {
        if (file.startsWith(CONTENT_DIR) && /\.(md|markdown)$/i.test(file)) {
          console.log(`[parse-projects] Changed: ${path.relative(ROOT_DIR, file)} -> recompiling...`);
          parseAllProjects({ silent: false });
          server.ws.send({ type: "full-reload" });
        }
      });
      server.watcher.on("add", (file) => {
        if (file.startsWith(CONTENT_DIR) && /\.(md|markdown)$/i.test(file)) {
          console.log(`[parse-projects] Added: ${path.relative(ROOT_DIR, file)} -> recompiling...`);
          parseAllProjects({ silent: false });
          server.ws.send({ type: "full-reload" });
        }
      });
      server.watcher.on("unlink", (file) => {
        if (file.startsWith(CONTENT_DIR) && /\.(md|markdown)$/i.test(file)) {
          console.log(`[parse-projects] Removed: ${path.relative(ROOT_DIR, file)} -> recompiling...`);
          parseAllProjects({ silent: false });
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

// Direct execution CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");
  parseAllProjects({ silent: false });

  if (isWatch) {
    console.log(`[parse-projects] Watching ${CONTENT_DIR} for changes... (Press Ctrl+C to stop)`);
    fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
      if (filename && /\.(md|markdown)$/i.test(filename)) {
        console.log(`[parse-projects] File ${filename} ${eventType}. Recompiling...`);
        parseAllProjects({ silent: true });
      }
    });
  }
}
