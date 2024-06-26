import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import * as Ztg from "@zeitgeistpm/indexer";
import delay from "delay";
import { zeitgeist } from "../sdk";

const assetsBatcher = batshit.create({
  fetcher: async (ids: number[]) => {
    await delay(200);
    const { assets } = await zeitgeist.assets({
      where: {
        market: {
          pool: {
            poolId_in: ids,
          },
        },
      },
    });
    return assets;
  },
  resolver: (assets, query) =>
    assets.filter((a) => a.market.pool?.poolId === query),
  scheduler: batshit.bufferScheduler(1000),
  name: "assets",
});

export const useAssetsForPool = (pool?: Ztg.FullPoolFragment) => {
  return useQuery(
    ["assets-for-pool", pool],
    async () => {
      if (pool) {
        return assetsBatcher.fetch(pool?.poolId);
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(pool),
    }
  );
};
