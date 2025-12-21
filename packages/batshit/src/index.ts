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

  /**
   * Execute the next batch.
   * This is useful to manually execute the next batch when the scheduler is not immediate.
   * @returns void
   */
  next: () => Promise<T>;

  /**
   * Abort the current batch.
   * @returns void
   */
  abort: () => void;
};

/**
 * Config needed to create a Batcher
 *
 * @generic T - The type of the data.
 * @generic Q - item query type
 * @generic C - the context of the batcher passed to the fetcher function
 */
export type BatcherConfig<T, Q, R> = {
  /**
   * The function that makes the batched request for the current batch queries
   *
   * @param queries Q[]
   * @returns Promise<T
   */
  fetcher: (queries: Q[], abortSignal: AbortSignal) => Promise<T>;

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
  resolver: Resolver<T, Q, R>;
  
  /**
   * Display name of the batcher. Used for debugging and devtools.
   */
  name?: string;
};

export type Resolver<T, Q, R> = {
  (items: T, query: Q): R
  index?: Record<string, R>;
}

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
  (start: number, latest: number, batchSize: number): Schedule;
};

/**
 * A schedule for when to execute a batched fetch call.
 */
export type Schedule =
  | number
  | "immediate"
  | "never"

export type Batch<T, Q> = {
  seq: number;
  state: BatchState,
  batch: Set<Q>;
  request: Deferred<T>;
  timer?: NodeJS.Timeout | undefined;
  start?: number | null;
  latest?: number | null;
  abortController: AbortController;
};

export type BatchState =
  | "idle"
  | "in-transit"
  | "complete"
  | "error"

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
export const create = <T, Q, R = T>(
  config: BatcherConfig<T, Q, R>
): Batcher<T, Q, ReturnType<(typeof config)["resolver"]>> => {
  const name = config.name ?? `batcher:${Math.random().toString(16).slice(2)})`;

  const scheduler: BatcherScheduler = config.scheduler ?? windowScheduler(10);

  const devtools: DevtoolsListener<any, any> | undefined =
    globalThis.__BATSHIT_DEVTOOLS__?.for(name);

  let seq = 0;

  let queue: Array<Batch<T, Q>> = [
    {
      seq,
      state: "idle",
      batch: new Set<Q>(),
      request: deferred<T>(),
      timer: undefined,
      start: null,
      latest: null,
      abortController: new AbortController(),
    }
  ]

  let current: Batch<T, Q> = queue[0]

  devtools?.create({ seq: current.seq });

  const nextBatch = () => {
    current = {
      seq: seq + 1,
      state: "idle",
      batch: new Set<Q>(),
      request: deferred<T>(),
      timer: undefined,
      start: null,
      latest: null,
      abortController: new AbortController(),
    }
    queue.push(current)
  };

  const fetchBatch = () => {
    current.state = "in-transit"
    const currentSeq = current.seq;

    const req = config.fetcher([...current.batch], current.abortController.signal);
    const currentRequest = current.request;

    devtools?.fetch({ seq: currentSeq, batch: [...current.batch] });

    nextBatch();

    req
      .then((data) => {
        current.state = "complete"
        devtools?.data({ seq: currentSeq, data });
        currentRequest.resolve(data);
      })
      .catch((error) => {
        current.state = "error"
        devtools?.error({ seq: currentSeq, error });
        currentRequest.reject(error);
      })
      .finally(() => {
        setTimeout(scheduleCleanup)
      });

    return req;
  };

  const scheduleCleanup = () => {
    queue = queue.filter(batch => batch.state === "idle" || batch.state === "in-transit")
  }

  const fetch = async (query: Q): Promise<R> => {
    if (!current.start) current.start = Date.now();
    current.latest = Date.now();

    current.batch.add(query);
    clearTimeout(current.timer);

    const scheduled = scheduler(current.start, current.latest, current.batch.size);

    devtools?.queue({
      seq: current.seq,
      query,
      batch: [...current.batch],
      scheduled,
      latest: current.latest,
      start: current.start,
    });

    if (scheduled === "immediate") {
      const req = current.request;
      fetchBatch();
      return req.value.then((items) => config.resolver(items, query));
    } else if (scheduled === "never") {
      return current.request.value.then((items) =>
        config.resolver(items, query)
      );
    } else {
      current.timer = setTimeout(fetchBatch, scheduled);
      return current.request.value.then((items) =>
        config.resolver(items, query)
      );
    }
  };

  const next = () => {
    return fetchBatch();
  };

  const abort = () => {
    const head = queue.pop()

    if(head && head.state === "in-transit") {
      head.abortController.abort();
      head.request.reject(new DOMException("Aborted", "AbortError"))
      nextBatch()
    }

    for(const batch of queue) {
      if(batch.state === "in-transit") {
        batch.abortController.abort();
        batch.request.reject(new DOMException("Aborted", "AbortError"))
      }
    }
  };

  return { fetch, next, abort };
};

/**
 * Resolve by item field of items when response is an array.
 * Create a euquality check to check if the query matches a given key on the item data.
 *
 * @param key keyof T
 * @returns (item:T extends Array<A>, query: Q) => A | null
 */
export const keyResolver =
  <T extends ReadonlyArray<any>, Q, R = T extends ReadonlyArray<infer A> ? A : never>(
    key: T extends ReadonlyArray<infer A> ? keyof A : never,
    config?: {
      indexed?: boolean
    }
  ): Resolver<T, Q, R> => {
    const isIndexex = config?.indexed

    const resolver: Resolver<T, Q, R> = (items: T, query: Q): R => {
      if (isIndexex) {
        if (!resolver.index) {
          resolver.index = {};
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const indexHash = item[key] as unknown as string;
            resolver.index[indexHash] = item;
          }
        }

        return (resolver.index[query as unknown as string] as R);
      }

      return items.find((item) => item[key] === query) ?? null
    }

    return resolver
  }

/**
 * Resolve by record index when response is an object.
 * Create a euquality check to check if the query matches a given key on the item data.
 *
 * @returns (item:T extends Record<_, A>, query: Q) => A
 */
export const indexedResolver =
  <T extends Record<any, any>, Q>() =>
    (itemsIndex: T, query: Q) =>
      itemsIndex[query] ?? null;

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

/**
 * Same as windowScheduler, will batch calls made within a window of time OR when the max batch size is reached.
 *
 * @param config: {windowMs: number; maxBatchSize: number;}
 * @returns BatcherScheduler
 */
export const windowedFiniteBatchScheduler: (config: {
  windowMs: number;
  maxBatchSize: number;
}) => BatcherScheduler =
  ({ windowMs, maxBatchSize }) =>
    (start, latest, batchSize) => {
      if (batchSize >= maxBatchSize) return "immediate";
      const spent = latest - start;
      return windowMs - spent;
    };

/**
 * Will batch calls when the max batch size is reached.
 *
 * @param config: {maxBatchSize: number;}
 * @returns BatcherScheduler
 */
export const maxBatchSizeScheduler: (config: {
  maxBatchSize: number;
}) => BatcherScheduler =
  ({ maxBatchSize }) =>
    (_start, _latest, batchSize) => {
      if (batchSize >= maxBatchSize) return "immediate";
      return "never";
    };
