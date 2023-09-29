import { Route, BrowserRouter, Routes } from "react-router-dom";
import { VoteView } from "./components/VoteView";
import { StatsView } from "./components/StatsView";
import Root from "./routes/root";
import PromptView from "./components/PromptView";
import { HallOfFame } from "./components/HallOfFame";

// const { RouterProvider: BrowserRouter, Routes, Route } = createBrowserRouter();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />}>
          <Route index element={<VoteView />} />
          <Route path="stats" element={<StatsView />} />
          <Route path="prompts" element={<PromptView />} />
          <Route path="hof" element={<HallOfFame />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
