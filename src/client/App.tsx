import './sentry';
import { createRoot } from 'react-dom/client';
import { ActionIcon, MantineProvider, Tooltip, createTheme } from '@mantine/core';
import { NavigationProgress } from '@mantine/nprogress';
import { Notifications } from '@mantine/notifications';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';

import { router } from './router';

import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  components: {
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true
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
  <SentryErrorBoundary>
    <MantineProvider theme={theme}>
      <NavigationProgress />
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  </SentryErrorBoundary>
);
