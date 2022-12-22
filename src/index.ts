import { deferred } from "./deferred"

/**
 * Batcher.
 * A batch manager that will batch requests for a certain data type within a given window.
 * 
 * @generic T - The type of the data.
 * @generic Q - item query type
 */
export type Batcher<T, Q> = {
  /**
   * Schedule a get request for a query.
   * 
   * @generic T - The type of the data.
   * @generic Q - item query type
   * @param query Q
   * @returns Promise<T>
   */
  fetch: (query: Q) => Promise<T>
}

/**
 * Config needed to create a Batcher
 * 
 * @generic T - The type of the data.
 * @generic Q - item query type
 */
export type BatcherConfig<T, Q> = {
  /**
   * The function that makes the batched request for the current batch queries
   * 
   * @param queries Q[]
   * @returns Promise<T[]
   */
  fetcher: (queries: Q[]) => Promise<T[]>
  /**
   * The scheduling function.
   */
  scheduler?: BatcherScheduler
  /**
   * Correlate an item by its query. Used to extract the correct value from the batch of items
   * to the correct query used to fetch it.
   * 
   * @param query Q
   * @returns string
   */
  equality: keyof T | ((item:T, query: Q) => boolean)
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
 * Create a euquality check to check if the query matches a given key on the item data.
 * 
 * @param key keyof T
 * @returns (item:T, query: Q) => boolean
 */
export const keyEquality = <T, Q>(key: keyof T) => (item:T, query: Q) => 
  item[key] === query

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
 * @generic Q - item query type
 * @param config BatcherConfig<T, Q>
 * @returns Batcher<T, Q>
 */
export const Batcher = <T, Q>(config: BatcherConfig<T, Q>): Batcher<T, Q> => {
  let batch = new Set<Q>()
  let currentRequest = deferred<T[]>()
  let timer: NodeJS.Timeout | undefined = undefined
  let start: number | null = null
  let latest: number | null = null

  const scheduler: BatcherScheduler = config.scheduler ?? windowScheduler(10)
  const equality = typeof config.equality == "function" ? config.equality : keyEquality(config.equality)

  const fetch = (query: Q): Promise<T> => {
    batch.add(query)
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

    return currentRequest.value.then(data => data.find(item => equality(item, query)) as T)
  }

  return { fetch }
}