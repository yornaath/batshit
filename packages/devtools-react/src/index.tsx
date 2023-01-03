import React, { useEffect } from "react";
import { useDevtoolsState } from "./hooks/useDevtoolsState";

export const BatshitDevtools = (props: { defaultOpen?: boolean }) => {
  const state = useDevtoolsState();

  const [open, setOpen] = React.useState(
    props.defaultOpen ||
      globalThis.localStorage?.getItem("batshit-devtools-open") === "true"
  );

  useEffect(() => {
    globalThis.localStorage?.setItem("batshit-devtools-open", open.toString());
  }, [open]);

  return !open ? (
    <div
      title="Open @yornaath/batshit - DEVTOOLS"
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "rgb(30,30,30)",
        color: "rgb(250,250,250)",
        fontFamily: "Menlo, monospace",
        borderRadius: "4px",
        padding: 8,
        cursor: "pointer",
      }}
      onClick={() => setOpen(true)}
    >
      🦇💩
    </div>
  ) : (
    <div
      className="yornaath-batshit-devtools"
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        width: "900px",
        height: "600px",
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
          display: "flex",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>@yornaath/batshit - DEVTOOLS 🦇💩</div>
        <div
          style={{ color: "rgba(255,255,255, 0.16)", cursor: "pointer" }}
          onClick={() => setOpen(false)}
        >
          &#9660;
        </div>
      </div>
      <div>
        {Object.entries(state).map(([name, batcherState]) => (
          <Batcher name={name} state={batcherState} />
        ))}
      </div>
    </div>
  );
};

const Batcher = (props: {
  name: string;
  state: {
    sequences: {
      [seq: number]: {
        batch: any[];
        fetching: boolean;
        data: any[];
        error: Error | null;
      };
    };
  };
}) => {
  const latestSeqNumber = Object.keys(props.state.sequences)
    .sort()
    .reverse()[0];
  const latest = props.state.sequences[Number(latestSeqNumber)];

  return (
    <div
      style={{
        fontSize: "13px",
        borderBottom: "1px solid rgba(255,255,255, 0.1)",
        paddingBottom: "5px",
      }}
    >
      <h2
        style={{
          display: "flex",
          alignContent: "center",
          alignItems: "center",
          fontSize: "16px",
          padding: "7px 9px",
        }}
      >
        <span style={{ marginRight: "8px" }}>{props.name}</span>
        <div
          style={{
            borderRadius: 4,
            height: 8,
            width: 8,
            marginRight: 8,
            transition: "background 0.2s",
            background: latest.fetching
              ? "yellow"
              : latest.error
              ? "red"
              : latest.data
              ? "green"
              : "gray",
          }}
        />
      </h2>
      {Object.entries(props.state.sequences).map(([seq, seqState]) => (
        <Seq seq={seq} {...seqState} />
      ))}
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
            transition: "background 0.2s",
            background: props.fetching
              ? "yellow"
              : props.error
              ? "red"
              : props.data
              ? "green"
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

export default BatshitDevtools;
