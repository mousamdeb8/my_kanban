import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

import Projects from "./pages/Projects";
import Layout   from "./components/Layout";
import Summary  from "./pages/Summary";
import Home     from "./pages/Home";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right"/>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Navigate to="/projects" replace/>}/>
          <Route path="/projects" element={<Projects/>}/>
          <Route path="/projects/:projectId" element={<Layout/>}>
            <Route index element={<Navigate to="summary" replace/>}/>
            <Route path="summary"  element={<Summary/>}/>
            <Route path="board"    element={<Home/>}/>
            <Route path="timeline" element={<Timeline/>}/>
            <Route path="settings" element={<Settings/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}