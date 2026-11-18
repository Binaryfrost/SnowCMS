import ReadOnlyDTO from '../../lib/client/dto/ReadOnlyDTO';
import {
  callHook as callHookRegistry,
  callHttpHook as callHttpHookRegistry,
  Hooks
} from '../plugins/hooks';
import MvcObject from './MvcObject';

export default class Service extends MvcObject {
  protected async callHook<K extends keyof Hooks>(name: K, data: Parameters<Hooks[K]>[0]) {
    const payload = name.startsWith('after') ? ReadOnlyDTO(data as any) : data;
    return callHookRegistry(name, payload as any);
  }

  protected callHttpHook(website: any, collection: any, reason: any) {
    return callHttpHookRegistry(website, collection, reason);
  }
}
