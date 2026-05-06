export type OrderDirection = "asc" | "desc";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface QueryOptions extends PaginationOptions {
  orderBy?: string;
  orderDirection?: OrderDirection;
}
