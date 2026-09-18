/**
 * GitHub's own language colours (from github-linguist), for the small dot
 * beside a server's language. Developers already read these at a glance, so
 * the dot adds recognition without adding decoration.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f1e05a',
  python: '#3572a5',
  go: '#00add8',
  rust: '#dea584',
  java: '#b07219',
  kotlin: '#a97bff',
  'c#': '#178600',
  csharp: '#178600',
  'c++': '#f34b7d',
  c: '#555555',
  ruby: '#701516',
  php: '#4f5d95',
  swift: '#f05138',
  dart: '#00b4ab',
  elixir: '#6e4a7e',
  shell: '#89e051',
  lua: '#000080',
  zig: '#ec915c',
  scala: '#c22d40',
  haskell: '#5e5086',
  vue: '#41b883',
  html: '#e34c26',
  css: '#663399',
};

/** The dot colour for a language, or a neutral grey when unknown. */
export function languageColor(language: string | null | undefined): string {
  return (language && LANGUAGE_COLORS[language.toLowerCase()]) || '#8b949e';
}
