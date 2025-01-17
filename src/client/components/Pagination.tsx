import { Pagination as MantinePagination } from '@mantine/core';

interface Props {
  page: number
  pages: number
  setPage: (page: number) => void
}

export default function Pagination({ page, pages, setPage }: Props) {
  return pages <= 1 ? null : (
    <MantinePagination total={pages} value={page} onChange={setPage} mx="auto" />
  );
}
