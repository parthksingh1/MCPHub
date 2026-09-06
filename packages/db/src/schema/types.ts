import { customType } from 'drizzle-orm/pg-core';

/**
 * Postgres `tsvector`, used by the generated full-text search column.
 * Drizzle has no first-class tsvector type, so we declare a custom one.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});
