import { Alert, Stack, TextInput } from '@mantine/core';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';

interface AlertInputSettings {
  color: string
  title: string
  content: string
}

const input: Input<null, AlertInputSettings> = {
  id: 'alert',
  name: 'Alert',

  serialize: () => '',
  deserialize: () => null,

  renderInput: ({ settings }) => {
    const { content, ...props } = settings;

    return (
      <Alert {...props}>
        {content}
      </Alert>
    );
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const errors = useInputValidator<AlertInputSettings>(
      (v) => ({
        color: !v.color ? 'Color is required' : null,
        content: !v.content ? 'Content is required' : null
      }),
      registerValidator,
      unregisterValidator
    );

    const [merged, changeSetting] = useSettingsHandler({
      color: settings?.color || '',
      title: settings?.title || '',
      content: settings?.content || ''
    }, settings, onChange);

    return (
      <Stack>
        <TextInput label="Color" required value={merged.color}
          onChange={(v) => changeSetting('color', v.target.value)}
          error={errors?.color} />
        <TextInput label="Title" value={merged.title}
          onChange={(v) => changeSetting('title', v.target.value)}
          error={errors?.title} />
        <TextInput label="Content" required value={merged.content}
          onChange={(v) => changeSetting('content', v.target.value)}
          error={errors?.content} />
      </Stack>
    );
  },

  validateSettings: (settings) => {
    if (!settings) {
      throw new ExpressError('Settings are required');
    }

    const fieldsToValidate = ['color', 'title', 'content'];
    const optionalFields = ['title'];
    fieldsToValidate.forEach((field) => {
      if (!settings[field] && !optionalFields.includes(field)) {
        throw new ExpressError(`${field} is required`);
      }

      if (settings[field] && typeof settings[field] !== 'string') {
        throw new ExpressError(`${field} must be a string`);
      }
    });
  },

  renderHtml: () => null
};

export default input;
