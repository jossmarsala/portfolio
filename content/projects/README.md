# Project Content (Markdown)

This directory contains the editable Markdown source files for all project pages.

## Directory Structure

```text
content/projects/
├── <slug>/
│   ├── en.md   # English content
│   └── es.md   # Spanish content
```

Supported slugs match those defined in `src/config/projects.ts` (`vitalia`, `misu`, `gypsy`, `posdata`, `lilium`).

---

## Workflow

- **Development (`npm run dev`):** Vite automatically watches `content/projects/` and recompiles Markdown to `public/locales/projects/<slug>/<lang>.json` on save, with immediate page reload.
- **Production Build (`npm run build`):** Recompiles all Markdown files before running TypeScript check and Vite build.
- **Manual CLI:**
  - `npm run parse:projects`: Compile all Markdown files once.
  - `npm run parse:projects:watch`: Watch and compile in standalone mode.

---

## Markdown Format

Each Markdown file supports YAML frontmatter and standard Markdown headings:

```markdown
---
role: Lead Product Designer
tags:
  - Enterprise SaaS
  - Inventory Engine
  - Design System
metrics:
  - value: "-40%"
    label: Data Entry Time
  - value: "99.9%"
    label: System Uptime
awards:
  - name: Best Enterprise UX
    issuer: UX Design Awards
    year: "2026"
---

# Summary

A frictionless inventory and logistics cockpit engineered for high-throughput commercial operations with lightning-fast data entry. Links like [Link Text](https://example.com) are supported.

# Gallery

Information hierarchy optimized for intense workflow density, rapid visual scanning, and sub-second keyboard entry across high-volume inventory channels.

# Process

## 01. Discovery
Shadowing warehouse operators to understand bottlenecks in existing inventory systems.

## 02. UX Architecture
Designing a robust design system focused on high-density data and lightning-fast keyboard navigation.

## 03. Testing
Conducting usability tests with actual logistics staff to refine workflows and error handling.
```

### Flexible Syntax & Synonyms

- **Summary:** `# Summary`, `# Overview`, `# Resumen`, `# Intro`
- **Gallery description:** `# Gallery`, `# Galería`, `# Problemática y solución`, `# Caption`
- **Process steps:** `# Process`, `# Proceso`, `# Steps`, `# Pasos`
  - Each step is a `## [number]. [Title]` heading followed by its description paragraph.
- **Metrics & Awards:** Can be specified in YAML frontmatter **or** written directly as Markdown lists/tables:
  ```markdown
  # Metrics
  - **-40%**: Data Entry Time
  - **99.9%**: System Uptime

  # Awards
  | Name | Issuer | Year |
  | Best Enterprise UX | UX Design Awards | 2026 |
  ```

