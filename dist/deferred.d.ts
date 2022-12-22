/**
 * A deffered value that can be resolved at a later time outside of its closure.
 * @generic T - value of the deffered
 */
export type Deferred<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    value: Promise<T>;
};
/**
 * Create a new Deffered
 *
 * @generic T - value of the deffered
 * @returns Deferred<T>
 */
export declare const deferred: <T>() => Deferred<T>;
/**
 * Type guard for Deffered values.
 *
 * @generic T - value of the deffered
 * @param value any
 * @returns value is Deferred<T>
 */
export declare const isDeferred: <T>(value: any) => value is Deferred<T>;
//# sourceMappingURL=deferred.d.ts.map