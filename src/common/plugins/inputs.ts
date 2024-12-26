import { PluginConfig } from '../../config';
import InputRegistry, { Input } from '../InputRegistry';
import { loadPlugins } from './plugins';

export default function loadInputs(config: PluginConfig<Input<any>>) {
  loadPlugins(config, 'inputs', InputRegistry.addInput);
}
