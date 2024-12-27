import { Box, Button, ColorInput, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { AlertProps } from './Alert';

interface Props {
  current?: AlertProps
  close: (alert?: AlertProps) => void
}

function AlertModal({ current, close }: Props) {
  const form = useForm<AlertProps>({
    initialValues: {
      bg: current?.bg || '#fff3cd',
      color: current?.color || '#212529',
      text: current?.text || ''
    },
    validate: {
      bg: (value) => (!value ? 'Background color is required' : null),
      color: (value) => (!value ? 'Text color is required' : null),
      text: (value) => (!value ? 'Text is required' : null)
    },
    validateInputOnChange: true
  });

  // Default colors are from Bootstrap https://getbootstrap.com/docs/5.3/customize/color/
  return (
    <Stack>
      <Group grow>
        <ColorInput label="Background Color" required
          swatches={[
            // Light mode
            '#cfe2ff', '#d1e7dd', '#f8d7da', '#fff3cd', '#cff4fc', '#fcfcfd', '#ced4da',
            // Dark mode
            '#031633', '#051b11', '#2c0b0e', '#332701', '#032830', '#343a40', '#1a1d20'
          ]}
          {...form.getInputProps('bg')} />
        <ColorInput label="Text Color" required
          swatches={['#212529', '#000000', '#ffffff', '#585b5e', '#e9ecef',
            '#8f9193', '#f8f9fa', '#0d6efd', '#198754', '#dc3545']}
          {...form.getInputProps('color')} />
      </Group>

      <Textarea label="Text" required {...form.getInputProps('text')} />

      <Box>
        <Text>Preview</Text>
        <Paper withBorder p="sm">
          <Paper p="sm" bg={form.values.bg}>
            <Text c={form.values.color}>{form.values.text || 'Type text above for it to appear here'}</Text>
          </Paper>
        </Paper>
      </Box>

      <Group justify="end">
        <Button variant="default" onClick={() => close()}>Cancel</Button>
        <Button onClick={() => {
          if (!form.validate().hasErrors) {
            close(form.getValues());
          }
        }}>Insert Alert</Button>
      </Group>
    </Stack>
  );
}

const MODAL_ID = 'alert_modal';
export function showAlertModal({ current, close }: Props) {
  modals.open({
    title: 'Insert Alert',
    modalId: MODAL_ID,
    size: 'lg',
    children: <AlertModal current={current} close={(alert) => {
      modals.close(MODAL_ID);
      close(alert);
    }} />
  });
}
