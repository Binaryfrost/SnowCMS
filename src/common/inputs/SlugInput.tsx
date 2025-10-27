import { useRef } from 'react';
import {
  ActionIcon, Code, Input as MantineInput, NumberInput, Select, Stack, TextInput, Tooltip
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
import DataGetter from '../../client/components/DataGetter';
import FormSkeleton from '../../client/components/FormSkeleton';
import { DateTime } from 'luxon';

interface SlugInputSettings {
  fieldName: string
  maxLength: number
  before?: string
  timezone: string
}

const PLACEHOLDERS = {
  year: (date: DateTime) => date.year.toString(),
  month: (date: DateTime) => (date.month).toString().padStart(2, '0'),
  day: (date: DateTime) => date.day.toString().padStart(2, '0'),
  hour: (date: DateTime) => date.hour.toString().padStart(2, '0'),
  minute: (date: DateTime) => date.minute.toString().padStart(2, '0'),
  second: (date: DateTime) => date.second.toString().padStart(2, '0'),
};

function containsPlaceholder(value: string) {
  return Object.keys(PLACEHOLDERS)
    .filter((placeholder) => value?.includes(`{${placeholder}}`))
    .length !== 0;
}

function populatePlaceholders(str: string, timezone: string) {
  if (!str) return '';

  const date = DateTime.now().setZone(timezone);
  let output = str;

  for (const placeholder in PLACEHOLDERS) {
    if (Object.prototype.hasOwnProperty.call(PLACEHOLDERS, placeholder)) {
      const fn = PLACEHOLDERS[placeholder as keyof typeof PLACEHOLDERS];
      output = output.replaceAll(`{${placeholder}}`, fn(date));
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

  transform: (value, settings) => {
    if (settings.before) {
      return populatePlaceholders(value, settings.timezone);
    }

    return value;
  },

  renderInput: ({
    name, description, value, values, required, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { maxLength, fieldName, before } = settings;
    const error = useInputValidator(
      (v) => {
        if (required && !v) return `${name} is required`;
        if (maxLength && maxLength !== 0 && v?.length > maxLength) {
          return `${name} has a maximum length of ${maxLength}`;
        }

        if (v?.match(/\s/)) {
          return `${name} may not include spaces. It is recommended to use hyphens instead.`;
        }

        return null;
      },
      registerValidator,
      unregisterValidator
    );

    const previousValue = useRef('');
    const isNewEntry = useLocation().pathname.endsWith('/create');

    function updateSlug() {
      const dependentFieldValue = values[fieldName];
      if (!dependentFieldValue) return;

      const slugValue = before + slug(dependentFieldValue, {
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

    const descriptionWithPlaceholderTip = `${description}${description?.endsWith('.') ? '' : '.'} Placeholders (e.g. {hour}) will be replaced automatically.`;

    return (
      <TextInput label={name}
        description={containsPlaceholder(value) ? descriptionWithPlaceholderTip : description}
        required={required}
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
    before: '',
    timezone: 'Etc/UTC'
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const setSetting = useSettingsHandler(settings, onChange);

    const errors = useInputValidator(
      (v) => ({
        fieldName: !v.fieldName ? 'Field name is required' : null,
        maxLength: v.maxLength < 0 ? 'Max length must be positive' : null,
        timezone: !v.timezone ? 'Timezone is required' : null
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

        <TextInput label="Before"
          description={(
            <MantineInput.Label>
              Value prepended to slug. The following placeholder values are available:&nbsp;
              <Code>{'{year}'}</Code>, <Code>{'{month}'}</Code>, <Code>{'{day}'}</Code>,&nbsp;
              <Code>{'{hour}'}</Code>, <Code>{'{minute}'}</Code>, <Code>{'{second}'}</Code>.
            </MantineInput.Label>
          )}
          value={settings.before} onChange={(e) => setSetting('before', e.target.value)} />

        <DataGetter<string[]> url="/api/config/timezones"
          skeletonComponent={<FormSkeleton inputs={1} withButton={false} />}>
          {({ data }) => (
            <Select label="Timezone" description="Placeholder value timezone" data={data}
              value={settings.timezone} onChange={(v) => setSetting('timezone', v)}
              searchable required />
          )}
        </DataGetter>
      </Stack>
    );
  },

  validate: (serializedValue, required, settings) => {
    if (required && !serializedValue) {
      throw new ExpressError('Required Slug Input does not have a value');
    }

    const value = input.deserialize(serializedValue);

    if (settings.maxLength > 0 && value.length > settings.maxLength) {
      throw new ExpressError('Slug Input value is longer than allowed');
    }
  },

  validateSettings: async (settings, req) => {
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
  },

  renderHtml: (value) => value
};

export default input;
