import { BatcherConfig } from ".";

declare global {
  var __BATSHIT_DEVTOOLS__: Devtools<any, any> | undefined;
}

export const Devtools = <T, Q>(
  onEvent: (event: BatshitEvent<Q, T>) => void
): Devtools<T, Q> => {
  return {
    for: (name: string) => ({
      create: (_event) => {
        const event: CreateEvent<T, Q> = { ..._event, name, type: "create" };
        onEvent(event);
      },
      add: (_event) => {
        const event: AddEvent<T, Q> = { ..._event, name: name, type: "add" };
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

export type Devtools<T, Q> = {
  for: (display: string) => {
    create: (_event: { seq: number; config: BatcherConfig<T, Q> }) => void;
    add: (_event: {
      seq: number;
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

export type BatshitEvent<Q, T> =
  | CreateEvent<T, Q>
  | AddEvent<T, Q>
  | FetchEvent<T, Q>
  | DataEvent<T, Q>
  | ErrorEvent<T, Q>;

export type CreateEvent<T, Q> = {
  type: "create";
  name: string;
  seq: number;
  config: BatcherConfig<T, Q>;
};
export type AddEvent<T, Q> = {
  type: "add";
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
