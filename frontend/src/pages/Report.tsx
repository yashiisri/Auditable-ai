import { useLocation, useNavigate } from "react-router-dom";

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const r = state?.data;

  if (!r) return <div>No report data</div>;

  return (
    <div className="root">
      <button onClick={() => navigate("/dashboard")}>
        ← Back
      </button>

      {/* Paste your full Report UI here */}
    </div>
  );
}