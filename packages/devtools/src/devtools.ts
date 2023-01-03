import {
  BatshitEvent,
  CreateEvent,
  DataEvent,
  ErrorEvent,
  FetchEvent,
  QueueEvent,
} from "./events";

export type Devtools<T, Q> = {
  /**
   * Creates a new devtools listener for a batcher by its name.
   *
   * @param display string - the display name of the batcher
   * @returns DevtoolsListener<T, Q>
   */
  for: (display: string) => DevtoolsListener<T, Q>;
};

/**
 * Declare the global devtools variable.
 */
declare global {
  var __BATSHIT_DEVTOOLS__: Devtools<any, any> | undefined;
}

/**
 * A devtools listener for a particualr batcher that picks up the relevant events.
 */
export type DevtoolsListener<T, Q> = {
  create: (_event: { seq: number }) => void;
  queue: (_event: {
    seq: number;
    query: Q;
    batch: Q[];
    start: number;
    latest: number;
    scheduled: number;
  }) => void;
  fetch: (_event: { seq: number; batch: Q[] }) => void;
  data: (_event: { seq: number; data: T[] }) => void;
  error: (_event: { seq: number; error: Error }) => void;
};

/**
 * Injects devtools into the global scope.
 *
 * @param onEvent (event: BatshitEvent<Q, T>) => void - the event listener
 * @returns void
 */
export const injectDevtools = <T, Q>(
  onEvent: (event: BatshitEvent<Q, T>) => void
) => {
  globalThis.__BATSHIT_DEVTOOLS__ = createDevtools(onEvent);
};

/**
 * Creates devtools.
 *
 * @param onEvent (event: BatshitEvent<Q, T>) => void - the event listener
 * @returns Devtools<T, Q>
 */
export const createDevtools = <T, Q>(
  onEvent: (event: BatshitEvent<Q, T>) => void
): Devtools<T, Q> => {
  return {
    for: (name: string) => ({
      create: (_event) => {
        const event: CreateEvent<T, Q> = { ..._event, name, type: "create" };
        onEvent(event);
      },
      queue: (_event) => {
        const event: QueueEvent<T, Q> = {
          ..._event,
          name: name,
          type: "queue",
        };
        onEvent(event);
      },
      fetch: (_event) => {
        const event: FetchEvent<T, Q> = { ..._event, name, type: "fetch" };
        onEvent(event);
      },
      data: (_event) => {
        const event: DataEvent<T, Q> = { ..._event, name, type: "data" };
        onEvent(event);
      },
      error: (_event) => {
        const event: ErrorEvent<T, Q> = { ..._event, name, type: "error" };
        onEvent(event);
      },
    }),
  };
};
