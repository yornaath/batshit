import { BatcherConfig } from ".";

export type Devtools<T, Q> = {
  for: (display: string) => {
    create: (_event: { seq: number; config: BatcherConfig<T, Q> }) => void;
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
};

declare global {
  var __BATSHIT_DEVTOOLS__: Devtools<any, any> | undefined;
}

export const create = <T, Q>(
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
  config: BatcherConfig<T, Q>;
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
