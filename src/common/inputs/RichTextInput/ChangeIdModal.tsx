import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useField } from '@mantine/form';
import { modals } from '@mantine/modals';

interface Props {
  currentId: string
  close: (newId?: string) => void
}

function ChangeIdModal({ currentId, close }: Props) {
  const field = useField({
    mode: 'uncontrolled',
    initialValue: currentId,
    validate(value) {
      if (!value) {
        return 'ID is required';
      }

      if (!value.match(/^[a-zA-Z][a-zA-Z0-9\-_]+$/)) {
        return 'ID must start with a letter and contain only alphanumeric characters, hyphens, and underscores';
      }

      return null;
    },
    validateOnChange: true
  });

  return (
    <Stack>
      <Text>
        Heading IDs are used to create anchor links that let users on your website
        jump directly to a specific heading. By default, SnowCMS generates a random
        ID, but this can be changed to reduce the chance of breaking existing links
        when you update the content. It is recommended to only use lowercase characters.
      </Text>

      <TextInput label="ID" required {...field.getInputProps()} key={field.key} />

      <Group justify="end">
        <Button variant="default" onClick={() => close()}>Cancel</Button>
        <Button onClick={() => {
          field.validate().then((errors) => {
            if (!errors) {
              close(field.getValue());
            }
          });
        }}>Change ID</Button>
      </Group>
    </Stack>
  );
}

const MODAL_ID = 'change_id_modal';
export function showChangeIdModal({ currentId, close }: Props) {
  modals.open({
    title: 'Change ID',
    modalId: MODAL_ID,
    children: <ChangeIdModal currentId={currentId} close={(newId) => {
      modals.close(MODAL_ID);
      close(newId);
    }} />
  });
}
