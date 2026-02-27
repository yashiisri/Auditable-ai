import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home       from "./pages/Home";
import Login      from "./pages/Login";
import Register   from "./pages/Register";
import Dashboard  from "./pages/Dashboard";
import Report     from "./pages/Report";
import RegisterAI from "./pages/RegisterAi";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — must be logged in */}
        <Route path="/register-ai" element={<ProtectedRoute><RegisterAI /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/report"      element={<ProtectedRoute><Report /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;