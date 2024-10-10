import InputRegistry from '../common/InputRegistry';
import setup from '../common/setup';
import config from './client-config';

setup(config);

console.log(InputRegistry.getAllInputs());
