import { Box, Group, Progress, Text, Tooltip } from '@mantine/core';
import type { MediaConfig } from '../../common/types/Media';
import GenericSkeleton from './GenericSkeleton';
import { bytesToReadableUnits } from '../util/media';

export default function MediaStorageUsage({ config }: { config: MediaConfig }) {
  const storagePercentage = config ? (config.usedStorage / config.maxStorage) * 100 : 0;
  const warnPercentage = 90;

  return !config ? (
    <GenericSkeleton skeletonNum={1} skeletonProps={{
      h: 32
    }} />
  ) : (
    <Box>
      <Progress value={storagePercentage} color={storagePercentage >= warnPercentage && 'red'} />
      <Group justify="space-between" gap={0}>
        <Text c="dimmed">
          <Tooltip label={`${config.usedStorage.toLocaleString()} bytes`}>
            <Text inherit inline component="span">
              Used: {bytesToReadableUnits(config.usedStorage)}
            </Text>
          </Tooltip>
          {storagePercentage >= warnPercentage && ` (More than ${warnPercentage}% used)`}
        </Text>
        <Text c="dimmed">Allocated: {bytesToReadableUnits(config.maxStorage)}</Text>
      </Group>
    </Box>
  );
}