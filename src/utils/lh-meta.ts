import type { Link, Meta } from '../types/common.js';
import { toArray } from './arrays.js';

export type RawLhMetaLink = {
  '@Href'?: string;
  '@Rel'?: string;
};

export type RawLhMeta = {
  '@Version'?: string;
  Link?: RawLhMetaLink | RawLhMetaLink[];
};

export type RawLhName = {
  '@LanguageCode'?: string;
  $?: string;
};

export function normalizeMeta(raw?: RawLhMeta): Meta {
  const links: Link[] = toArray(raw?.Link).map((link) => ({
    href: link['@Href'] ?? '',
    rel: link['@Rel'] ?? '',
  }));

  return {
    ...(raw?.['@Version'] !== undefined ? { version: raw['@Version'] } : {}),
    ...(links.length > 0 ? { links } : {}),
  };
}
