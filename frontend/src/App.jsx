import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Summary from "./pages/Summary";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/summary" replace />} />
          <Route path="summary" element={<Summary />} />
          <Route path="board" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}