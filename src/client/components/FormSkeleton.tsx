import { Box, Button, Input, Skeleton, Stack } from '@mantine/core';

interface Props {
  inputs?: number
}

export default function FormSkeleton(props: Props) {
  return (
    <Stack>
      {new Array(props.inputs || 5).fill(null).map((_, i) => (
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

      <Skeleton>
        <Button>Loading...</Button>
      </Skeleton>
    </Stack>
  );
}
