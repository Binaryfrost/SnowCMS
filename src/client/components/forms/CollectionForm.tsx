import { Form } from 'react-router-dom';
import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Collection } from '../../../common/types/Collection';
import { onSubmit } from '../../util/form';

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

  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <Stack>
        <TextInput label="Name" name="name" required
          {...form.getInputProps('name')} key={form.key('name')} />
        <Button type="submit">{collection ? 'Edit' : 'Create'} Collection</Button>
      </Stack>
    </Form>
  );
}
