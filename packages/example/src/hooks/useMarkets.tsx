import { useQuery } from "@tanstack/react-query";
import { zeitgeist } from "../sdk";

export const useMarkets = () => {
  return useQuery(["markets"], async () => {
    const markets = await zeitgeist.markets({
      offset: 20,
      limit: 100,
    });
    return markets.markets.filter((market) =>
      Boolean(market.pool?.poolId && market.slug?.length! > 5)
    );
  });
};
