import { Text, Tooltip } from '@mantine/core';

interface Props {
  uuid: string
}

export function shortenUuid(uuid: string) {
  return uuid.split('-').reverse().slice(0, 1)[0];
}

export default function ShortUuid({ uuid }: Props) {
  return (
    <Tooltip label={uuid} inline>
      <Text inherit component="span">{shortenUuid(uuid)}</Text>
    </Tooltip>
  );
}
