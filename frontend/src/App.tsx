// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";
// import Report from "./pages/Report";
// import RegisterAI from "./pages/RegisterAi";

// import ProtectedRoute from "./components/ProtectedRoute";
// import MainLayout from "./layout/MainLayout";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* PUBLIC PAGES (NO SIDEBAR) */}
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         {/* PROTECTED PAGES WITH SIDEBAR */}
//         <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

//           <Route path="/dashboard" element={<Dashboard />} />

//           <Route path="/register-ai" element={<RegisterAI />} />

//           <Route path="/report" element={<Report />} />

//         </Route>

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home       from "./pages/Home";
import Login      from "./pages/Login";
import Register   from "./pages/Register";
import Dashboard  from "./pages/Dashboard";
import Report     from "./pages/Report";
import RegisterAI from "./pages/RegisterAi";
import Profile    from "./pages/Profile";        // ← NEW

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout     from "./layout/MainLayout";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no sidebar */}
        <Route path="/"         element={<Home />}     />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* Protected — wrapped in sidebar layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard"   element={<Dashboard />}  />
          <Route path="/register-ai" element={<RegisterAI />} />
          <Route path="/report"      element={<Report />}     />
          <Route path="/profile"     element={<Profile />}    />  {/* ← NEW */}
       
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;