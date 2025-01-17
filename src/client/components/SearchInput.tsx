import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface Props {
  setSearch: (search: string) => void
}

export default function SearchInput({ setSearch }: Props) {
  return (
    <TextInput leftSection={<IconSearch />}
      onKeyUp={(e) => {
        if (e.key === 'Enter') {
          const { value } = (e.target as HTMLInputElement);
          setSearch(value.toLowerCase());
        }
      }} />
  );
}
