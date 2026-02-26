import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Report from  "./pages/Report"
 import RegisterAI from "./pages/RegisterAi";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/report" element={<Report />} />
        

<Route path="/register-ai" element={<RegisterAI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;