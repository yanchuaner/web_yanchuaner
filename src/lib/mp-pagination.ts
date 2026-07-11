export type MpPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function positiveInteger(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseMpPagination(
  searchParams: URLSearchParams,
  options: { defaultPageSize?: number; maxPageSize?: number } = {},
) {
  const defaultPageSize = options.defaultPageSize ?? 10;
  const maxPageSize = options.maxPageSize ?? 50;
  const page = positiveInteger(searchParams.get("page")) ?? 1;
  const requestedPageSize =
    positiveInteger(searchParams.get("pageSize")) ?? defaultPageSize;
  const pageSize = Math.min(requestedPageSize, maxPageSize);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function toMpPagination(
  page: number,
  pageSize: number,
  total: number,
): MpPagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
