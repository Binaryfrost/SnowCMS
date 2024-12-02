import { Button, Group, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';

interface Video {
  src: string
  height: number
  width: number
}

interface Props {
  close: (video?: Video) => void
}

const YOUTUBE_DOMAINS = ['youtube.com', 'youtube-nocookie.com', 'youtu.be'];

function YoutubeModal({ close }: Props) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      src: '',
      height: 480,
      width: 640
    },
    validate: {
      src: (value) => {
        if (!value.startsWith('https://')) return 'Enter the full YouTube video URL';
        if (!YOUTUBE_DOMAINS.some((domain) => value.includes(domain))) return 'Must be a YouTube video URL';

        return null;
      }
    },
    validateInputOnChange: true
  });

  return (
    <Stack>
      <TextInput label="URL" required {...form.getInputProps('src')} key={form.key('src')} />
      <Group>
        <NumberInput label="Height" required {...form.getInputProps('height')}
          key={form.key('height')} />
        <NumberInput label="Width" required {...form.getInputProps('width')}
          key={form.key('width')} />
      </Group>

      <Group justify="end">
        <Button variant="default" onClick={() => close()}>Cancel</Button>
        <Button onClick={() => {
          if (!form.validate().hasErrors) {
            close(form.getValues());
          }
        }}>Insert YouTube Video</Button>
      </Group>
    </Stack>
  );
}

const MODAL_ID = 'youtube_modal';
export function showYoutubeModal({ close }: Props) {
  modals.open({
    title: 'Insert YouTube Video',
    modalId: MODAL_ID,
    children: <YoutubeModal close={(video) => {
      modals.close(MODAL_ID);
      close(video);
    }} />
  });
}
