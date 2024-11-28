import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface Props {
  setSearch: (search: string) => void
}

export default function SearchInput({ setSearch }: Props) {
  return (
    <TextInput leftSection={<IconSearch />}
      onChange={(e) => setSearch(e.target.value.toLowerCase())} />
  );
}
