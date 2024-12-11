/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Request } from 'express';
import type { ForwardRefExoticComponent, RefAttributes, FunctionComponent } from 'react';
import type { Website } from './types/Website';
import type { Collection } from './types/Collection';

export interface InputRef<T> {
  // It's possible for the Input to not return a value (e.g. notices/alerts)
  getValues?: () => T
  hasError?: () => boolean | Promise<boolean>
  notifyFormUpdate?: (values: Record<string, any>) => void
}

export interface InputProps<T, S> {
  value: T
  settings: S
  name: string
  fieldName: string
  description?: string
  notifyChanges: () => void
}

type RenderHtmlType<T> = string | T | Object;

interface BaseInput<T, S> {
  // Provided ID (in this example, "text")
  id: string

  // Name and description shown for this input in the Collection settings
  name: string
  description?: string

  /*
   * Serialization methods.
   * serialize is called before sending data to server (client-side only)
   * deserialize is called before rendering input and HTML (client and server side)
   */
  serialize: (data: T) => string
  deserialize: (data: string) => T

  // Called client-side to render input in CMS; remember to call useImperativeHandle with InputRef object if the Input has a value
  /*
   * Example usage:
   * const InputComponent = input.renderInput();
   * <InputComponent value={value} settings={settings} label={name} description={description} />
   */
  renderInput: () =>
    ForwardRefExoticComponent<InputProps<T, S> & RefAttributes<InputRef<T>>> |
    FunctionComponent<InputProps<T, S>> | undefined

  /*
   * Called client-side to determine whether to show in input library
   * and server-side to validate that the request does not contain input.
   * Defaults to true
   */
  isAllowed?: (website: Website, collection: Collection) => boolean

  /*
   * Called server-side when page is requested through API
   * with the query parameter `?render=true`.
   * If you don't want the input to be rendered as HTML,
   * return a JSON object. You can also return a non-HTML string.
   */
  renderHtml: (value: T, settings: S | null, req: Request) =>
    RenderHtmlType<T> | Promise<RenderHtmlType<T>>
}

interface SettingsProps<S> {
  settings: S
}

interface InputWithSettings<T, S> extends BaseInput<T, S> {
  // Called client-side to render settings in Collection settings
  renderSettings: () =>
    ForwardRefExoticComponent<SettingsProps<S> & RefAttributes<InputRef<S>>>
  serializeSettings: (data: S) => string
  deserializeSettings: (data: string) => S
}

// This ensures that if one of these is defined, the other one has to be as well
interface InputWithoutSettings<T, S> extends BaseInput<T, S> {
  renderSettings?: never
  serializeSettings?: never
  deserializeSettings?: never
}

/**
 * T is value type
 *
 * S is settings type, optional
 *
 */
export type Input<T, S = any> =
  InputWithoutSettings<T, S> | InputWithSettings<T, S>

const InputRegistry = new Map<string, Input<any>>();

export default {
  addInput<T = any>(input: Input<T>) {
    if (InputRegistry.has(input.id)) {
      throw new Error(`Input with ID ${input.id} already exists in Input Registry`);
    }

    InputRegistry.set(input.id, input);
  },
  getInput<T = any, S = any>(id: string): Input<T, S> | undefined {
    if (!InputRegistry.has(id)) {
      console.warn(`Requested input ${id} does not exist in Input Registry`);
    }

    return InputRegistry.get(id);
  },
  getAllInputs(): Record<string, Input<any, any>> {
    return [...InputRegistry.entries()].reduce((a, [key, input]) => ({
      ...a,
      [key]: input
    }), {});
  }
};
