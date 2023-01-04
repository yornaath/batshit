import {
  BatshitDevtoolsState,
  injectDevtools,
  reduce,
} from "@yornaath/batshit-devtools";
import React from "react";

let subscribe: (() => void) | undefined;
let state: BatshitDevtoolsState<any, any> = {};

const getSnapshot = () => state;
const getServerSnapshot = () => state;

injectDevtools((event) => {
  state = reduce([event], state);
  subscribe?.();
});

export const useDevtoolsState = () => {
  return React.useSyncExternalStore<BatshitDevtoolsState<any, any>>(
    (callback) => {
      subscribe = callback;
      return () => {
        subscribe = undefined;
      };
    },
    getServerSnapshot
  );
};
