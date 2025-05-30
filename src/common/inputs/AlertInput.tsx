import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Alert, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { type InputProps, type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';

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

  renderInput: () => function Component(props: InputProps<null, AlertInputSettings>) {
    const { content, ...settings } = props.settings;

    return (
      <Alert {...settings}>
        {content}
      </Alert>
    );
  },

  serializeSettings: (data) => JSON.stringify(data),
  deserializeSettings: (data) => JSON.parse(data),

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        color: props.settings?.color || '',
        title: props.settings?.title || '',
        content: props.settings?.content || ''
      },
      validateInputOnChange: true,
      validate: (values) => ({
        color: !values.color ? 'Color is required' : null,
        content: !values.content ? 'Content is required' : null
      })
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    useEffect(() => {
      form.validate();
    }, []);

    return (
      <Stack>
        <TextInput label="Color" required {...form.getInputProps('color')}
          key={form.key('color')} />
        <TextInput label="Title" {...form.getInputProps('title')}
          key={form.key('title')} />
        <TextInput label="Content" required {...form.getInputProps('content')}
          key={form.key('content')} />
      </Stack>
    );
  }),

  validateSettings: (serializedSettings, deserialize) => {
    if (!serializedSettings) {
      throw new ExpressError('Settings are required');
    }

    const settings = deserialize(serializedSettings);

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
