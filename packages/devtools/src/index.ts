export type Devtools<T, Q> = {
  for: (display: string) => DevtoolsListener<T, Q>;
};

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

declare global {
  var __BATSHIT_DEVTOOLS__: Devtools<any, any> | undefined;
}

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

export type BatshitEvent<Q, T> =
  | CreateEvent<T, Q>
  | QueueEvent<T, Q>
  | FetchEvent<T, Q>
  | DataEvent<T, Q>
  | ErrorEvent<T, Q>;

export type CreateEvent<T, Q> = {
  type: "create";
  name: string;
  seq: number;
};

export type QueueEvent<T, Q> = {
  type: "queue";
  name: string;
  seq: number;
  batch: Q[];
  start: number;
  latest: number;
  scheduled: number;
};

export type FetchEvent<T, Q> = {
  type: "fetch";
  name: string;
  seq: number;
  batch: Q[];
};

export type DataEvent<T, Q> = {
  type: "data";
  name: string;
  seq: number;
  data: T[];
};

export type ErrorEvent<T, Q> = {
  type: "error";
  name: string;
  seq: number;
  error: Error;
};

export type BatshitDevtoolsState<T, Q> = {
  [batcher: string]: BatcherState<T, Q>;
};

export type BatcherState<T, Q> = {
  sequences: {
    [seq: number]: SequenceState<T, Q>;
  };
};

export type SequenceState<T, Q> = {
  batch: Q[];
  fetching: boolean;
  data: T[];
  error: Error | null;
};

export const reduce = <T, Q>(
  events: BatshitEvent<Q, T>[],
  initialState: BatshitDevtoolsState<T, Q> = {}
): BatshitDevtoolsState<T, Q> => {
  return events.reduce(
    (state: BatshitDevtoolsState<T, Q>, event: BatshitEvent<Q, T>) => {
      return {
        ...state,
        [event.name]: {
          ...state?.[event.name],
          sequences: {
            ...state?.[event.name]?.sequences,
            [event.seq]: {
              ...state?.[event.name]?.sequences[event.seq],
              batch:
                event.type === "queue"
                  ? event.batch
                  : state?.[event.name]?.sequences[event.seq]?.batch,
              data:
                event.type === "data"
                  ? event.data
                  : state?.[event.name]?.sequences[event.seq]?.data,
              error:
                event.type === "error"
                  ? event.error
                  : state?.[event.name]?.sequences[event.seq]?.error,
              fetching:
                event.type === "fetch"
                  ? true
                  : event.type === "data" || event.type === "error"
                  ? false
                  : state?.[event.name]?.sequences[event.seq]?.fetching,
            },
          },
        },
      };
    },
    initialState
  );
};
