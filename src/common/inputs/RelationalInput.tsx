import { useParams } from 'react-router-dom';
import { Checkbox, Select, Text } from '@mantine/core';
import type { Input } from '../InputRegistry';
import type { Collection } from '../types/Collection';
import type { CollectionEntryWithMetadata } from '../types/CollectionEntry';
import DataGetter from '../../client/components/DataGetter';
import { shortenUuid } from '../../client/components/ShortUuid';
import FormSkeleton from '../../client/components/FormSkeleton';
import ExpressError from '../ExpressError';
import { serverGetAllPagesFetch, serverInputFetch } from '../plugins/plugins';
import { useInputValidator, useSettingsHandler } from './hooks';

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

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { websiteId } = useParams();
    const error = useInputValidator(
      (v) => (settings.required && !v ? `${name} is required` : null),
      registerValidator,
      unregisterValidator
    );

    return settings.collectionId ? (
      <DataGetter.AllPages<CollectionEntryWithMetadata>
        skeletonComponent={<FormSkeleton inputs={1} withButton={false} />}
        url={`/api/websites/${websiteId}/collections/${settings.collectionId}/entries`}>
        {(entries) => (
          <Select label={name} description={description}
            data={entries.map((e) => ({
              value: e.id,
              label: `${e.title || 'Untitled Entry'} (${shortenUuid(e.id)})`
            }))} required={settings.required} error={error}
              value={value} onChange={onChange} />
        )}
      </DataGetter.AllPages>
    ) : (
      <Text c="red">No Collection selected</Text>
    );
  },

  defaultSettings: {
    collectionId: '',
    required: false
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const { websiteId, collectionId } = useParams();
    const errors = useInputValidator(
      (v) => ({
        collectionId: (!v.collectionId ? 'Collection is required' : null)
      }),
      registerValidator,
      unregisterValidator
    );

    const setSetting = useSettingsHandler(settings, onChange);

    return (
      <DataGetter.AllPages<Collection> url={`/api/websites/${websiteId}/collections`}
        skeletonNum={1}>
        {(collections) => (
          <>
            <Select label="Collection" required data={collections
              .filter((c) => c.id !== collectionId)
              .map((c) => ({
                value: c.id,
                label: `${c.name} (${shortenUuid(c.id)})`
              }))} searchable nothingFoundMessage="No collection found with that name"
                error={errors?.collectionId} value={settings.collectionId}
                onChange={(v) => setSetting('collectionId', v)} />

            <Checkbox label="Required" checked={settings.required}
              onChange={(e) => setSetting('required', e.target.checked)} />
          </>
        )}
      </DataGetter.AllPages>
    );
  },

  validate: async (stringifiedValue, deserialize, settings, req) => {
    if (settings.required && !stringifiedValue) {
      throw new Error('Required Relational Input does not have a value');
    }

    const value = deserialize(stringifiedValue);
    if (!value || !settings.collectionId) return;

    const resp = await serverInputFetch(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/collections` +
      `/${settings.collectionId}/entries/${value}`);

    if (resp.status !== 200) {
      throw new ExpressError('Relational Input referenced non-existant entry');
    }
  },

  validateSettings: async (settings, req) => {
    if (!settings.collectionId) {
      throw new ExpressError('Collection ID is required');
    }

    if (typeof settings.collectionId !== 'string') {
      throw new ExpressError('Collection ID must be a string');
    }

    if (settings.collectionId === req.params.collectionId) {
      throw new ExpressError('Cannot reference same Collection');
    }

    const collections = await serverGetAllPagesFetch<Collection>(
      req,
      ({ websiteId }) => `/api/websites/${websiteId}/collections`
    );

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
