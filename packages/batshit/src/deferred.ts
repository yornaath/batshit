/**
 * A deffered value that can be resolved at a later time outside of its closure.
 * @generic T - value of the deffered
 */
export type Deferred<T> = {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
  value: Promise<T>
}

/**
 * Create a new Deffered
 *
 * @generic T - value of the deffered
 * @returns Deferred<T>
 */
export const deferred = <T>(): Deferred<T> => {
  let resolve!: Deferred<T>['resolve']
  let reject!: Deferred<T>['reject']

  const value = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return {
    resolve,
    reject,
    value,
  }
}

/**
 * Type guard for Deffered values.
 *
 * @generic T - value of the deffered
 * @param value any
 * @returns value is Deferred<T>
 */
export const isDeferred = <T>(value: any): value is Deferred<T> =>
  typeof value === 'object' &&
  value !== null &&
  'resolve' in value &&
  'reject' in value &&
  'value' in value &&
  'then' in value.value