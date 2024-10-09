import InputRegistry from '../common/InputRegistry';
import { registerBuiltInInputs } from '../common/inputs';

registerBuiltInInputs();

console.log(InputRegistry.getInput('text'));
