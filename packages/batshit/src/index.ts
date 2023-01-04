import type { DevtoolsListener } from "@yornaath/batshit-devtools";
import { Deferred, deferred } from "./deferred";
/**
 * Batcher.
 * A batch manager that will batch requests for a certain data type within a given window.
 *
 * @generic T - The type of the data.
 * @generic Q - item query type
 * @generic C - the context of the batcher passed to the fetcher function
 */
export type Batcher<T, Q, R = T> = {
  /**
   * Schedule a get request for a query.
   *
   * @generic T - The type of the data.
   * @generic Q - item query type
   * @param query Q
   * @returns Promise<T>
   */
  fetch: (query: Q) => Promise<R>;
};

/**
 * Config needed to create a Batcher
 *
 * @generic T - The type of the data.
 * @generic Q - item query type
 * @generic C - the context of the batcher passed to the fetcher function
 */
export type BatcherConfig<T, Q, R = T, C = any> = {
  /**
   * The function that makes the batched request for the current batch queries
   *
   * @param queries Q[]
   * @returns Promise<T[]
   */
  fetcher: (queries: Q[], ctx?: C) => Promise<T[]>;
  /**
   * The scheduling function.
   */
  scheduler?: BatcherScheduler;
  /**
   * Correlate an item by its query. Used to extract the correct value from the batch of items
   * to the correct query used to fetch it.
   *
   * @param query Q
   * @returns string
   */
  resolver: (items: T[], query: Q) => R;
  /**
   * Display name of the batcher. Used for debugging and devtools.
   */
  name?: string;

  ctx?: C;
};

/**
 * A function to schedule batch execution timing
 */
export type BatcherScheduler = {
  /**
   * A scheduler function.
   *
   * @param start number - time stamp when the current batch started queuing fetches.
   * @param latest number - time stamp of the latest queued fetch.
   * @returns number - the number of ms to wait from latest queued fetch until executing batchh fetch call.
   */
  (start: number, latest: number): number;
};

export type BatcherMemory<T, Q> = {
  seq: number;
  batch: Set<Q>;
  currentRequest: Deferred<T[]>;
  timer?: NodeJS.Timeout | undefined;
  start?: number | null;
  latest?: number | null;
};

/**
 * Create a batch manager for a given collection of a data type.
 * Will batch all .get calls given inside a scheduled time window into a singel request.
 *
 * @generic T - The type of the data.
 * @generic Q - item query type
 * @generic C - the context of the batcher passed to the fetcher function
 * @param config BatcherConfig<T, Q>
 * @returns Batcher<T, Q>
 */
export const create = <T, Q, R = T, C = any>(
  config: BatcherConfig<T, Q, R, C>,
  memory?: BatcherMemory<T, Q>
): Batcher<T, Q, ReturnType<typeof config["resolver"]>> => {
  const name = config.name ?? `batcher:${Math.random().toString(16).slice(2)})`;

  const scheduler: BatcherScheduler = config.scheduler ?? windowScheduler(10);

  const devtools: DevtoolsListener<any, any> | undefined =
    globalThis.__BATSHIT_DEVTOOLS__?.for(name);

  let mem: BatcherMemory<T, Q> = memory ?? {
    seq: 0,
    batch: new Set<Q>(),
    currentRequest: deferred<T[]>(),
    timer: undefined,
    start: null,
    latest: null,
  };

  devtools?.create({ seq: mem.seq });

  const fetch = (query: Q): Promise<R> => {
    if (!mem.start) mem.start = Date.now();
    mem.latest = Date.now();

    mem.batch.add(query);
    clearTimeout(mem.timer);

    const scheduled = scheduler(mem.start, mem.latest);

    devtools?.queue({
      seq: mem.seq,
      query,
      batch: [...mem.batch],
      scheduled,
      latest: mem.latest,
      start: mem.start,
    });

    mem.timer = setTimeout(() => {
      const currentSeq = mem.seq;
      const req = config.fetcher([...mem.batch], config.ctx);
      const currentRequest = mem.currentRequest;

      devtools?.fetch({ seq: currentSeq, batch: [...mem.batch] });

      mem.batch = new Set();
      mem.currentRequest = deferred<T[]>();
      mem.timer = undefined;
      mem.start = null;
      mem.latest = null;

      req
        .then((data) => {
          devtools?.data({ seq: currentSeq, data });
          currentRequest.resolve(data);
        })
        .catch((error) => {
          devtools?.error({ seq: currentSeq, error });
          currentRequest.reject(error);
        });

      mem.seq++;
    }, scheduled);

    return mem.currentRequest.value.then((items) =>
      config.resolver(items, query)
    );
  };

  return { fetch };
};

/**
 * Create a euquality check to check if the query matches a given key on the item data.
 *
 * @param key keyof T
 * @returns (item:T, query: Q) => boolean
 */
export const keyResolver =
  <T, Q>(key: keyof T) =>
  (items: T[], query: Q) =>
    items.find((item) => item[key] == query) as T;

/**
 * Give a window in ms where all queued fetched made within the window will be batched into
 * one singler batch fetch call.
 *
 * @param ms number
 * @returns BatcherScheduler
 */
export const windowScheduler: (ms: number) => BatcherScheduler =
  (ms) => (start, latest) => {
    const spent = latest - start;
    return ms - spent;
  };

/**
 * Give a buffer time in ms. Will give another buffer window when queueing a fetch.
 *
 * @param ms number
 * @returns BatcherScheduler
 */
export const bufferScheduler: (ms: number) => BatcherScheduler = (ms) => () => {
  return ms;
};
