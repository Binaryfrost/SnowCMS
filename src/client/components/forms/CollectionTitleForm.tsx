import { Form } from 'react-router-dom';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Collection } from '../../../common/types/Collection';
import { onSubmit } from '../../util/form';
import IconButton from '../IconButton';

interface Props {
  collection: Collection
}

export default function CollectionTitleForm({ collection }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: ''
    }
  });

  return (
    <Form method="POST" onSubmit={(e) => onSubmit(e, form)}>
      <Group align="end">
        <Select label="Title" name="title" required data={[]}
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
