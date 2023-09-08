import { BatshitEvent } from "./events";

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
  data: T;
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
