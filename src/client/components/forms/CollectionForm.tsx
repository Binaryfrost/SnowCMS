import { Form } from 'react-router-dom';
import { Box, Button, Flex, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import type { Collection } from '../../../common/types/Collection';
import { onSubmit } from '../../util/form';
import IconButton from '../IconButton';
import FlexGrow from '../FlexGrow';
import ConditionalFlexDirection from '../ConditionalFlexDirection';

interface Props {
  collection?: Collection
}

export default function CollectionForm({ collection }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: collection?.name || ''
    }
  });

  // <Flex direction={collection ? 'row' : 'column'} align="end" gap="md">

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
