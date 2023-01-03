import { useQuery } from "@tanstack/react-query";
import * as Ztg from "@zeitgeistpm/indexer";
import { zeitgeist } from "../sdk";

export const useMarkets = () => {
  return useQuery(["markets"], async () => {
    const markets = await zeitgeist.markets({
      offset: 20,
      limit: 100,
      order: Ztg.MarketOrderByInput.CreationDesc,
    });
    return markets.markets.filter((market) =>
      Boolean(market.pool?.poolId && market.slug?.length! > 5)
    );
  });
};
