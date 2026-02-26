/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadCSV, sdccIngest, evaluateAI } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  /* ---------------- BLACK BOX ---------------- */
  const [mode, setMode] = useState<"api" | "ui">("api");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [uiUrl, setUiUrl] = useState("");

  /* ---------------- INGESTION ---------------- */
  const [file, setFile] = useState<File | null>(null);
  const [useSDCC, setUseSDCC] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sdccSummary, setSdccSummary] = useState<any>(null);
  const [error, setError] = useState("");

  const aiName = localStorage.getItem("activeAI") || "";

  /* ---------------- ERROR HANDLER ---------------- */
  const extractErr = (e: any): string => {
    if (!e?.response) return "Cannot reach backend.";
    return e.response?.data?.detail || "Operation failed.";
  };

  /* ---------------- BLACK BOX RUN ---------------- */
  const handleBlackBox = () => {
    if (mode === "api" && (!endpoint || !apiKey)) {
      alert("Provide API endpoint and API key.");
      return;
    }

    if (mode === "ui" && !uiUrl) {
      alert("Provide deployed UI URL.");
      return;
    }

    alert("Black Box audit will trigger backend orchestration.");
  };

  /* ---------------- INGESTION ---------------- */
  const handleUpload = async () => {
    if (!aiName) {
      alert("No AI registered. Please register AI first.");
      return;
    }

    if (!file) {
      alert("Select a file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let res;

      if (useSDCC) {
        res = await sdccIngest(aiName, file);
        setSdccSummary(res.data);
        setLogsCount(res.data.logs_ingested ?? null);
      } else {
        res = await uploadCSV(aiName, file);
        setLogsCount(res.data.logs_ingested ?? null);
      }

      setUploaded(true);
      setUploadSuccess(true);
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EVALUATE ---------------- */
  const handleEvaluate = async () => {
    if (!uploaded) {
      alert("Upload logs first.");
      return;
    }

    setLoading(true);

    try {
      const res = await evaluateAI(aiName);
      navigate("/report", { state: { data: res.data } });
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero">
      <style>{CSS}</style>

      <div className="hero-content">

        {/* TOP ROW */}
        <div className="card-grid">

          {/* BLACK BOX */}
          <div className="glass-card">
            <h2>🛡 Black Box AI Audit</h2>
            <p className="card-desc">
              Connect external AI system and run Trusted AI evaluation.
            </p>

            <div className="toggle-container">
              <span className="toggle-label">Connection Mode</span>
              <div
                className="toggle-switch"
                onClick={() => setMode(mode === "api" ? "ui" : "api")}
              >
                <div
                  className={`toggle-knob ${mode === "api" ? "on" : "off"}`}
                ></div>
              </div>
            </div>

            <p className="toggle-desc">
              {mode === "api"
                ? "API Key + Endpoint Mode"
                : "Deployed UI Mode"}
            </p>

            {mode === "api" ? (
              <>
                <label>API Endpoint</label>
                <input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.company.com/v1/chat"
                />

                <label>API Key</label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxx"
                />
              </>
            ) : (
              <>
                <label>UI URL</label>
                <input
                  value={uiUrl}
                  onChange={(e) => setUiUrl(e.target.value)}
                  placeholder="https://chatbot.vercel.app"
                />
              </>
            )}

            <button onClick={handleBlackBox}>
              Run Black Box Audit →
            </button>
          </div>

          {/* INGESTION */}
          <div className="glass-card">
            <h2>📊 Data Ingestion (SDCC)</h2>

            <div className="toggle-container">
              <span className="toggle-label">Use SDCC</span>
              <div
                className="toggle-switch"
                onClick={() => setUseSDCC(!useSDCC)}
              >
                <div
                  className={`toggle-knob ${useSDCC ? "on" : "off"}`}
                ></div>
              </div>
            </div>

            <label>Select File</label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button onClick={handleUpload} disabled={loading}>
              {loading ? "Uploading..." : "Upload Logs"}
            </button>

            {uploadSuccess && logsCount && (
              <div className="success-message">
                Ingested {logsCount} records successfully.
              </div>
            )}
          </div>
        </div>

        {/* SDCC SUMMARY */}
        {sdccSummary && useSDCC && (
          <div className="sdcc-wrapper">
            <div className="glass-card sdcc-enterprise">
              <h2>📈 SDCC Structural Summary</h2>

              <div className="sdcc-grid">
                <div className="metric-card">
                  <span>Model Type</span>
                  <strong>{sdccSummary.model_type}</strong>
                </div>

                <div className="metric-card">
                  <span>Logs</span>
                  <strong>{sdccSummary.logs_ingested}</strong>
                </div>

                <div className="metric-card">
                  <span>Data Quality</span>
                  <strong>{sdccSummary.data_quality_score}%</strong>
                </div>

                <div
                  className={`metric-card risk-${sdccSummary.structural_risk?.toLowerCase()}`}
                >
                  <span>Structural Risk</span>
                  <strong>{sdccSummary.structural_risk}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RUN EVALUATION */}
        <div className="center">
          <button
            className="run-btn"
            onClick={handleEvaluate}
            disabled={!uploaded}
          >
            Run Full Evaluation →
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.hero {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
              #030C1E;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  font-family: 'IBM Plex Sans', sans-serif;
  color: #D8E8F5;
}

.hero-content {
  width: 100%;
  max-width: 1200px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 40px;
  margin-bottom: 50px;
}

.glass-card {
  background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0,145,218,0.28);
  border-radius: 20px;
  padding: 40px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0,145,218,0.28);
}

.glass-card h2 {
  font-size: 26px;
  font-weight: 700;
  color: #EAF2FB;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 14px;
  color: #9DBFE0;
  margin-bottom: 20px;
  line-height: 1.5;
}

.glass-card label {
  font-size: 13px;
  font-weight: 600;
  color: #4AACDF;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
  display: block;
}

.glass-card input,
.glass-card select {
  padding: 13px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0,145,218,0.35);
  background: rgba(3,12,30,0.65);
  color: #EAF2FB;
  font-size: 15px;
  transition: all 0.2s;
}

.glass-card input:focus,
.glass-card select:focus {
  border-color: #00C896;
  box-shadow: 0 0 0 3px rgba(0,200,150,0.18);
  outline: none;
}

.glass-card button {
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #0091DA, #00C896);
  color: #FFFFFF;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 12px;
}

.glass-card button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,200,150,0.35);
}

.glass-card button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.success-btn {
  background: linear-gradient(135deg, #00C896, #0091DA) !important;
}

.success-message {
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(0,200,150,0.12);
  border: 1px solid rgba(0,200,150,0.3);
  border-radius: 10px;
  color: #00E5AB;
  font-size: 14px;
  text-align: center;
}

.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 8px;
}

.toggle-label {
  font-size: 15px;
  font-weight: 600;
  color: #EAF2FB;
}

.toggle-switch {
  width: 54px;
  height: 28px;
  background: rgba(10,30,66,0.9);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid rgba(0,145,218,0.35);
}

.toggle-knob {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFFFFF, #D8E8F5);
  position: absolute;
  top: 1px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

.toggle-knob.off {
  left: 2px;
}

.toggle-knob.on {
  left: 28px;
  background: linear-gradient(135deg, #00C896, #0091DA);
}

.toggle-desc {
  font-size: 13px;
  color: #9DBFE0;
  margin: 4px 0 16px;
  font-style: italic;
}

.file-name {
  font-size: 13px;
  color: #4AACDF;
  margin: 8px 0;
}

.center {
  margin-top: 50px;
  text-align: center;
}

.run-btn {
  padding: 18px 60px;
  font-size: 17px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #0091DA, #00C896);
  color: #FFFFFF;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(0,145,218,0.25);
}

.run-btn:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 12px 40px rgba(0,200,150,0.4);
}

.run-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
  .sdcc-enterprise {
  margin-top: 30px;
  padding: 30px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(8,28,60,0.95), rgba(5,18,40,0.9));
  border: 1px solid rgba(0,145,218,0.35);
  animation: fadeInUp 0.6s ease forwards;
}

.sdcc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.metric-card {
  background: rgba(0,145,218,0.08);
  padding: 20px;
  border-radius: 14px;
  text-align: center;
  transition: 0.3s ease;
}

.metric-card strong {
  font-size: 22px;
  display: block;
  margin-top: 6px;
}

.metric-card:hover {
  transform: translateY(-4px);
}

.risk-low {
  border: 1px solid #00C896;
}

.risk-moderate {
  border: 1px solid #ffb020;
}

.risk-high {
  border: 1px solid #ff4d4d;
}

.sdcc-diagnostics {
  border-top: 1px solid rgba(0,145,218,0.2);
  padding-top: 20px;
  font-size: 14px;
}

.sdcc-recommendation {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0,200,150,0.08);
  border-left: 4px solid #00C896;
  border-radius: 10px;
}

.sdcc-footer {
  margin-top: 20px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  opacity: 0.7;
}

.error-box {
  margin-top: 40px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06));
  border: 1px solid rgba(239,68,68,0.35);
  color: #ff8787;
  border-radius: 12px;
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  font-size: 15px;
}
  .sdcc-card {
  margin-top: 25px;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(8,28,60,0.9), rgba(5,18,40,0.85));
  border: 1px solid rgba(0,145,218,0.35);
  animation: fadeInUp 0.6s ease forwards;
  box-shadow: 0 10px 30px rgba(0,145,218,0.25);
}

.sdcc-card h3 {
  margin-bottom: 12px;
  color: #00E5AB;
}

.sdcc-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,145,218,0.25);
}

.sdcc-section h4 {
  font-size: 14px;
  color: #4AACDF;
  margin-bottom: 8px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;