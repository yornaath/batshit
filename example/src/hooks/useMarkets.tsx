import { useQuery } from "@tanstack/react-query";
import { zeitgeist } from "../sdk";

export const useMarkets = () => {
  return useQuery(["markets"], async () => {
    const markets = await zeitgeist.markets();
    return markets.markets.filter((market) =>
      Boolean(market.pool?.poolId && market.slug?.length! > 5)
    );
  });
};
