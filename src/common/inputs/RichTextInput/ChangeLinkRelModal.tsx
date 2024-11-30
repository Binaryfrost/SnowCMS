import { Button, Checkbox, Code, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';

interface Rel {
  nofollow: boolean
  noreferrer: boolean
  sponsored: boolean
  ugc: boolean
}

interface Props {
  current: Rel
  close: (rel?: Rel) => void
}

function ChangeLinkRelModal({ current, close }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      nofollow: current.nofollow || false,
      noreferrer: current.noreferrer || false,
      sponsored: current.sponsored || false,
      ugc: current.ugc || false
    }
  });

  return (
    <Stack>
      <Checkbox label="No Follow" {...form.getInputProps('nofollow', { type: 'checkbox' })}
        key={form.key('nofollow')} />
      <Checkbox label="No Referrer" {...form.getInputProps('noreferrer', { type: 'checkbox' })}
        key={form.key('noreferrer')} />
      <Checkbox label="Sponsored" {...form.getInputProps('sponsored', { type: 'checkbox' })}
        key={form.key('sponsored')} />
      <Checkbox label="User-Generated Content" {...form.getInputProps('ugc', { type: 'checkbox' })}
        key={form.key('ugc')} />

      <Text c="dimmed">All links have the <Code>noopener</Code> value.</Text>

      <Group justify="end">
        <Button variant="default" onClick={() => close()}>Cancel</Button>
        <Button onClick={() => {
          if (form.validate().hasErrors) return;
          close(form.getValues());
        }}>Change ID</Button>
      </Group>
    </Stack>
  );
}

const MODAL_ID = 'change_link_rel_modal';
export function showChangeLinkRelModal({ current, close }: Props) {
  modals.open({
    title: 'Change Link Relationshop',
    modalId: MODAL_ID,
    children: <ChangeLinkRelModal current={current} close={(newId) => {
      modals.close(MODAL_ID);
      close(newId);
    }} />
  });
}
