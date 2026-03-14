import type { PagingParams } from '../types/paging.js';

export function validatePaging(params: PagingParams): void {
  if (params.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
    throw new Error('limit must be between 1 and 100');
  }

  if (params.offset !== undefined && params.offset < 0) {
    throw new Error('offset must be >= 0');
  }
}
