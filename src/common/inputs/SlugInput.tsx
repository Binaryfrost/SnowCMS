import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ActionIcon, Checkbox, Code, Input as MantineInput, NumberInput, Stack, TextInput } from '@mantine/core';
import { useField, useForm } from '@mantine/form';
import slug from 'slug';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { serverInputFetch } from '../plugins/plugins';
import { CollectionInput } from '../types/CollectionInputs';
import { IconRefresh } from '@tabler/icons-react';
import IconButton from '../../client/components/IconButton';

interface SlugInputSettings {
  fieldName: string
  maxLength: number
  required: boolean
  before?: string
}

function populatePlaceholders(str: string) {
  if (!str) return '';

  const date = new Date();
  let output = str;

  const placeholders = {
    year: () => date.getFullYear().toString(),
    uyear: () => date.getUTCFullYear().toString(),
    month: () => (date.getMonth() + 1).toString().padStart(2, '0'),
    umonth: () => (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    day: () => date.getDate().toString().padStart(2, '0'),
    uday: () => date.getUTCDate().toString().padStart(2, '0'),
    hour: () => date.getHours().toString().padStart(2, '0'),
    uhour: () => date.getUTCHours().toString().padStart(2, '0'),
    minute: () => date.getMinutes().toString().padStart(2, '0'),
    uminute: () => date.getUTCMinutes().toString().padStart(2, '0'),
    second: () => date.getSeconds().toString().padStart(2, '0'),
    usecond: () => date.getUTCSeconds().toString().padStart(2, '0')
  };

  for (const placeholder in placeholders) {
    if (Object.prototype.hasOwnProperty.call(placeholders, placeholder)) {
      const fn = placeholders[placeholder as keyof typeof placeholders];
      output = output.replaceAll(`{${placeholder}}`, fn());
    }
  }

  return output;
}

const input: Input<string, SlugInputSettings> = {
  id: 'slug',
  name: 'Slug',
  description: 'Used for the page URL',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: () => forwardRef((props, ref) => {
    const { maxLength, required, fieldName } = props.settings;
    const field = useField({
      mode: 'uncontrolled',
      initialValue: props.value || '',
      validateOnChange: true,
      validate: (value) => {
        if (required && !value) return `${props.name} is required`;
        if (maxLength && maxLength !== 0 && value.length > maxLength) {
          return `${props.name} has a maximum length of ${maxLength}`;
        }

        if (value.match(/\s/)) {
          return `${props.name} may not include spaces. It is recommended to use hyphens instead.`;
        }

        return null;
      },
      onValueChange: props.notifyChanges
    });

    const dependentFieldValue = useRef('');
    const beforeValue = useRef(populatePlaceholders(props.settings?.before));

    function updateSlug() {
      if (!dependentFieldValue.current) return;
      field.setValue(beforeValue.current + slug(dependentFieldValue.current, {
        fallback: false
      }));
    }

    useImperativeHandle(ref, () => ({
      getValues: () => field.getValue(),
      hasError: async () => !!(await field.validate()),
      notifyFormUpdate: (values) => {
        if (!(fieldName in values)) return;

        const value = values[fieldName];
        if (dependentFieldValue.current === value) return;
        dependentFieldValue.current = value;

        if (props.value) return;
        updateSlug();
      }
    }));

    return (
      <TextInput label={props.name} description={props.description} required={required}
        maxLength={maxLength > 1 ? maxLength : null} rightSection={props.value && (
          <IconButton label="Update Slug">
            <ActionIcon onClick={updateSlug}>
              <IconRefresh />
            </ActionIcon>
          </IconButton>
        )}
        {...field.getInputProps()} key={field.key} />
    );
  }),

  serializeSettings: (data) => JSON.stringify(data),
  deserializeSettings: (data) => JSON.parse(data),

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        fieldName: props.settings?.fieldName || '',
        maxLength: props.settings?.maxLength || 0,
        required: props.settings?.required ?? true,
        before: props.settings?.before || ''
      },
      validateInputOnChange: true,
      validate: (values) => ({
        fieldName: !values.fieldName ? 'Field name is required' : null,
        maxLength: values.maxLength < 0 ? 'Max length must be positive' : null
      }),
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
        <TextInput label="Field Name"
          description="The field name of the input the slug will be generated from" required
          {...form.getInputProps('fieldName')} key={form.key('fieldName')} />
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required
          {...form.getInputProps('maxLength')} key={form.key('maxLength')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
        <TextInput label="Before"
          description={(
            <MantineInput.Label>
              Value prepended to slug. The following placeholder values are available:&nbsp;
              <Code>{'{year}'}</Code>, <Code>{'{month}'}</Code>, <Code>{'{day}'}</Code>,&nbsp;
              <Code>{'{hour}'}</Code>, <Code>{'{minute}'}</Code>, <Code>{'{second}'}</Code>&nbsp;
              (all returned in local time),&nbsp;
              <Code>{'{uyear}'}</Code>, <Code>{'{umonth}'}</Code>, <Code>{'{uday}'}</Code>,&nbsp;
              <Code>{'{uhour}'}</Code>, <Code>{'{uminute}'}</Code>, <Code>{'{usecond}'}</Code>&nbsp;
              (all returned in UTC).
            </MantineInput.Label>
          )}
          {...form.getInputProps('before')} key={form.key('before')} />
      </Stack>
    );
  }),

  validate: (serializedValue, deserialize, settings) => {
    if (settings.required && !serializedValue) {
      throw new ExpressError('Required Slug Input does not have a value');
    }

    const value = deserialize(serializedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Slug Input value is longer than allowed');
    }
  },

  validateSettings: async (serializedSettings, deserialize, req) => {
    if (!serializedSettings) {
      throw new ExpressError('Settings are required');
    }

    const settings = deserialize(serializedSettings);

    if (!settings.fieldName) {
      throw new ExpressError('Field Name is required');
    }

    if (typeof settings.fieldName !== 'string') {
      throw new ExpressError('Field Name must be a string');
    }

    const resp = await serverInputFetch(
      req,
      (params) => `/api/websites/${params.websiteId}/collections/${params.collectionId}/inputs`
    );

    if (resp.status !== 200) {
      throw new ExpressError('Failed to validate settings', 500);
    }

    const collectionInputs: CollectionInput[] = await resp.json();
    if (collectionInputs.filter((i) => i.fieldName === settings.fieldName).length === 0) {
      throw new ExpressError('No Input with that field name exist in this Collection');
    }

    if (typeof settings.maxLength !== 'number') {
      throw new ExpressError('Max Length must be a number');
    }

    if (settings.maxLength < 0) {
      throw new ExpressError('Max Length cannot be negative');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }
  },

  renderHtml: (value) => value
};

export default input;
