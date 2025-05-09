import { useMantineColorScheme, ActionIcon, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import IconButton from './IconButton';

export default function DarkModeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorSchme = useComputedColorScheme('light');
  const toggleColorScheme = () => setColorScheme(computedColorSchme === 'dark' ? 'light' : 'dark');

  return (
    <IconButton label={computedColorSchme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
      <ActionIcon size="lg" onClick={toggleColorScheme}>
        {computedColorSchme === 'dark' ? <IconSun /> : <IconMoon />}
      </ActionIcon>
    </IconButton>
  );
}
