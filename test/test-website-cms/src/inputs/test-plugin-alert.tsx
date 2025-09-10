import { Alert } from '@mantine/core';
import { defineInputPlugin } from '../../../../src/lib';

export default defineInputPlugin({
  name: 'test-plugin-alert',
  plugin: ({ logger }) => {
    logger.log('Test Plugin Alert');

    return {
      id: 'test-plugin-alert',
      name: 'Test Plugin Alert',
      description: 'An plugin-added alert with non-configurable content',

      isVisualOnly: true,

      renderInput: () => {
        return (
          <Alert>Test Plugin Alert</Alert>
        );
      },

      renderHtml: () => null
    };
  }
});
