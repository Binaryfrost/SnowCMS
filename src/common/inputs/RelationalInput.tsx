import { forwardRef, useImperativeHandle } from 'react';
import { useParams } from 'react-router-dom';
import { Checkbox, Select, Text } from '@mantine/core';
import { useField, useForm } from '@mantine/form';
import type { Input } from '../InputRegistry';
import DataGetter from '../../client/components/DataGetter';
import { Collection } from '../types/Collection';
import { shortenUuid } from '../../client/components/ShortUuid';
import { CollectionEntryWithTitle } from '../types/CollectionEntry';
import FormSkeleton from '../../client/components/FormSkeleton';

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

  renderHtml: async (value, settings, req) => {
    if (!value) return null;

    const { websiteId } = req.params;
    const { authorization } = req.headers;
    const port = req.socket.localPort;

    const resp = await fetch(`http://localhost:${port}/api/websites/${websiteId}/collections` +
      `/${settings.collectionId}/entries/${value}?render=true`, {
      headers: {
        authorization
      }
    });

    if (resp.status !== 200) return null;

    return resp.json();
  }
};

export default input;
