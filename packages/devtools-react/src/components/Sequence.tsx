import { SequenceState } from "packages/devtools/dist";
import React from "react";

export const Sequence = (props: {
  seq: string;
  sequence: SequenceState<any, any>;
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const batchStr = JSON.stringify(props.sequence.batch);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignContent: "center",
          alignItems: "center",
          height: "24px",
          paddingLeft: "9px",
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
            background: props.sequence.fetching
              ? "yellow"
              : props.sequence.error
              ? "red"
              : props.sequence.data
              ? "green"
              : "gray",
          }}
        >
          {props.seq}
        </div>
        <div style={{ flex: 1, marginRight: "5px", padding: "7px 9px" }}>
          {batchStr?.substring(0, 80)}
          {batchStr?.length > 80 ? "..." : ""}
        </div>
        <div style={{ padding: "7px 9px" }}>
          {(props.sequence.data || props.sequence.error) && (
            <div
              onClick={() => setExpanded(!expanded)}
              style={{
                background: props.sequence.data ? "green" : "red",
                padding: "3px 6px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {props.sequence.data ? "data" : "error"} &#9660;
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div
          className="batshit-osx-scrollbars"
          style={{ overflowY: "scroll", maxHeight: "500px" }}
        >
          {props.sequence.data ? (
            <div style={{ padding: "7px 9px" }}>
              <div>
                <pre>{JSON.stringify(props.sequence.data, null, 2)}</pre>
              </div>
            </div>
          ) : props.sequence.error ? (
            <div style={{ padding: "7px 9px", color: "red" }}>
              {props.sequence.error.message}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
