import BatshitDevtools from "@yornaath/batshit-react-devtools";
import { Market } from "./components/Market";
import { useMarkets } from "./hooks/useMarkets";

function App() {
  const { data: markets } = useMarkets();

  return (
    <div
      className="App"
      style={{ fontFamily: "Menlo, monospace", padding: "2em" }}
    >
      <h1>Zeitgeist Prediction Markets</h1>

      <h3 style={{ width: "900px", fontSize: "1em", marginBottom: "2em" }}>
        Loading liquidity for a pool will queue a fetch and stagger the
        scheduler by 2 seconds. Clicking another load within the staggered
        window will stagger by another 2 seconds. <br /> <br />
        <i style={{ color: "rgb(70,70,70)" }}>
          Use the batshit devtools in the bottom right corner to inspect batch
          fetches.
        </i>
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
