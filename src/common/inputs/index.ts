// Registers all built-in Inputs
import InputRegistry from '../InputRegistry';

import TextInput from './TextInput';

export function registerBuiltInInputs() {
  InputRegistry.addInput(TextInput);
}
