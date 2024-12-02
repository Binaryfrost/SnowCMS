import { Button, Checkbox, Group, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import type { VideoProps } from './Video';

interface Props {
  close: (video?: VideoProps) => void
}

function VideoModal({ close }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      src: '',
      height: null,
      width: null,
      autoplay: false,
      controls: true,
      loop: false
    },
    validate: {
      src: (value) => (!value ? 'URL is required' : null)
    },
    validateInputOnChange: true
  });

  return (
    <Stack>
      <TextInput label="URL" required {...form.getInputProps('src')} key={form.key('src')} />
      <Group>
        <NumberInput label="Height" {...form.getInputProps('height')}
          key={form.key('height')} />
        <NumberInput label="Width" {...form.getInputProps('width')}
          key={form.key('width')} />
      </Group>
      <Group>
        <Checkbox label="Auto Play" {...form.getInputProps('autoplay', { type: 'checkbox' })}
          key={form.key('autoplay')} />
        <Checkbox label="Controls" {...form.getInputProps('controls', { type: 'checkbox' })}
          key={form.key('controls')} />
        <Checkbox label="Loop" {...form.getInputProps('loop', { type: 'checkbox' })}
          key={form.key('loop')} />
      </Group>

      <Group justify="end">
        <Button variant="default" onClick={() => close()}>Cancel</Button>
        <Button onClick={() => {
          if (!form.validate().hasErrors) {
            close(form.getValues());
          }
        }}>Insert Video</Button>
      </Group>
    </Stack>
  );
}

const MODAL_ID = 'video_modal';
export function showVideoModal({ close }: Props) {
  modals.open({
    title: 'Insert Video',
    modalId: MODAL_ID,
    children: <VideoModal close={(video) => {
      modals.close(MODAL_ID);
      close(video);
    }} />
  });
}
