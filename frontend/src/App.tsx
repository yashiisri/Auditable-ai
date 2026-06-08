

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Glossary            from "./pages/Glossary";
import Login               from "./pages/Login";
import Register            from "./pages/Register";
import Dashboard           from "./pages/Dashboard";
import Report              from "./pages/Report";
import RegisterAI          from "./pages/RegisterAi";
import Profile             from "./pages/Profile";
import SelfReportPage      from "./pages/SelfReportPage";
import PdfReportDashboard  from "./pages/PdfReportDashboard";
import AdminPanel          from "./pages/AdminPanel";
import ChatWidget          from "./components/ChatWidget";
import MainLayout          from "./layout/MainLayout";
import ExecutiveSummary     from "./pages/ExecutiveSummary";
import RegulatoryAlignment from "./pages/RegulatoryAlignment";
import RiskIntelligence    from "./pages/RiskIntelligence";
import LlmAnalysis         from "./pages/LlmAnalysis";
import GovernancePrinciples from "./pages/GovernancePrinciples";
import AgentBehaviour      from "./pages/AgentBehaviour";
import Recommendations     from "./pages/Recommendations";
import DownloadReport      from "./pages/DownloadReport";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute     from "./components/AdminRoute";

function App() {

  
  return (

    <BrowserRouter>
      <ChatWidget />
      <Routes>
        {/* PUBLIC — no sidebar */}
        <Route path="/"      element={<Glossary />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED — sidebar layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/register-ai"          element={<RegisterAI />} />
          <Route path="/report"               element={<Report />} />
          <Route path="/profile"              element={<Profile />} />
          <Route path="/self-report"          element={<SelfReportPage />} />
          <Route path="/audit"                element={<PdfReportDashboard />} />
          {/* Audit workspace pages */}
          <Route path="/audit-overview"       element={<ExecutiveSummary />} />
          <Route path="/regulatory-alignment" element={<RegulatoryAlignment />} />
          <Route path="/risk-intelligence"    element={<RiskIntelligence />} />
          <Route path="/llm-analysis"         element={<LlmAnalysis />} />
          <Route path="/governance-principles" element={<GovernancePrinciples />} />
          <Route path="/agent-behaviour"      element={<AgentBehaviour />} />
          <Route path="/recommendations"      element={<Recommendations />} />
          <Route path="/download-report"      element={<DownloadReport />} />
        </Route>

        {/* ADMIN ONLY — sidebar layout */}
        <Route element={<AdminRoute><MainLayout /></AdminRoute>}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;