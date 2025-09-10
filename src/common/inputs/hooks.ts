import { useEffect, useState } from 'react';
import type {
  RegisterValidatorFunction,
  SetErrorFunction,
  UnregisterValidatorFunction,
  ValidateFunction,
  ValidateFunctionErrorObject
} from '../InputRegistry';

type StringError = string | null
type ObjectError<T> = ValidateFunctionErrorObject<T> | null
type RequiredStruct<T> = { [x in keyof T]?: boolean }

export function useInputValidator<T>(
  validate: ValidateFunction<T, StringError>,
  registerValidator: RegisterValidatorFunction<T>,
  unregisterValidator: UnregisterValidatorFunction
): StringError;

export function useInputValidator<T>(
  validate: ValidateFunction<T, ObjectError<T>>,
  registerValidator: RegisterValidatorFunction<T>,
  unregisterValidator: UnregisterValidatorFunction
): ObjectError<T>;

/**
 * A hook that registers your validator function, runs it as needed,
 * and returns any errors either as a string or object, depending on
 * your validation function's return type.
 * 
 * The error returned will be null if there are no errors.
 */
export function useInputValidator<T>(
  validate: ValidateFunction<T, StringError> | ValidateFunction<T, ObjectError<T>>,
  registerValidator: RegisterValidatorFunction<T>,
  unregisterValidator: UnregisterValidatorFunction
) {
  const [error, setError] = useState<StringError | ObjectError<T>>(null);

  useEffect(() => {
    registerValidator((v) => {
      const err = validate(v);
      setError(err);

      const hasError = typeof err === 'object' && err !== null ?
        Object.values(err).some(Boolean) : !!err;
      return !!hasError;
    });
    return () => unregisterValidator();
  }, []);

  return error;
}

/**
 * A hook that handles settings changes and merges
 * the initial and current settings.
 * 
 * Returns a helper function to change individual settings.
 */
export function useSettingsHandler<T>(
  settings: T,
  onChange: (v: T) => void):
  <K extends keyof T>(setting: K, value: T[K]) => void {

  return (setting, value) => {
    onChange({
      ...settings,
      [setting]: value
    });
  }
}
