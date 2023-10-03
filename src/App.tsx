import { Route, BrowserRouter, Routes } from "react-router-dom";
import { VoteView } from "./components/VoteView";
import { StatsView } from "./components/StatsView";
import Root from "./routes/root";
import PromptView from "./components/PromptView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />}>
          <Route index element={<VoteView />} />
          <Route path="stats" element={<StatsView />} />
          <Route path="prompts" element={<PromptView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
