import { forwardRef, useImperativeHandle } from 'react';
import { Box, Checkbox, Code, List, Text, TextInput } from '@mantine/core';
import { useField, useForm } from '@mantine/form';
import type { Input } from '../InputRegistry';

interface RemoteDataSettings {
  url: string
  required: boolean
}

const input: Input<string, RemoteDataSettings> = {
  id: 'remote-data',
  name: 'Remote Data',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: () => forwardRef((props, ref) => {
    const field = useField({
      initialValue: props.value || '',
      validate: (value) => {
        const { url, required } = props.settings;
        if (required && !url && !value) return 'URL is required';
        return null;
      }
    });
    useImperativeHandle(ref, () => ({
      getValues: () => field.getValue(),
      hasError: async () => {
        if (props.settings.url) return false;
        return !!(await field.validate());
      }
    }));

    return (
      <TextInput label={props.name}
        description={[props.description, props.settings?.url &&
          `Leave blank to use default (${props.settings.url})`].filter(Boolean).join('. ')}
        required={props.settings?.required} {...field.getInputProps()} key={field.key} />
    );
  }),

  serializeSettings: JSON.stringify,
  deserializeSettings: JSON.parse,

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        url: props.settings?.url || '',
        required: props.settings?.required ?? false
      }
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues()
    }));

    return (
      <>
        <Box>
          <Text>
            The following placeholder variables are available:
          </Text>
          <List>
            <List.Item><Code>{'{website}'}</Code>: Website ID</List.Item>
            <List.Item><Code>{'{collection}'}</Code>: Collection ID</List.Item>
            <List.Item><Code>{'{entry}'}</Code>: Entry ID</List.Item>
          </List>
        </Box>
        <TextInput label="URL" description={'URL to request when rendering this Input. ' +
          'If not set, a field will be shown in the Collection Entry form'}
          {...form.getInputProps('url')} key={form.key('url')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </>
    );
  }),

  isValid: (stringifiedValue, deserialize, settings) => {
    if (settings.required && !stringifiedValue) {
      throw new Error('Required Remote Data Input does not have a value');
    }
  },

  renderHtml: async (value, settings, req) => {
    const url = value || settings.url;
    if (!url) return null;

    const { websiteId, collectionId, id } = req.params;
    const urlWithPlaceholdersReplaced = url
      .replace(/\{website\}/g, websiteId)
      .replace(/\{collection\}/g, collectionId)
      .replace(/\{entry\}/g, id);

    const resp = await fetch(urlWithPlaceholdersReplaced, {
      headers: {
        // Getting the version here is easier said than done
        'User-Agent': 'SnowCMS/0.0.0'
      }
    });
    if (resp.status >= 400) return null;

    const contentType = resp.headers.get('Content-Type') || 'application/octet-stream';

    if (contentType.includes('text/')) {
      return resp.text();
    }

    if (contentType.includes('application/json')) {
      return resp.json();
    }

    return urlWithPlaceholdersReplaced;
  }
};

export default input;
