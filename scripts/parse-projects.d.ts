import type { Plugin } from 'vite';

export interface ProjectParsedResult {
  slug: string;
  lang: string;
  targetPath: string;
}

export function parseProjectMarkdown(mdContent: string): Record<string, unknown>;
export function parseAllProjects(options?: { silent?: boolean }): ProjectParsedResult[];
export function projectsMarkdownPlugin(): Plugin;

