import { useRef } from 'react';
import {
  ActionIcon, Checkbox, Code, Input as MantineInput, NumberInput, Stack, TextInput
} from '@mantine/core';
import slug from 'slug';
import { type Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { serverInputFetch } from '../plugins/plugins';
import { CollectionInput } from '../types/CollectionInputs';
import { IconRefresh } from '@tabler/icons-react';
import IconButton from '../../client/components/IconButton';
import { useInputValidator, useSettingsHandler } from './hooks';
import { useLocation } from 'react-router-dom';

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

  renderInput: ({
    name, description, value, values, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { maxLength, required, fieldName } = settings;
    const error = useInputValidator(
      (v) => {
        if (required && !v) return `${name} is required`;
        if (maxLength && maxLength !== 0 && value.length > maxLength) {
          return `${name} has a maximum length of ${maxLength}`;
        }

        if (value.match(/\s/)) {
          return `${name} may not include spaces. It is recommended to use hyphens instead.`;
        }

        return null;
      },
      registerValidator,
      unregisterValidator
    );

    const previousValue = useRef('');
    const prependedValue = useRef(populatePlaceholders(settings.before));
    const isNewEntry = useLocation().pathname.endsWith('/create');

    function updateSlug() {
      const dependentFieldValue = values[settings.fieldName];
      if (!dependentFieldValue) return;

      const slugValue = prependedValue.current + slug(dependentFieldValue, {
        fallback: false
      });

      if (previousValue.current === slugValue) return;
      onChange(slugValue);
      previousValue.current = slugValue;
    }

    // Update the slug on the next tick instead of on render
    setTimeout(() => {
      if (isNewEntry) updateSlug();
    });

    return (
      <TextInput label={name} description={description} required={required}
        maxLength={maxLength > 1 ? maxLength : null} rightSection={!isNewEntry && (
          <IconButton label="Update Slug" role="USER">
            <ActionIcon onClick={updateSlug}>
              <IconRefresh />
            </ActionIcon>
          </IconButton>
        )} error={error}
        value={value || ''} onChange={(e) => onChange(e.target.value)} />
    );
  },

  defaultSettings: {
    fieldName: '',
    maxLength: 0,
    required: true,
    before: ''
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const setSetting = useSettingsHandler(settings, onChange);

    const errors = useInputValidator(
      (v) => ({
        fieldName: !v.fieldName ? 'Field name is required' : null,
        maxLength: v.maxLength < 0 ? 'Max length must be positive' : null
      }),
      registerValidator,
      unregisterValidator
    );

    return (
      <Stack>
        <TextInput label="Field Name"
          description="The field name of the input the slug will be generated from" required
          error={errors?.fieldName} value={settings.fieldName}
          onChange={(e) => setSetting('fieldName', e.target.value)} />
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required
          error={errors?.maxLength} value={settings.maxLength}
          onChange={(v: number) => setSetting('maxLength', v)} />
        <Checkbox label="Required" checked={settings.required}
        onChange={(e) => setSetting('required', e.target.checked)} />
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
          value={settings.before} onChange={(e) => setSetting('before', e.target.value)} />
      </Stack>
    );
  },

  validate: (serializedValue, deserialize, settings) => {
    if (settings.required && !serializedValue) {
      throw new ExpressError('Required Slug Input does not have a value');
    }

    const value = deserialize(serializedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Slug Input value is longer than allowed');
    }
  },

  validateSettings: async (settings, req) => {
    if (!settings) {
      throw new ExpressError('Settings are required');
    }

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
