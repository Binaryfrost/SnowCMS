import { Box, Button, Input, Skeleton, Stack } from '@mantine/core';

interface Props {
  inputs?: number
  withButton?: boolean
}

export default function FormSkeleton({ inputs, withButton = true }: Props) {
  return (
    <Stack>
      {new Array(inputs || 5).fill(null).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i}>
          <Skeleton mb={4} p={0} w="fit-content">
            <Input.Label>Loading...</Input.Label>
          </Skeleton>
          <Skeleton>
            <Input />
          </Skeleton>
        </Box>
      ))}

      {withButton && (
        <Skeleton>
          <Button>Loading...</Button>
        </Skeleton>
      )}
    </Stack>
  );
}
