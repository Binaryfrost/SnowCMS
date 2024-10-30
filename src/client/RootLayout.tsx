import { useEffect } from 'react';
import { AppShell, Burger, Divider, Group, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { nprogress } from '@mantine/nprogress';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import DarkModeToggle from './components/DarkModeToggle';
import LogoutButton from './components/LogoutButton';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import CollectionsProvider from './context/CollectionsProvider';
import GlobalSettingsButton from './components/GlobalSettingsButton';
import WebsiteProvider from './context/WebsiteProvider';

export function Component() {
  const [opened, { toggle, close }] = useDisclosure();
  const navigation = useNavigation();
  const location = useLocation();

  // Run at next tick to prevent rendering errors
  setTimeout(() => {
    switch (navigation.state) {
      case 'idle':
        nprogress.complete();
        break;
      default:
        nprogress.start();
        break;
    }
  });

  useEffect(() => {
    close();
  }, [location]);

  return (
    <AppShell header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: {
          mobile: !opened
        }
      }}
      padding="lg"
    >
      <WebsiteProvider>
        <CollectionsProvider>
          <AppShell.Header>
            <Group h="100%" px="md">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Logo />
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
                <GlobalSettingsButton />
                <LogoutButton />
              </Group>
            </AppShell.Section>
          </AppShell.Navbar>

          <AppShell.Main>
            <Outlet />
          </AppShell.Main>
        </CollectionsProvider>
      </WebsiteProvider>
    </AppShell>
  );
}
