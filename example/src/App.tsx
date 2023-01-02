import { useState } from "react";
import * as batshit from "@yornaath/batshit";
import * as Ztg from "@zeitgeistpm/indexer";
import { BatshitDevtools } from "@yornaath/batshit-react-devtools";
import { useQuery } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";

const zeitgeist = Ztg.create({
  uri: "https://processor.bsr.zeitgeist.pm/graphql",
});

const poolsBatcher = batshit.create<Ztg.FullPoolFragment, number>({
  fetcher: async (ids) => {
    const { pools } = await zeitgeist.pools({
      where: {
        poolId_in: ids,
      },
    });
    return pools;
  },
  resolver: batshit.keyResolver("poolId"),
  scheduler: batshit.bufferScheduler(800),
  name: "batcher:pools",
});

function App() {
  const { data: markets } = useQuery(["markets"], async () => {
    const markets = await zeitgeist.markets();
    return markets.markets.filter((market) =>
      Boolean(market.pool?.poolId && market.slug?.length! > 5)
    );
  });

  return (
    <div className="App">
      <BatshitDevtools />
      <div>
        {markets?.map((market) => (
          <Market key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}

const Market = (props: { market: Ztg.FullMarketFragment }) => {
  const [shouldFetch, setShouldFetch] = useState(false);

  const {
    data: pool,
    isFetched,
    isFetching,
  } = useQuery(
    ["pool-for-market", props.market],
    async () => {
      return poolsBatcher.fetch(props.market.pool?.poolId!);
    },
    {
      keepPreviousData: true,
      enabled: Boolean(props.market.pool?.poolId && shouldFetch),
    }
  );

  const onClickFetchPool = () => {
    setShouldFetch(true);
  };

  return (
    <div
      style={{
        display: "flex",
        alignContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ marginRight: 8 }}>{props.market.slug} </div>
      <button style={{ marginRight: 8 }} onClick={onClickFetchPool}>
        Fetch pool
      </button>
      {(pool || isFetching) && (
        <div
          style={{
            borderRadius: 4,
            height: 8,
            width: 8,
            background: isFetched || !isFetching ? "green" : "yellow",
          }}
        />
      )}
    </div>
  );
};

export default App;
