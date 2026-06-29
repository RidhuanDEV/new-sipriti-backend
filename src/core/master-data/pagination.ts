export interface LegacyPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LegacyPaginationMeta {
  pagination: LegacyPagination;
}

export interface SimplePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationInput {
  page?: number | undefined;
  limit?: number | undefined;
}

export interface PaginationState {
  page: number;
  limit: number;
  offset: number;
}

export function normalizePagination(
  input: PaginationInput,
  defaultLimit = 10,
  maxLimit = 200,
): PaginationState {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(maxLimit, Math.max(1, input.limit ?? defaultLimit));
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function buildLegacyPaginationMeta(
  page: number,
  limit: number,
  totalItems: number,
): LegacyPaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function buildSimplePaginationMeta(
  page: number,
  limit: number,
  total: number,
): SimplePaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
