import { useRef, useState, type PropsWithChildren } from 'react';
import { LoadingOverlay } from '@mantine/core';

export default function LazyLoadedCollectionSetup({ children }: PropsWithChildren) {
  const didSetup = useRef(false);
  const [loading, setLoading] = useState(true);
  
  if (!didSetup.current) {
    import('../../../common/setup').then(({ default: setup }) => {
      setup();
      setLoading(false);
      didSetup.current = true;
    });
  }

  return loading ? (
    <LoadingOverlay visible />
  ) : (
    <>
      {children}
    </>
  )
}