import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Hub } from "./pages/Hub";
import { ToolPage } from "./pages/ToolPage";
import { LandingPage } from "./pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/tool/:slug" element={<ToolPage />} />
        <Route path="/lp/:slug" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
