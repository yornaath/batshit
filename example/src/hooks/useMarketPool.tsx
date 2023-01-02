import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import * as Ztg from "@zeitgeistpm/indexer";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import delay from "delay";
import { zeitgeist } from "../sdk";

const poolsBatcher = batshit.create<Ztg.FullPoolFragment, number>({
  fetcher: async (ids) => {
    await delay(200);
    const { pools } = await zeitgeist.pools({
      where: {
        poolId_in: ids,
      },
    });
    return pools;
  },
  resolver: batshit.keyResolver("poolId"),
  scheduler: batshit.bufferScheduler(2000),
  name: "batcher:pools",
});

export const useMarketPool = (
  market: FullMarketFragment,
  options: { enabled: boolean }
) => {
  return useQuery(
    ["pool-for-market", market],
    async () => {
      return poolsBatcher.fetch(market.pool?.poolId!);
    },
    {
      keepPreviousData: true,
      enabled: Boolean(market.pool?.poolId && options.enabled),
    }
  );
};
