import { Form } from 'react-router-dom';
import { Button, Checkbox, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import type { Collection } from '../../../common/types/Collection';
import { onSubmit } from '../../util/form';
import IconButton from '../IconButton';
import ConditionalFlexDirection from '../ConditionalFlexDirection';

interface Props {
  collection?: Collection
}

export default function CollectionForm({ collection }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: collection?.name || '',
      callHook: collection?.callHook || false
    }
  });

  // TODO: Test HTTP hook checkbox
  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <ConditionalFlexDirection group={() => !!collection} props={{
        gap: 'md'
      }} groupProps={{
        align: 'end'
      }}>
        <TextInput label="Name" name="name" required description="Collection name"
          style={{
            flexGrow: 1
          }} {...form.getInputProps('name')} key={form.key('name')} />

        <Checkbox label="Call HTTP Hook" name="callHook"
          description="Whether to send a POST request to the website's HTTP hook"
          {...form.getInputProps('callHook', { type: 'checkbox' })} key={form.key('callHook')} />

        <Button type="submit" name="form" value="name" px={collection ? 'xs' : undefined}>
          {collection ? (
            <IconButton label="Save">
              <IconDeviceFloppy />
            </IconButton>
          ) : 'Create Collection'}
        </Button>
      </ConditionalFlexDirection>
    </Form>
  );
}

export function prepareData(data: Record<string, any>) {
  return {
    ...data,
    callHook: data.callHook === 'on'
  };
}
