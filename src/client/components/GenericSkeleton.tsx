import { Skeleton, type SkeletonProps, Stack, Group } from '@mantine/core';

export interface GenericSkeletonProps {
  skeletonNum?: number
  skeletonProps?: SkeletonProps
  horizontal?: boolean
}

export default function GenericSkeleton(props: GenericSkeletonProps) {
  const FlexComponent = props.horizontal ? Group : Stack;
  return (
    <FlexComponent>
      {new Array(props.skeletonNum || 5).fill(null).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={i} height={50} {...props.skeletonProps} />
      ))}
    </FlexComponent>
  );
}
