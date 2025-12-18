import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // <- make sure path & casing is correct

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

