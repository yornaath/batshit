import { useLayoutEffect } from "react";
import { Batcher } from "./components/Batcher";
import { useDevtoolsState } from "./hooks/useDevtoolsState";
import { useLocalState } from "./hooks/useLocalState";
import { styles } from "./styles";

export const BatshitDevtools = (props: { defaultOpen?: boolean }) => {
  const state = useDevtoolsState();

  const [open, setOpen] = useLocalState<boolean>(
    "batshit-devtools-open",
    props.defaultOpen
  );

  useLayoutEffect(() => {
    let style = document.createElement("style");
    style.textContent = styles;
    document.head.append(style);
  }, []);

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
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "7px 22px 7px 9px",
          background: "rgba(255,255,255, 0.07)",
          display: "flex",
          height: "30px",
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
      <div
        className="batshit-osx-scrollbars"
        style={{
          flex: 1,
          overflowY: "scroll",
        }}
      >
        {Object.entries(state).map(([name, batcherState]) => (
          <Batcher key={name} name={name} state={batcherState} />
        ))}
      </div>
    </div>
  );
};

export default BatshitDevtools;
