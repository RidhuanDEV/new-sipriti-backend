import { Op } from "sequelize";
import type { WhereOptions } from "sequelize";
import { buildSimplePaginationMeta, normalizePagination } from "../master-data/pagination.js";
import type { SimplePaginationMeta } from "../master-data/pagination.js";

export interface ListQueryInput {
  page?: number;
  limit?: number;
  search?: string | undefined;
  q?: string | undefined;
}

export interface PaginatedRows<T> {
  rows: T[];
  meta: SimplePaginationMeta;
}

export function normalizeSimplePagination(
  query: ListQueryInput,
  defaultLimit = 10,
  maxLimit = 200,
): { page: number; limit: number; offset: number } {
  return normalizePagination(query, defaultLimit, maxLimit);
}

export function buildSimpleMeta(
  page: number,
  limit: number,
  total: number,
): SimplePaginationMeta {
  return buildSimplePaginationMeta(page, limit, total);
}

export function buildLikeWhere(fieldName: string, value?: string): WhereOptions {
  const normalized = value?.trim() ?? "";
  if (!normalized) return {};

  return {
    [fieldName]: {
      [Op.like]: `%${normalized}%`,
    },
  };
}

export function parseBooleanLike(value: boolean | string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

export function generateSlug(title: string): string {
  if (!title) return "";
  return title
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function ensureUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let uniqueSlug = baseSlug;
  let counter = 1;
  let exists = await checkExists(uniqueSlug);

  while (exists) {
    uniqueSlug = `${baseSlug}-${counter}`;
    exists = await checkExists(uniqueSlug);
    counter += 1;
  }

  return uniqueSlug;
}
