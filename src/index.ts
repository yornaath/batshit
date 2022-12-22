import { deferred } from "./deferred"

/**
 * Batcher.
 * A batch manager that will batch requests for a certain data type within a given window.
 * 
 * @generic T - The type of the data.
 * @generic ID extends keyof T.
 */
export type Batcher<T, ID extends keyof T> = {
  /**
   * Schedule a get request by the data types id field.
   * 
   * @param id T[ID]
   * @returns Promise<T>
   */
  fetch: (id: T[ID]) => Promise<T>
}

/**
 * Config needed to create a Batcher
 * 
 * @generic T - The type of the data.
 * @generic ID extends keyof T.
 */
export type BatcherConfig<T, ID extends keyof T> = {
  /**
   * The key in the data type that is the unique identifier.
   */
  idKey: ID,
  /**
   * The function that makes the batched request for the current batch if item ids.
   * 
   * @param ids T[ID][]
   * @returns Promise<T[]
   */
  fetcher: (ids: T[ID][]) => Promise<T[]>
  /**
   * The scheduling function.
   */
  scheduler?: BatcherScheduler
}

/**
 * 
 */
export type BatcherScheduler = {
  /**
   * A scheduler function.
   * 
   * @param start number - time stamp when the current batch started queuing fetches.
   * @param latest number - time stamp of the latest queued fetch.
   * @returns number - the number of ms to wait from latest queued fetch until executing batchh fetch call.
   */
  (start: number, latest: number): number
}

/**
 * Give a window in ms where all queued fetched made within the window will be batched into
 * one singler batch fetch call.
 * 
 * @param ms number
 * @returns BatcherScheduler
 */
export const windowScheduler: (ms: number) => BatcherScheduler = (ms) => (start, latest) => {
  const spent = latest - start
  return ms - spent
}

/**
 * Give a buffer time in ms. Will give another buffer window when queueing a fetch.
 * 
 * @param ms number
 * @returns BatcherScheduler
 */
export const bufferScheduler: (ms: number) => BatcherScheduler = (ms) => () => {
  return ms
}

/**
 * Create a batch manager for a given collection of a data type.
 * Will batch all .get calls given inside a scheduled time window into a singel request.
 * 
 * @generic T - The type of the data.
 * @generic ID extends keyof T.
 * @param config BatcherConfig<T, ID>
 * @returns Batcher<T, ID>
 */
export const Batcher = <T, ID extends keyof T>(config: BatcherConfig<T, ID>): Batcher<T, ID> => {
  let batch = new Set<T[ID]>()
  let currentRequest = deferred<T[]>()
  let timer: NodeJS.Timeout | undefined = undefined
  let start: number | null = null
  let latest: number | null = null

  const scheduler: BatcherScheduler = config.scheduler ?? windowScheduler(10)

  const get = (id: T[ID]): Promise<T> => {
    batch.add(id)
    clearTimeout(timer)

    if (!start) start = Date.now()
    latest = Date.now()

    timer = setTimeout(() => {
      const req = config.fetcher([...batch])
      const _currentRequest = currentRequest
      req.then(data => {
        _currentRequest.resolve(data)
      })
      batch = new Set()
      currentRequest = deferred<T[]>()
      timer = undefined
      start = null
      latest = null
    }, scheduler(start, latest))
    return currentRequest.value.then(data => data.find(item => item[config.idKey] === id) as T)
  }

  return { fetch: get }
}