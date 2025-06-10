import { Box, Checkbox, Code, List, Text, TextInput } from '@mantine/core';
import type { Input } from '../InputRegistry';
import ExpressError from '../ExpressError';
import { useInputValidator, useSettingsHandler } from './hooks';

interface RemoteDataSettings {
  url: string
  required: boolean
}

const input: Input<string, RemoteDataSettings> = {
  id: 'remote-data',
  name: 'Remote Data',

  serialize: (data) => data,
  deserialize: (data) => data,

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { url, required } = settings;
    const error = useInputValidator(
      (v) => {
        if (required && !url && !v) return 'URL is required';
        return null;
      },
      registerValidator,
      unregisterValidator
    );

    return (
      <TextInput label={name}
        description={[description, url &&
          `Leave blank to use default (${url})`].filter(Boolean).join('. ')}
        required={required} error={error} value={value}
        onChange={(e) => onChange(e.target.value)} />
    );
  },

  renderSettings: ({ settings, onChange }) => {
    const [merged, setSetting] = useSettingsHandler({
      url: settings?.url || '',
      required: settings?.required ?? false
    }, settings, onChange);

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
          value={merged.url} onChange={(e) => setSetting('url', e.target.value)} />
        <Checkbox label="Required" checked={merged.required}
          onChange={(e) => setSetting('required', e.target.checked)} />
      </>
    );
  },

  validate: (stringifiedValue, deserialize, settings) => {
    if (settings.required && !stringifiedValue) {
      throw new Error('Required Remote Data Input does not have a value');
    }
  },

  validateSettings: (settings) => {
    if (!settings) {
      throw new ExpressError('Settings are required');
    }

    if (settings.url && typeof settings.url !== 'string') {
      throw new ExpressError('URL, if it exists, must be a string');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
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
