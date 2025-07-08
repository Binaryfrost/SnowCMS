import { Alert, Button, Checkbox, Group, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import type { VideoProps } from './Video';
import { IconAlertCircle } from '@tabler/icons-react';

interface Props {
  src?: string
  height?: number
  width?: number
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  close: (video?: VideoProps) => void
}

function VideoModal({ src, height, width, autoplay, controls, loop, close }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      src: src || '',
      height: height || null,
      width: width || null,
      autoplay: autoplay ?? false,
      controls: controls ?? true,
      loop: loop ?? false
    },
    validate: {
      src: (value) => (!value ? 'URL is required' : null)
    },
    validateInputOnChange: true
  });

  return (
    <Stack>
      <Alert icon={<IconAlertCircle />} color="yellow">
        Avoid using this video embed option for large files. Instead, use the YouTube
        embed option as YouTube automatically optimizes playback for different devices,
        internet speeds, and screen sizes.
      </Alert>
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
export function showVideoModal({ close, ...props }: Props) {
  modals.open({
    title: 'Insert Video',
    modalId: MODAL_ID,
    children: <VideoModal {...props} close={(video) => {
      modals.close(MODAL_ID);
      close(video);
    }} />
  });
}
