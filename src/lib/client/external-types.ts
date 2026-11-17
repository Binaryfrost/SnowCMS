/**
 * The client library is intentionally dependency-less. However, some types
 * from external dependencies may be needed. These types go in this file.
 */


// DeepReadonly from utility-types
export declare type Primitive = string | number | bigint | boolean | symbol | null | undefined;
export declare type DeepReadonly<T> = T extends ((...args: any[]) => any) | Primitive ? T : T extends _DeepReadonlyArray<infer U> ? _DeepReadonlyArray<U> : T extends _DeepReadonlyObject<infer V> ? _DeepReadonlyObject<V> : T;
/** @private */
export interface _DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}
/** @private */
export declare type _DeepReadonlyObject<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};
