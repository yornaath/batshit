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
  data: T;
};

export type ErrorEvent<T, Q> = {
  type: "error";
  name: string;
  seq: number;
  error: Error;
};
