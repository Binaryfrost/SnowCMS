export interface PaginatedResponse<T = any> {
  data: T[]
  page: number
  pages: number
}
