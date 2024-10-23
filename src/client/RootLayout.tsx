import { AppShell, Burger, Divider, Group, Image, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import DarkModeToggle from './components/DarkModeToggle';
import LogoutButton from './components/LogoutButton';

import logo from './logo.png';
import Navbar from './components/Navbar';

export function Component() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: {
          mobile: !opened
        }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <Image src={logo} h={40} w="auto" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Navbar />
        </AppShell.Section>
        <Divider />
        <AppShell.Section mt="md">
          <Group justify="center">
            <DarkModeToggle />
            <LogoutButton />
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
