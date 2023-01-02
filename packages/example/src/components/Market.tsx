import * as Ztg from "@zeitgeistpm/indexer";
import { useState } from "react";
import { useMarketPool } from "../hooks/useMarketPool";

export const Market = (props: { market: Ztg.FullMarketFragment }) => {
  const [shouldFetch, setShouldFetch] = useState(false);

  const {
    data: pool,
    isFetched,
    isFetching,
  } = useMarketPool(props.market, { enabled: shouldFetch });

  const onClickFetchPool = () => {
    setShouldFetch(true);
  };

  return (
    <div
      style={{
        display: "flex",
        alignContent: "center",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div style={{ marginRight: 8, width: 370 }}>{props.market.slug} </div>
      <button
        disabled={isFetched || isFetching}
        style={{ marginRight: 8 }}
        onClick={onClickFetchPool}
      >
        Fetch Volume
      </button>
      {(pool || isFetching) && (
        <div
          style={{
            borderRadius: 4,
            height: 8,
            width: 8,
            marginRight: 8,
            background: isFetched || !isFetching ? "green" : "yellow",
          }}
        />
      )}
      {pool && (
        <div style={{}}>{Number(pool.volume / 10 ** 10).toFixed(2)}</div>
      )}
    </div>
  );
};
