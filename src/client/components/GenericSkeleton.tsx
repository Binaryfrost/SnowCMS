import { Skeleton, type SkeletonProps, Stack } from '@mantine/core';

export interface GenericSkeletonProps {
  skeletonNum?: number
  skeletonProps?: SkeletonProps
}

export default function GenericSkeleton(props: GenericSkeletonProps) {
  return (
    <Stack>
      {new Array(props.skeletonNum || 5).fill(null).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={i} height={50} {...props.skeletonProps} />
      ))}
    </Stack>
  );
}
