import { BatcherState } from "packages/devtools/dist";
import { Sequence } from "./Sequence";

export const Batcher = (props: {
  name: string;
  state: BatcherState<any, any>;
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
        <Sequence seq={seq} sequence={seqState} />
      ))}
    </div>
  );
};
