import { Button, Group, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';

export interface AddHtmlModalContentProps {
  close: (content?: string) => void
}

export default function AddHtmlModalContent({ close }: AddHtmlModalContentProps) {
  const [value, setValue] = useState('');

  return (
    <Stack>
      <Textarea label="HTML" required value={value} onChange={(e) => setValue(e.target.value)} />

      <Group justify="end">
        <Button variant="default" onClick={() => close(null)}>Cancel</Button>
        <Button onClick={() => close(value)}>Add HTML</Button>
      </Group>
    </Stack>
  );
}
