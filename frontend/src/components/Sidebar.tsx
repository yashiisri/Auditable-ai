import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar">

      <div className="sidebar-header">
        <h2>Auditable AI</h2>
      </div>

      <div className="sidebar-menu">

        <div
          className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          Home
        </div>

        <div
          className={`menu-item ${isActive("/register-ai") ? "active" : ""}`}
          onClick={() => navigate("/register-ai")}
        >
          AI Audit
        </div>

        <div
          className={`menu-item ${isActive("/report") ? "active" : ""}`}
          onClick={() => navigate("/report")}
        >
          Report Generation
        </div>

        <div className="menu-item">
          Profile
        </div>

      </div>

    </div>
  );
}