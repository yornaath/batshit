import React from "react";
import { EventEmitter } from "events";
import {
  createDevtools,
  BatshitEvent,
  reduce,
  BatshitDevtoolsState,
} from "@yornaath/batshit-devtools";

const emitter = new EventEmitter();
let allEvents: BatshitEvent<any, any>[] = [];

const subscribe = (callback: () => void) => {
  emitter.addListener("event", callback);
  return () => {
    emitter.removeListener("event", callback);
  };
};

const getSnapshot = () => allEvents;

window.__BATSHIT_DEVTOOLS__ = createDevtools((event) => {
  allEvents = [...allEvents, event];
  emitter.emit("event", event);
});

export const BatshitDevtools = () => {
  const events = React.useSyncExternalStore<BatshitEvent<any, any>[]>(
    subscribe,
    getSnapshot
  );

  const state: BatshitDevtoolsState<any, any> = reduce(events);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        height: "600px",
        width: "900px",
        borderRadius: "4px",
        background: "rgb(30,30,30)",
        color: "rgb(250,250,250)",
        fontFamily: "Menlo, monospace",
      }}
    >
      <div
        style={{
          padding: "7px 9px",
          background: "rgba(255,255,255, 0.07)",
        }}
      >
        @yornaath/batshit - DEVTOOLS
      </div>
      <div>
        {Object.entries(state).map(([name, batcherState]) => (
          <div
            style={{
              fontSize: "13px",
              borderBottom: "1px solid rgba(255,255,255, 0.1)",
              paddingBottom: "5px",
            }}
          >
            <h2 style={{ fontSize: "16px", padding: "7px 9px" }}>{name}</h2>
            {Object.entries(batcherState).map(([seq, seqState]) => (
              <Seq seq={seq} {...seqState} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Seq = (props: {
  seq: string;
  batch: any[];
  fetching: boolean;
  data: any[];
  error: Error | null;
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignContent: "center",
          alignItems: "center",
          height: "24px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            padding: "7px 9px",
            marginRight: "5px",
            width: "24px",
            textAlign: "center",
            backgroundColor: props.fetching
              ? "yellow"
              : props.error
              ? "red"
              : props.data
              ? "blue"
              : "gray",
          }}
        >
          {props.seq}
        </div>
        <div style={{ flex: 1, marginRight: "5px", padding: "7px 9px" }}>
          {JSON.stringify(props.batch)}
        </div>
        <div style={{ padding: "7px 9px" }}>
          {(props.data || props.error) && (
            <div
              onClick={() => setExpanded(!expanded)}
              style={{
                background: props.data ? "green" : "red",
                padding: "3px 6px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {props.data ? "data" : "error"} &#9660;
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ overflowY: "scroll", maxHeight: "500px" }}>
          {props.data ? (
            <div style={{ padding: "7px 9px" }}>
              <div>
                <pre>{JSON.stringify(props.data, null, 2)}</pre>
              </div>
            </div>
          ) : props.error ? (
            <div style={{ padding: "7px 9px", color: "red" }}>
              {props.error.message}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
