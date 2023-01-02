import { BatshitDevtools } from "@yornaath/batshit-react-devtools";
import { Market } from "./components/Market";
import { useMarkets } from "./hooks/useMarkets";

function App() {
  const { data: markets } = useMarkets();

  return (
    <div className="App" style={{ fontFamily: "Menlo, monospace" }}>
      <h1>Zeitgeist Prediction Markets</h1>
      <h3 style={{ width: "900px", fontSize: "1em" }}>
        Loading liquidity for a pool will queue a fetch and stagger the
        scheduler by 2 seconds. Clicking another load within the staggered
        window will stagger by another 2 seconds.
      </h3>
      <div>
        {markets?.map((market) => (
          <Market key={market.id} market={market} />
        ))}
      </div>
      <BatshitDevtools />
    </div>
  );
}

export default App;
