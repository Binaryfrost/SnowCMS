import { Flex, Paper } from '@mantine/core';
import { Outlet } from 'react-router-dom';

export function Component() {
  return (
    <Flex direction="column" h="100vh" align="center">
      <Paper>Nav</Paper>
      <Outlet />
    </Flex>
  );
}
