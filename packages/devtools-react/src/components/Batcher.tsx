import { BatcherState } from "packages/devtools/dist";
import { useState } from "react";
import { Sequence } from "./Sequence";

export const Batcher = (props: {
  name: string;
  state: BatcherState<any, any>;
}) => {
  const [expanded, setExpanded] = useState(true);

  const latestSeqNumber = Object.keys(props.state.sequences)
    .sort()
    .reverse()[0];
  const latest = props.state.sequences[Number(latestSeqNumber)];

  return (
    <div
      style={{
        fontSize: "13px",
        paddingBottom: "5px",
        overflow: "hidden",
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
        <div
          style={{
            display: "flex",
            alignContent: "center",
            alignItems: "center",
            flex: 1,
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
        </div>
        <div
          style={{ color: "rgba(255,255,255, 0.16)", cursor: "pointer" }}
          onClick={() => setExpanded(!expanded)}
        >
          &#9660;
        </div>
      </h2>
      {expanded
        ? Object.entries(props.state.sequences).map(([seq, seqState]) => (
            <Sequence key={seq} seq={seq} sequence={seqState} />
          ))
        : null}
    </div>
  );
};
