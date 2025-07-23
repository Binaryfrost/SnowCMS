import { type ReactNode } from 'react';
import { ActionIcon, Box, Group, Input, Paper, Stack, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import IconButton from '../../../client/components/IconButton';

export interface InputArrayProps<T> {
  name: string
  description?: string
  maxInputs?: number
  required: boolean
  children: (input: T, index: number) => ReactNode
  inputs: T[]
  addInput: () => void
  removeInput: (index: number) => void
  error?: string
}

export default function InputArray<T>(props: InputArrayProps<T>) {
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
            <Paper withBorder p="xs" key={index}>
              <Group>
                {props.children(input, index)}

                <IconButton label="Remove Input">
                  <ActionIcon onClick={() => props.removeInput(index)}>
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
