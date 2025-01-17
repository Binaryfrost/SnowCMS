import BaseClient from './BaseClient';

export interface PaginatedQueryOpts {
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  query?: Record<string, string>
}

export class PaginatedQueryClient<T> {
  constructor(client: BaseClient, route: string, opts: PaginatedQueryOpts);

  /** Fetches the current page */
  fetch(): Promise<T[]>;

  /** Returns the current page number */
  get currentPage(): number;

  /** Returns the number of pages, fetching data from the CMS if needed */
  getPages(): Promise<number>;

  /** Goes to a specific page, returning its result */
  goToPage(page: number): ReturnType<PaginatedQueryClient<T>['fetch']>;

  /** Goes to the previous page, returning its result */
  prev(): ReturnType<PaginatedQueryClient<T>['fetch']>;

  /** Goes to the next page, returning its result */
  next(): ReturnType<PaginatedQueryClient<T>['fetch']>;
}
