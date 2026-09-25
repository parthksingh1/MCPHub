import { CATEGORIES } from '@mcphub/shared';
import { describe, expect, it } from 'vitest';

import { COLLECTIONS, collectionQuery, getCollection } from './collections';

describe('COLLECTIONS', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = COLLECTIONS.map((collection) => collection.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('only filters on real categories', () => {
    for (const collection of COLLECTIONS) {
      for (const category of collection.filter.category ?? []) {
        expect(CATEGORIES).toContain(category);
      }
    }
  });

  it('gives every collection some filter, so none lists the whole index', () => {
    for (const { filter } of COLLECTIONS) {
      expect(Boolean(filter.category?.length || filter.official)).toBe(true);
    }
  });
});

describe('getCollection', () => {
  it('finds by slug and returns undefined otherwise', () => {
    expect(getCollection('coding-agents')?.title).toBe('Coding agent essentials');
    expect(getCollection('nope')).toBeUndefined();
  });
});

describe('collectionQuery', () => {
  it('always ranks by Trust Score from the first page', () => {
    const collection = getCollection('devops-cloud');
    if (!collection) throw new Error('devops-cloud collection is missing');
    const query = collectionQuery(collection, 12);
    expect(query).toMatchObject({ sort: 'trust', page: 1, pageSize: 12, minTrust: 65 });
    expect(query.category).toEqual(['devops', 'cloud', 'monitoring']);
  });
});
