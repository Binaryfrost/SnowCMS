import { type ReactNode } from 'react';
import { ActionIcon, Box, Group, Input, Paper, Stack, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { UseListStateHandlers } from '@mantine/hooks';
import IconButton from '../../../client/components/IconButton';

export interface InputArrayBaseValue {
  id: string
}

interface Props<T> {
  name: string
  description?: string
  maxInputs?: number
  required: boolean
  children: (input: T, index?: number) => ReactNode
  inputs: T[]
  handlers: UseListStateHandlers<T>
  addInput: () => void
  inputRemoved?: (id: string, index: number) => void
  error?: string
}

export function updateInputArray<T extends InputArrayBaseValue>(handlers: UseListStateHandlers<T>,
  id: string, key: string, value: string) {
  handlers.applyWhere(
    (item) => item.id === id,
    (item) => ({
      ...item,
      [key]: value
    })
  );
}

// https://stackoverflow.com/a/63029283
type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never;
export type UpdateInputArrayWithoutHandler = DropFirst<Parameters<typeof updateInputArray>>;

export default function InputArray<T extends InputArrayBaseValue>(props: Props<T>) {
  return (
    <Box>
      <Group>
        <Box>
          <Input.Label required={props.required}>
            {props.name}
          </Input.Label>
          {props.description && (
            <Input.Description>{props.description}</Input.Description>
          )}
        </Box>

        <IconButton label="Add Input">
          <ActionIcon onClick={props.addInput}
            disabled={props.maxInputs > 1 && props.maxInputs <= props.inputs.length}>
            <IconPlus />
          </ActionIcon>
        </IconButton>
      </Group>

      <Paper withBorder p="sm">
        <Stack gap="xs">
          {props.inputs.length === 0 ? (
            <Text c="dimmed">
              No inputs exist yet for this Input array.
              Add one by clicking the add button above.
            </Text>
          ) : props.inputs.map((input, index) => (
            <Paper withBorder p="xs" key={input.id}>
              <Group>
                {props.children(input, index)}

                <IconButton label="Remove Input">
                  <ActionIcon onClick={() => {
                    props.handlers.filter((e) => e.id !== input.id);
                    if (props.inputRemoved) {
                      props.inputRemoved(input.id, index);
                    }
                  }}>
                    <IconMinus />
                  </ActionIcon>
                </IconButton>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>
      {props.error && <Input.Error>{props.error}</Input.Error>}
    </Box>
  );
}
