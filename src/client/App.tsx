import { createRoot } from 'react-dom/client';
import { ActionIcon, MantineProvider, Tooltip, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { NavigationProgress } from '@mantine/nprogress';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
import InputRegistry from '../common/InputRegistry';
import setup from '../common/setup';

import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/notifications/styles.css';

setup();

console.log('inputs', InputRegistry.getAllInputs());

const theme = createTheme({
  components: {
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true,
        events: {
          hover: true,
          touch: true,
          focus: false
        }
      }
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'subtle'
      }
    })
  }
});

createRoot(document.getElementById('app')).render(
  <MantineProvider theme={theme}>
    <ModalsProvider>
      <NavigationProgress />
      <Notifications />
      <RouterProvider router={router} />
    </ModalsProvider>
  </MantineProvider>
);
