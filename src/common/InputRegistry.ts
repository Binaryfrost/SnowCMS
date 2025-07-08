/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Request } from 'express';
import type { FunctionComponent } from 'react';
import type { Website } from './types/Website';
import type { Collection } from './types/Collection';

export type ValidatorFunction<T> = (value: T) => boolean

export interface InputProps<T, S> {
  /**
   * The Input's value
   */
  value: T
  /**
   * The values of all Inputs, keyed by their field name
   */
  values: Record<string, any>
  /**
   * The Input's settings
   */
  settings: S
  /**
   * The name set in the Collection settings
   */
  name: string
  /**
   * The field name (used in API responses) set in the Collection settings
   */
  fieldName: string
  /**
   * The description set in the Collection settings
   */
  description?: string

  onChange: (value: T) => void
  registerValidator: (fn: ValidatorFunction<T>) => void
  unregisterValidator: () => void
}

export type ValidateFunctionErrorObject<T> = { [x in keyof Partial<T>]: string | null }
export type ValidateFunction<T, R> = (value: T) => R
export type SetErrorFunction<R> = (error: R) => void
export type RegisterValidatorFunction<T> = InputProps<T, any>['registerValidator']
export type UnregisterValidatorFunction = InputProps<any, any>['unregisterValidator']

type RenderHtmlType<T> = string | T | Object;

interface BaseInput<T, S> {
  /**
   * Input ID, must be unique and should include
   * your plugin name for namespacing purposes.
   * Shown in the Collection settings.
   *
   * **You should not change this after using the
   * Input as doing so will result in null being
   * returned anywhere where this Input is used.**
   */
  id: string

  /**
   * Name shown for this input in the Collection settings
   */
  name: string

  /**
   * Description shown for this input in the Collection settings
   */
  description?: string

  /**
   * Called before sending data to server (client-side only)
   */
  serialize: (data: T) => string
  /**
   * Called before rendering input and HTML (client and server side)
   */
  deserialize: (data: string) => T

  /**
   * Called client-side to render input in CMS.
   *
   * The Collection Input name and description will be passed as props.
   */
  renderInput: FunctionComponent<InputProps<T, S>>

  /**
   * Called client-side to determine whether to show in input library
   * and server-side to validate that the request does not contain input.
   * Defaults to true
   */
  isAllowed?: (website: Website, collection: Collection) => boolean

  /**
   * Called server-side to ensure that the input value is valid.
   * You should throw an error if it is invalid.
   */
  validate?: (serializedValue: string, deserialize: BaseInput<T, S>['deserialize'],
    settings: S | null, req: Request) => void | Promise<void>

  /**
   * Called server-side when page is requested through API
   * with the query parameter `?render=true`.
   *
   * If you don't want the input to be rendered as HTML,
   * return a JSON object. You can also return a non-HTML string.
   */
  renderHtml: (value: T, settings: S | null, req: Request) =>
    RenderHtmlType<T> | Promise<RenderHtmlType<T>>
}

interface SettingsProps<S> {
  settings: S
  onChange: (value: S) => void
  registerValidator: (fn: (value: S) => boolean) => void
  unregisterValidator: () => void
}

interface InputWithSettings<T, S> extends BaseInput<T, S> {
  /**
   * The default settings that will be merged with the configured settings.
   * This ensures that all settings are available, even before any are
   * configured and that new settings can be added at any time without
   * breaking existing Collection Inputs.
   */
  defaultSettings: S

  /**
   * Called client-side to render settings in Collection settings
   */
  renderSettings: FunctionComponent<SettingsProps<S>>

  /**
   * Called server-side to ensure that the input value is valid.
   * You should throw an error if it is invalid.
   */
  validateSettings?: (settings: S, req: Request) => void | Promise<void>
}

// This ensures that if one of these are defined, the other one has to be as well
interface InputWithoutSettings<T, S> extends BaseInput<T, S> {
  defaultSettings?: never
  renderSettings?: never
  validateSettings?: never
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
