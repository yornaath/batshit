import { deferred } from './deferred.mjs';

/**
 * Create a batch manager for a given collection of a data type.
 * Will batch all .get calls given inside a scheduled time window into a singel request.
 *
 * @generic T - The type of the data.
 * @generic Q - item query type
 * @param config BatcherConfig<T, Q>
 * @returns Batcher<T, Q>
 */
const create = (config) => {
    let batch = new Set();
    let currentRequest = deferred();
    let timer = undefined;
    let start = null;
    let latest = null;
    const scheduler = config.scheduler ?? windowScheduler(10);
    const equality = typeof config.equality == "function" ? config.equality : keyEquality(config.equality);
    const fetch = (query) => {
        batch.add(query);
        clearTimeout(timer);
        if (!start)
            start = Date.now();
        latest = Date.now();
        timer = setTimeout(() => {
            const req = config.fetcher([...batch]);
            const _currentRequest = currentRequest;
            req.then(data => {
                _currentRequest.resolve(data);
            });
            batch = new Set();
            currentRequest = deferred();
            timer = undefined;
            start = null;
            latest = null;
        }, scheduler(start, latest));
        return currentRequest.value.then(data => data.find(item => equality(item, query)));
    };
    return { fetch };
};
/**
 * Create a euquality check to check if the query matches a given key on the item data.
 *
 * @param key keyof T
 * @returns (item:T, query: Q) => boolean
 */
const keyEquality = (key) => (item, query) => item[key] === query;
/**
 * Give a window in ms where all queued fetched made within the window will be batched into
 * one singler batch fetch call.
 *
 * @param ms number
 * @returns BatcherScheduler
 */
const windowScheduler = (ms) => (start, latest) => {
    const spent = latest - start;
    return ms - spent;
};
/**
 * Give a buffer time in ms. Will give another buffer window when queueing a fetch.
 *
 * @param ms number
 * @returns BatcherScheduler
 */
const bufferScheduler = (ms) => () => {
    return ms;
};

export { bufferScheduler, create, keyEquality, windowScheduler };
//# sourceMappingURL=index.mjs.map
