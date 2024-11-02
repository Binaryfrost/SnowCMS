import { Form } from 'react-router-dom';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Collection } from '../../../common/types/Collection';
import type { CollectionInput } from '../../../common/types/CollectionInputs';
import { onSubmit } from '../../util/form';
import IconButton from '../IconButton';
import { isTemporaryInput } from '../CollectionInputListItem';

interface Props {
  collection: Collection
  inputs: CollectionInput[]
}

export default function CollectionTitleForm({ collection, inputs }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      // TODO: Get title
      title: ''
    }
  });

  const data = inputs
    .filter((input) => !isTemporaryInput(input.id))
    .reduce((a, c) => [
      ...a,
      { value: c.id, label: c.name }
    ], []);

  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <Group align="end">
        <Select label="Title" name="title" required data={data}
          description="Name of input that will be called to render title"
          style={{
            flexGrow: 1
          }} {...form.getInputProps('title')} key={form.key('title')} />
        <IconButton label="Save">
          <Button px="xs" type="submit" name="form" value="title">
            <IconDeviceFloppy />
          </Button>
        </IconButton>
      </Group>
    </Form>
  );
}
