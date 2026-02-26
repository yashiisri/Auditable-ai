/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAI, uploadCSV, sdccIngest, evaluateAI } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [aiName, setAiName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [useSDCC, setUseSDCC] = useState(true);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sdccSummary, setSdccSummary] = useState<any>(null);
const [sdccResult, setSdccResult] = useState<any>(null);
  const extractErr = (e: any): string => {
    if (!e?.response) return "Cannot reach backend. Is the server running?";
    const { status, data } = e.response;
    if (data?.detail) return `[${status}] ${data.detail}`;
    return `[${status}] ${e.message}`;
  };

  const handleRegister = async () => {
    if (!aiName.trim()) return alert("Please enter AI Name");
    setError("");
    setLoading(true);
    try {
      await registerAI({
        name: aiName,
        description,
        domain,
        connector: { type: "internal", endpoint: "N/A", headers: {} },
      });
      setRegistered(true);
      setRegisterSuccess(true);
    } catch (e) {
      setError(extractErr(e));
    } finally {
      setLoading(false);
    }
  };

 const handleUpload = async () => {
  if (!aiName.trim()) return alert("Please register AI first");
  if (!file) return alert("Please select a file");

  setError("");
  setLoading(true);

  try {
    let res;

    if (useSDCC) {
      res = await sdccIngest(aiName, file);

      // SDCC response structure
      const data = res.data;

      setSdccSummary(data); // 🔥 Save full SDCC response
      setLogsCount(data.logs_ingested ?? null);
    } else {
      res = await uploadCSV(aiName, file);
      setLogsCount(res?.data?.logs_ingested ?? null);
    }

    setUploaded(true);
    setUploadSuccess(true);
  } catch (e) {
    setError(extractErr(e));
  } finally {
    setLoading(false);
  }
};

  const handleEvaluate = async () => {
    if (!uploaded) return alert("Please upload logs first");
    setError("");
    setLoading(true);
    try {
      const res = await evaluateAI(aiName);
      navigate("/report", {
        state: { data: res.data },
      });
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
        <div className="card-grid">
          {/* REGISTER CARD */}
          <div className="glass-card">
            <h2>1. Register AI System</h2>
            <p className="card-desc">Enter basic information about your AI model.</p>

            <label>AI Name *</label>
            <input
              placeholder="e.g. Sentiment Analyzer v2"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              disabled={registered}
            />

            <label>Description</label>
            <input
              placeholder="Brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={registered}
            />

            <label>Domain / Use Case</label>
            <input
              placeholder="e.g. Customer Support, Healthcare"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={registered}
            />

         

            <button
              onClick={handleRegister}
              disabled={loading || registered}
              className={registered ? "success-btn" : ""}
            >
              {loading
                ? "Registering..."
                : registered
                ? "✓ AI Registered"
                : "Register AI"}
            </button>

            {registerSuccess && (
              <div className="success-message">
                AI system <strong>{aiName}</strong> successfully registered!
              </div>
            )}
          </div>

          {/* UPLOAD CARD */}
          <div className="glass-card">
            <h2>2. Ingest Interaction Logs</h2>
            <p className="card-desc">Upload conversation logs for evaluation.</p>

            <div className="toggle-container">
              <span className="toggle-label">Use SDCC (Smart Classification)</span>
              <div className="toggle-switch" onClick={() => setUseSDCC(!useSDCC)}>
                <div className={`toggle-knob ${useSDCC ? "on" : "off"}`}></div>
              </div>
            </div>
            <p className="toggle-desc">
              {useSDCC
                ? "Auto-detects model type and optimizes ingestion"
                : "Manual CSV/JSON upload"}
            </p>

            <label>Select File (.csv or .json)</label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploaded || loading}
            />

            {file && (
              <div className="file-name">
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !registered || uploaded}
              className={uploaded ? "success-btn" : ""}
            >
              {loading
                ? "Uploading logs..."
                : uploaded
                ? "✓ Logs Ingested"
                : "Upload Logs"}
            </button>

            {uploadSuccess && logsCount !== null && (
              <div className="success-message">
                Successfully ingested <strong>{logsCount}</strong> log records!
              </div>
            )}

            {uploadSuccess && logsCount === null && (
              <div className="success-message">
                Logs successfully uploaded and processed!
              </div>
            )}
           {sdccSummary && useSDCC && (
  <div className="sdcc-enterprise">

    {/* Executive Snapshot */}
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

      <div className={`metric-card risk-${sdccSummary.structural_risk.toLowerCase()}`}>
        <span>Structural Risk</span>
        <strong>{sdccSummary.structural_risk}</strong>
      </div>
    </div>

    {/* Diagnostics */}
    <div className="sdcc-diagnostics">
      <h4>Data Diagnostics</h4>
      <p>Missing Ratio: {sdccSummary.diagnostics.missing_ratio}</p>
      <p>Duplicates: {sdccSummary.diagnostics.duplicates}</p>
      <p>Total Columns: {sdccSummary.diagnostics.total_columns}</p>
      <p>Text Columns: {sdccSummary.diagnostics.text_columns}</p>
      <p>Numeric Columns: {sdccSummary.diagnostics.numeric_columns}</p>
      <p>Schema Confidence: {sdccSummary.diagnostics.schema_confidence}</p>
    </div>

    {/* Recommendation */}
    <div className="sdcc-recommendation">
      <strong>Recommendation:</strong>
      <p>{sdccSummary.recommendation}</p>
    </div>

    <div className="sdcc-footer">
      <span>Scan ID: {sdccSummary.scan_id}</span>
      <span>Timestamp: {new Date(sdccSummary.timestamp).toLocaleString()}</span>
    </div>

  </div>
)}
  


          </div>
        </div>

        {/* RUN EVALUATION BUTTON */}
        <div className="center">
          <button
            className="run-btn"
            onClick={handleEvaluate}
            disabled={loading || !uploaded}
          >
            {loading ? "Evaluating AI..." : "Run Full Evaluation →"}
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