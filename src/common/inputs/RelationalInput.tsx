import { forwardRef, useImperativeHandle } from 'react';
import { useParams } from 'react-router-dom';
import { Checkbox, Select, Text } from '@mantine/core';
import { useField, useForm } from '@mantine/form';
import type { Input } from '../InputRegistry';
import type { Collection } from '../types/Collection';
import type { CollectionEntryWithTitle } from '../types/CollectionEntry';
import DataGetter from '../../client/components/DataGetter';
import { shortenUuid } from '../../client/components/ShortUuid';
import FormSkeleton from '../../client/components/FormSkeleton';
import ExpressError from '../ExpressError';
import { serverInputFetch } from '../plugins';

/*
 * Setting field to select other collection. In Collection Entry, allow selecting specific entry
 * of that other collection, showing the title (or ID if title is not set) and storing the ID.
 * Return the referenced Collection Entry object in the API.
 */

interface RelationalInputSettings {
  collectionId: string
  required: boolean
}

const input: Input<string, RelationalInputSettings> = {
  id: 'relational',
  name: 'Relational Input',

  deserialize: (data) => data,
  serialize: (data) => data,

  renderInput: () => forwardRef((props, ref) => {
    const { websiteId } = useParams();
    const field = useField({
      mode: 'uncontrolled',
      initialValue: props.value || '',
      validate: (value) => (props.settings.required && !value ? `${props.name} is required` : null),
      validateOnChange: true
    });

    useImperativeHandle(ref, () => ({
      getValues: () => field.getValue(),
      hasError: async () => !!(await field.validate())
    }));

    return props.settings.collectionId ? (
      <DataGetter<CollectionEntryWithTitle[]>
        skeletonComponent={<FormSkeleton inputs={1} withButton={false} />}
        url={`/api/websites/${websiteId}/collections/${props.settings.collectionId}/entries  `}>
        {(entries) => (
          <Select label={props.name} description={props.description}
            data={entries.map((e) => ({
              value: e.id,
              label: `${e.title || 'Untitled Entry'} (${shortenUuid(e.id)})`
            }))} required={props.settings?.required} {...field.getInputProps()} key={field.key} />
        )}
      </DataGetter>
    ) : (
      <Text c="red">No Collection selected</Text>
    );
  }),

  renderSettings: () => forwardRef((props, ref) => {
    const { websiteId, collectionId } = useParams();
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        collectionId: props.settings?.collectionId || '',
        required: props.settings?.required ?? false
      },
      validate: {
        collectionId: (value) => (!value ? 'Collection is required' : null)
      },
      validateInputOnChange: true
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    return (
      <DataGetter<Collection[]> url={`/api/websites/${websiteId}/collections`}>
        {(collections) => (
          <>
            <Select label="Collection" required data={collections
              .filter((c) => c.id !== collectionId)
              .map((c) => ({
                value: c.id,
                label: `${c.name} (${shortenUuid(c.id)})`
              }))} searchable nothingFoundMessage="No collection found with that name"
              {...form.getInputProps('collectionId')} key={form.key('collectionId')} />
            <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
              key={form.key('required')} />
          </>
        )}
      </DataGetter>
    );
  }),

  deserializeSettings: (data) => JSON.parse(data),
  serializeSettings: (data) => JSON.stringify(data),

  validate: async (stringifiedValue, deserialize, settings, req) => {
    if (settings.required && !stringifiedValue) {
      throw new Error('Required Relational Input does not have a value');
    }

    const value = deserialize(stringifiedValue);
    if (!value || !settings.collectionId) return;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/collections` +
      `/${settings.collectionId}/entry/${value}`);

    if (resp.status !== 200) {
      throw new Error('Relational Input referenced non-existant entry');
    }
  },

  validateSettings: async (serializedSettings, deserialize, req) => {
    if (!serializedSettings) {
      throw new ExpressError('Settings are required');
    }

    const settings = deserialize(serializedSettings);

    if (!settings.collectionId) {
      throw new ExpressError('Collection ID is required');
    }

    if (typeof settings.collectionId !== 'string') {
      throw new ExpressError('Collection ID must be a string');
    }

    console.log(settings.collectionId, req.params.collectionId);

    if (settings.collectionId === req.params.collectionId) {
      throw new ExpressError('Cannot reference same Collection');
    }

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/collections`
    );

    if (resp.status !== 200) {
      throw new ExpressError('Failed to validate settings', 500);
    }

    const collections: Collection[] = await resp.json();
    if (collections.filter((c) => c.id === settings.collectionId).length === 0) {
      throw new ExpressError('Collection with that ID does not exist');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }
  },

  renderHtml: async (value, settings, req) => {
    if (!value) return null;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/collections` +
      `/${settings.collectionId}/entries/${value}?render=true`);

    if (resp.status !== 200) return null;

    return resp.json();
  }
};

export default input;
