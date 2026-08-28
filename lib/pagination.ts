import { NextRequest } from "next/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getPagination(
  request: NextRequest,
  defaultLimit = DEFAULT_LIMIT,
) {
  const pageValue = Number(request.nextUrl.searchParams.get("page"));
  const limitValue = Number(request.nextUrl.searchParams.get("limit"));
  const page =
    Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
  const limit =
    Number.isFinite(limitValue) && limitValue > 0
      ? Math.min(Math.floor(limitValue), MAX_LIMIT)
      : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function paginationResult(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
