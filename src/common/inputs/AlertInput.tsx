import { Alert, Stack, TextInput, Textarea } from '@mantine/core';
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

  isVisualOnly: true,

  renderInput: ({ settings }) => {
    const { content, ...props } = settings;

    return (
      <Alert {...props}>
        {content}
      </Alert>
    );
  },

  defaultSettings: {
    color: '',
    title: '',
    content: ''
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

    const changeSetting = useSettingsHandler(settings, onChange);

    return (
      <Stack>
        <TextInput label="Color" required value={settings.color}
          onChange={(v) => changeSetting('color', v.target.value)}
          error={errors?.color} />
        <TextInput label="Title" value={settings.title}
          onChange={(v) => changeSetting('title', v.target.value)}
          error={errors?.title} />
        <Textarea label="Content" required value={settings.content}
          onChange={(v) => changeSetting('content', v.target.value)}
          error={errors?.content} autosize />
      </Stack>
    );
  },

  validateSettings: (settings) => {
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
