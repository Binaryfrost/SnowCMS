import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';
import { useForm } from '@mantine/form';
import { ActionIcon, Box, Checkbox, Group, NumberInput, NumberInputProps, TextInput,
  Input as MantineInput, Stack, Paper, Text } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { v4 as uuid } from 'uuid';
import { Input } from '../InputRegistry';
import IconButton from '../../client/components/IconButton';
import FlexGrow from '../../client/components/FlexGrow';

type Value = Record<string, string>

interface TempValue {
  key: string
  value: string
  id: string
}

interface KeyValueInputSettings {
  maxInputs?: number
  maxKeyLength?: number
  maxValueLength?: number
  required?: boolean
}

const input: Input<Value, KeyValueInputSettings> = {
  id: 'key-value',
  name: 'Key Value',

  deserialize: JSON.parse,
  serialize: JSON.stringify,

  renderInput: () => forwardRef((props, ref) => {
    const convertToTempInput = (value: Value) => {
      if (!props.value) return [];
      return Object.entries(value).map(([k, v]) => ({
        key: k,
        value: v,
        id: uuid()
      }));
    };

    const [inputs, handlers] = useListState<TempValue>(convertToTempInput(props.value));
    const [error, setError] = useState(null);

    useImperativeHandle(ref, () => ({
      getValues: () => inputs.reduce((a, c) => ({
        ...a,
        [c.key]: c.value
      }), {}),
      hasError: () => {
        setError(null);

        if (props.settings?.required && inputs.length === 0) {
          setError(`${input.name} is required`);
          return true;
        }

        if (inputs.some((e) => !e.key || !e.value)) {
          setError('Some inputs have an empty key or value');
          return true;
        }

        return false;
      }
    }));

    const update = useCallback((id: string, key: string, value: string) => {
      handlers.applyWhere(
        (item) => item.id === id,
        (item) => ({
          ...item,
          [key]: value
        })
      );
    }, []);

    return (
      <Box>
        <Group>
          <Box>
            <MantineInput.Label required={props.settings?.required}>
              {props.name}
            </MantineInput.Label>
            {props.description && (
              <MantineInput.Description>{props.description}</MantineInput.Description>
            )}
          </Box>

          <IconButton label="Add Input">
            <ActionIcon onClick={() => handlers.append({
              id: uuid(),
              key: '',
              value: ''
            })} disabled={props.settings?.maxInputs <= inputs.length}>
              <IconPlus />
            </ActionIcon>
          </IconButton>
        </Group>

        <Paper withBorder p="sm">
          <Stack gap="xs">
            {inputs.length === 0 ? (
              <Text c="dimmed">No inputs exist yet for this Key Value Input. Add one by clicking the add button above.</Text>
            ) : inputs.map((i) => (
              <Paper withBorder p="xs" key={i.id}>
                <Group>
                  <FlexGrow>
                    <TextInput label="Key" value={i.key}
                      maxLength={props.settings?.maxKeyLength || undefined}
                      onChange={(e) => update(i.id, 'key', e.target.value)} />
                  </FlexGrow>

                  <FlexGrow>
                    <TextInput label="Value" value={i.value}
                      maxLength={props.settings?.maxValueLength || undefined}
                      onChange={(e) => update(i.id, 'value', e.target.value)} />
                  </FlexGrow>

                  <IconButton label="Remove Input">
                    <ActionIcon onClick={() => handlers.filter((e) => e.id !== i.id)}>
                      <IconMinus />
                    </ActionIcon>
                  </IconButton>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
        {error && <MantineInput.Error>{error}</MantineInput.Error>}
      </Box>
    );
  }),

  deserializeSettings: JSON.parse,
  serializeSettings: JSON.stringify,

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        maxInputs: props.settings?.maxInputs || 0,
        maxKeyLength: props.settings?.maxKeyLength || 0,
        maxValueLength: props.settings?.maxValueLength || 0,
        required: props.settings?.required ?? false
      }
    });

    useImperativeHandle(ref, () => ({
      getValues: form.getValues
    }));

    const lengthLimitDescription = 'Set to 0 to disable length limit';
    const LengthInput = memo(({ ...p }: NumberInputProps) => (
      <NumberInput description={lengthLimitDescription} required
        allowNegative={false} allowDecimal={false} {...p} />
    ));

    return (
      <>
        <LengthInput label="Max Inputs" {...form.getInputProps('maxInputs')}
          key={form.key('maxInputs')} />
        <LengthInput label="Max Key Length" {...form.getInputProps('maxKeyLength')}
          key={form.key('maxKeyLength')} />
        <LengthInput label="Max Value Length" {...form.getInputProps('maxValueLength')}
          key={form.key('maxValueLength')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </>
    );
  }),

  renderHtml: (value) => value
};

export default input;
