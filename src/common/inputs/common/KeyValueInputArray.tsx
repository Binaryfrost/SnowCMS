import { TextInput } from '@mantine/core';
import FlexGrow from '../../../client/components/FlexGrow';
import InputArray, { InputArrayProps } from './InputArray';

type KeyValueArray = [string, string][]

export interface KeyValueInputArrayProps extends Pick<InputArrayProps<any>, 'name' | 'description' | 'error' | 'required' | 'maxInputs'> {
  value: KeyValueArray
  labels?: [string, string]
  maxKeyLength?: number
  maxValueLength?: number
  onChange: ((value: KeyValueArray | ((value: KeyValueArray) => KeyValueArray)) => void)
}

export default function KeyValueInputArray({
  value, labels = ['Key', 'Value'], maxKeyLength, maxValueLength, onChange, ...inputArrayProps
}: KeyValueInputArrayProps) {
  const KEY_VALUE_POSITIONS = {
    'key': 0,
    'value': 1
  };

  function update(index: number, input: keyof typeof KEY_VALUE_POSITIONS, v: string) {
    if (index > value.length - 1) return;
    onChange((value) => {
      value[index][KEY_VALUE_POSITIONS[input]] = v;
      return value;
    });
  }

  return (
    <InputArray {...inputArrayProps} inputs={value}
      addInput={() => {
        onChange((v) => [
          ...v,
          ['', '']
        ]);
      }} removeInput={(index) => {
        onChange((v) => {
          v.splice(index, 1);
          return v;
        });
      }}>
      {([key, value], index) => (
        <>
          <FlexGrow>
            <TextInput label={labels[0]} value={key}
              maxLength={maxKeyLength || undefined}
              onChange={(e) => update(index, 'key', e.target.value)} />
          </FlexGrow>

          <FlexGrow>
            <TextInput label={labels[1]} value={value}
              maxLength={maxValueLength || undefined}
              onChange={(e) => update(index, 'value', e.target.value)} />
          </FlexGrow>
        </>
      )}
    </InputArray>
  );
}