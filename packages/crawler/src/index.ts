/**
 * Shared crawler logic: source adapters (GitHub, npm, PyPI, awesome-lists),
 * README parsing, classification, and repository URL canonicalisation.
 *
 * Consumed by the scheduled GitHub Actions workers in `workers/`.
 */

export * from './awesome-lists';
export * from './canonicalize';
export * from './classify';
export * from './discover';
export * from './enrich';
export * from './etag-store';
export * from './github';
export * from './parse-readme';
export * from './registries';
export * from './types';
