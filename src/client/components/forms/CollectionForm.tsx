import { Form } from 'react-router-dom';
import { Button, Checkbox, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import type { Collection } from '../../../common/types/Collection';
import { onSubmit } from '../../util/form';
import IconButton from '../IconButton';
import { CollectionInput } from '../../../common/types/CollectionInputs';
import { isTemporaryInput } from '../CollectionInputListItem';

interface Props {
  collection?: Collection
  collectionInputs?: CollectionInput[]
}

export default function CollectionForm({ collection, collectionInputs }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: collection?.name || '',
      callHook: collection?.callHook || false,
      backdatingEnabled: collection?.backdatingEnabled || false,
      title: collection?.title || '',
      slug: collection?.slug || ''
    }
  });

  const inputs = collectionInputs?.filter((input) => !isTemporaryInput(input.id))
    .reduce((a, c) => [
      ...a,
      { value: c.id, label: c.name }
    ], []);

  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <Stack>
        <TextInput label="Name" name="name" required description="Collection name"
          style={{
            flexGrow: 1
          }} {...form.getInputProps('name')} key={form.key('name')} />

        <Checkbox label="Call HTTP Hook" name="callHook"
          description="Whether to send a POST request to the website's HTTP hook"
          {...form.getInputProps('callHook', { type: 'checkbox' })} key={form.key('callHook')} />

        <Checkbox label="Enable Backdating" name="backdatingEnabled"
          {...form.getInputProps('backdatingEnabled', { type: 'checkbox' })}
          key={form.key('backdatingEnabled')} />

        {collection && (
          <>
            <Select label="Title" name="title" required data={inputs}
              description="Name of input used for the title"
              style={{
                flexGrow: 1
              }} {...form.getInputProps('title')} key={form.key('title')} />

            <Select label="Slug" name="slug" data={inputs}
              description="Name of input used for the slug"
              style={{
                flexGrow: 1
              }} {...form.getInputProps('slug')} key={form.key('slug')} />
          </>
        )}

        <Button type="submit" px={collection ? 'xs' : undefined}>
          {collection ? (
            <IconButton label="Save">
              <IconDeviceFloppy />
            </IconButton>
          ) : 'Create Collection'}
        </Button>
      </Stack>
    </Form>
  );
}

export function prepareData(data: Record<string, any>) {
  return {
    ...data,
    callHook: data.callHook === 'on',
    backdatingEnabled: data.backdatingEnabled === 'on'
  };
}
