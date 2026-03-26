// // // import { useNavigate } from "react-router-dom";

// // // const Home = () => {
// // //   const navigate = useNavigate();

// // //   return (
// // //     <div className="app-layout">
// // //       <style>{`
// // //         /* ─────────────────────────────────────────────────────────────
// // //            SHARED KPMG-STYLE GRADIENT & COLORS (same as dashboard)
// // //         ────────────────────────────────────────────────────────────── */
// // //         :root {
// // //           --kpmg:      #00338D;
// // //           --kpmg-mid:  #005EB8;
// // //           --kpmg-lt:   #0091DA;
// // //           --success:   #00C896;
// // //           --bg:        #030C1E;
// // //           --surface:   #071530;
// // //           --border-lt: rgba(0,145,218,0.25);
// // //           --text:      #D8E8F5;
// // //           --muted:     #9DBFE0;
// // //           --accent:    #4AACDF;
// // //         }

// // //         * {
// // //           margin: 0;
// // //           padding: 0;
// // //           box-sizing: border-box;
// // //         }

// // //         body {
// // //           background: var(--bg);
// // //           color: var(--text);
// // //           font-family: 'IBM Plex Sans', sans-serif;
// // //         }

// // //         .app-layout {
// // //           min-height: 100vh;
// // //           background: radial-gradient(circle at 20% 20%, #00338D 0%, transparent 40%),
// // //                       radial-gradient(circle at 80% 70%, #00C896 0%, transparent 40%),
// // //                       #030C1E;
// // //           display: flex;
// // //         }

// // //         /* Sidebar – matching dashboard feel */
// // //         .sidebar {
// // //           width: 260px;
// // //           background: linear-gradient(180deg, #00338D, #005EB8);
// // //           color: white;
// // //           padding: 40px 24px;
// // //           border-right: 1px solid var(--border-lt);
// // //           backdrop-filter: blur(10px);
// // //           flex-shrink: 0;
// // //         }

// // //         .sidebar-header h2 {
// // //           font-size: 28px;
// // //           font-weight: 700;
// // //           background: linear-gradient(90deg, #00C896, #0091DA);
// // //           -webkit-background-clip: text;
// // //           -webkit-text-fill-color: transparent;
// // //           margin-bottom: 40px;
// // //         }

// // //         .sidebar-menu {
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 16px;
// // //         }

// // //         .menu-item {
// // //           padding: 12px 16px;
// // //           border-radius: 10px;
// // //           cursor: pointer;
// // //           font-weight: 500;
// // //           transition: all 0.25s;
// // //         }

// // //         .menu-item:hover {
// // //           background: rgba(255,255,255,0.12);
// // //         }

// // //         .menu-item.active {
// // //           background: linear-gradient(135deg, rgba(0,200,150,0.22), rgba(0,145,218,0.18));
// // //           font-weight: 600;
// // //           box-shadow: 0 2px 12px rgba(0,200,150,0.15);
// // //         }

// // //         /* Main area */
// // //         .main-area {
// // //           flex: 1;
// // //           display: flex;
// // //           align-items: center;
// // //           justify-content: center;
// // //           padding: 40px;
// // //         }

// // //         /* Hero panel – glass + same glow as dashboard */
// // //         .hero-panel {
// // //           position: relative;
// // //           width: 100%;
// // //           max-width: 1100px;
// // //           border-radius: 24px;
// // //           padding: 80px 60px;
// // //           display: flex;
// // //           gap: 80px;
// // //           background: linear-gradient(135deg, rgba(10,30,66,0.82), rgba(7,21,48,0.75));
// // //           backdrop-filter: blur(20px);
// // //           border: 1px solid rgba(0,145,218,0.28);
// // //           box-shadow: 0 20px 60px rgba(0,0,0,0.4);
// // //           overflow: hidden;
// // //         }

// // //         .hero-glow {
// // //           position: absolute;
// // //           top: -120px;
// // //           right: -180px;
// // //           width: 500px;
// // //           height: 500px;
// // //           background: radial-gradient(circle, #00C89633, transparent 70%);
// // //           opacity: 0.25;
// // //           filter: blur(100px);
// // //           pointer-events: none;
// // //         }

// // //         .hero-left h1 {
// // //           font-size: 3.8rem;
// // //           font-weight: 800;
// // //           line-height: 1.1;
// // //           margin-bottom: 24px;
// // //         }

// // //         .accent-text {
// // //           background: linear-gradient(90deg, #00C896, #0091DA);
// // //           -webkit-background-clip: text;
// // //           -webkit-text-fill-color: transparent;
// // //         }

// // //         .hero-left p {
// // //           font-size: 1.2rem;
// // //           color: var(--muted);
// // //           line-height: 1.6;
// // //           margin-bottom: 40px;
// // //         }

// // //         .hero-buttons {
// // //           display: flex;
// // //           gap: 20px;
// // //           flex-wrap: wrap;
// // //         }

// // //         .primary-btn,
// // //         .outline-btn {
// // //           padding: 14px 32px;
// // //           border-radius: 12px;
// // //           font-weight: 600;
// // //           font-size: 1rem;
// // //           cursor: pointer;
// // //           transition: all 0.3s;
// // //         }

// // //         .primary-btn {
// // //           background: linear-gradient(135deg, #0091DA, #00C896);
// // //           color: white;
// // //           border: none;
// // //         }

// // //         .primary-btn:hover {
// // //           transform: translateY(-3px);
// // //           box-shadow: 0 10px 30px rgba(0,200,150,0.35);
// // //         }

// // //         .outline-btn {
// // //           background: transparent;
// // //           border: 2px solid #0091DA;
// // //           color: #0091DA;
// // //         }

// // //         .outline-btn:hover {
// // //           background: rgba(0,145,218,0.12);
// // //           transform: translateY(-3px);
// // //         }

// // //         /* Feature cards – glass style matching dashboard */
// // //         .hero-right {
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 24px;
// // //         }

// // //         .feature-card {
// // //           background: rgba(255,255,255,0.08);
// // //           backdrop-filter: blur(12px);
// // //           border: 1px solid rgba(0,145,218,0.25);
// // //           border-radius: 16px;
// // //           padding: 28px;
// // //           transition: all 0.3s;
// // //         }

// // //         .feature-card:hover {
// // //           transform: translateY(-6px);
// // //           background: rgba(255,255,255,0.12);
// // //           box-shadow: 0 12px 32px rgba(0,200,150,0.15);
// // //         }

// // //         .feature-card h3 {
// // //           font-size: 1.4rem;
// // //           font-weight: 700;
// // //           color: #EAF2FB;
// // //           margin-bottom: 12px;
// // //         }

// // //         .feature-card p {
// // //           color: var(--muted);
// // //           font-size: 1rem;
// // //           line-height: 1.5;
// // //         }

// // //         /* Responsive adjustments */
// // //         @media (max-width: 1024px) {
// // //           .hero-panel {
// // //             flex-direction: column;
// // //             padding: 60px 40px;
// // //             gap: 60px;
// // //           }
// // //           .hero-left h1 {
// // //             font-size: 3.2rem;
// // //           }
// // //         }

// // //         @media (max-width: 768px) {
// // //           .hero-panel {
// // //             padding: 50px 30px;
// // //           }
// // //           .hero-left h1 {
// // //             font-size: 2.8rem;
// // //           }
// // //           .hero-buttons {
// // //             flex-direction: column;
// // //             gap: 16px;
// // //           }
// // //         }
// // //       `}</style>

// // //       {/* SIDEBAR */}
// // //       <div className="sidebar">
        
// // //         <div className="sidebar-header">
// // //           <h2>Auditable AI</h2>
// // //         </div>

// // //         <div className="sidebar-menu">
// // //           <div className="menu-item active">Home</div>
// // //           <div className="menu-item">AI Audit</div>
// // //           <div className="menu-item">Report Generation</div>
// // //           <div className="menu-item">Profile</div>
// // //         </div>
// // //       </div>

// // //       {/* MAIN AREA */}
// // //       <div className="main-area">
// // //         <div className="hero-panel">

// // //           {/* Glow Layer */}
// // //           <div className="hero-glow"></div>

// // //           <div className="hero-left">
// // //             <h1>
// // //               AI Assurance.
// // //               <br />
// // //               <span className="accent-text">Reimagined.</span>
// // //             </h1>

// // //             <p>
// // //               Enterprise-grade AI governance, risk intelligence,
// // //               transparency validation, and regulatory compliance
// // //               built for high-stakes systems.
// // //             </p>

// // //             <div className="hero-buttons">
// // //               <button
// // //                 className="primary-btn"
// // //                 onClick={() => navigate("/login")}
// // //               >
// // //                 Access Platform
// // //               </button>

// // //               <button
// // //                 className="outline-btn"
// // //                 onClick={() => navigate("/register")}
// // //               >
// // //                 Create Account
// // //               </button>
// // //             </div>
// // //           </div>

// // //           <div className="hero-right">
// // //             <div className="feature-card">
// // //               <h3>Risk Scoring Engine</h3>
// // //               <p>
// // //                 Dynamic evaluation across governance principles
// // //                 with model-based scoring.
// // //               </p>
// // //             </div>

// // //             <div className="feature-card">
// // //               <h3>Model Transparency</h3>
// // //               <p>
// // //                 Explainability, bias detection, and compliance validation.
// // //               </p>
// // //             </div>

// // //             <div className="feature-card">
// // //               <h3>Enterprise Reports</h3>
// // //               <p>
// // //                 Structured PDF documentation aligned with audit standards.
// // //               </p>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default Home;


// // import { useNavigate } from "react-router-dom";

// // const Home = () => {
// //   const navigate = useNavigate();

// //   return (
// //     <div className="layout">
// //   <style>{`
// // :root {
// //   --primary: #2563EB;
// //   --accent: #3B82F6;
// //   --bg: #F6F9FF;
// //   --surface: #FFFFFF;
// //   --text: #0F172A;
// //   --muted: #64748B;
// //   --border: #E2E8F0;
// // }

// // /* LAYOUT */
// // .layout {
// //   display: flex;
// //   min-height: 100vh;
// //   background: radial-gradient(circle at 20% 20%, #EAF2FF, transparent 40%),
// //               radial-gradient(circle at 80% 70%, #DCE9FF, transparent 40%),
// //               var(--bg);
// //   font-family: 'Inter', sans-serif;
// // }

// // /* SIDEBAR */
// // .sidebar {
// //   width: 240px;
// //   background: white;
// //   border-right: 1px solid var(--border);
// //   padding: 32px 20px;
// //   box-shadow: 4px 0 20px rgba(0,0,0,0.04);
// // }

// // .logo {
// //   font-size: 22px;
// //   font-weight: 800;
// //   background: linear-gradient(90deg, #2563EB, #60A5FA);
// //   -webkit-background-clip: text;
// //   -webkit-text-fill-color: transparent;
// //   margin-bottom: 50px;
// // }

// // .menu-item {
// //   padding: 12px 16px;
// //   border-radius: 12px;
// //   margin-bottom: 10px;
// //   color: var(--muted);
// //   cursor: pointer;
// //   transition: 0.25s;
// // }

// // .menu-item:hover {
// //   background: #EEF4FF;
// //   transform: translateX(6px);
// // }

// // .menu-item.active {
// //   background: linear-gradient(90deg, #EEF4FF, #E0ECFF);
// //   color: var(--primary);
// //   font-weight: 600;
// // }

// // /* MAIN */
// // .main {
// //   flex: 1;
// //   padding: 80px 60px;
// // }

// // /* HERO */
// // .hero {
// //   position: relative;
// //   display: grid;
// //   grid-template-columns: 1.2fr 1fr;
// //   gap: 80px;
// //   align-items: center;
// // }

// // /* GLOW BACKGROUND */
// // .hero::before {
// //   content: "";
// //   position: absolute;
// //   top: -80px;
// //   left: -60px;
// //   width: 400px;
// //   height: 400px;
// //   background: radial-gradient(circle, #3B82F633, transparent 70%);
// //   filter: blur(60px);
// //   z-index: 0;
// // }

// // /* LEFT */
// // .hero-left {
// //   position: relative;
// //   z-index: 1;
// // }

// // .hero h1 {
// //   font-size: 3.5rem;
// //   font-weight: 900;
// //   line-height: 1.1;
// //   letter-spacing: -1.2px;
// // }

// // .gradient-text {
// //   background: linear-gradient(90deg, #2563EB, #3B82F6, #60A5FA);
// //   -webkit-background-clip: text;
// //   -webkit-text-fill-color: transparent;
// // }

// // /* DESCRIPTION */
// // .hero p {
// //   color: var(--muted);
// //   margin: 28px 0 40px;
// //   font-size: 17px;
// //   line-height: 1.7;
// //   max-width: 500px;
// // }

// // /* BUTTONS */
// // .btn-group {
// //   display: flex;
// //   gap: 18px;
// // }

// // .primary-btn {
// //   background: linear-gradient(135deg, #2563EB, #3B82F6);
// //   color: white;
// //   border: none;
// //   padding: 16px 28px;
// //   border-radius: 14px;
// //   font-weight: 600;
// //   font-size: 15px;
// //   cursor: pointer;
// //   transition: 0.3s;
// // }

// // .primary-btn:hover {
// //   transform: translateY(-4px);
// //   box-shadow: 0 18px 40px rgba(37,99,235,0.4);
// // }

// // .secondary-btn {
// //   border: 1px solid var(--border);
// //   padding: 16px 28px;
// //   border-radius: 14px;
// //   background: white;
// //   font-weight: 500;
// //   cursor: pointer;
// //   transition: 0.2s;
// // }

// // .secondary-btn:hover {
// //   background: #F1F5F9;
// // }

// // /* RIGHT CARDS */
// // .cards {
// //   display: flex;
// //   flex-direction: column;
// //   gap: 24px;
// //   position: relative;
// //   z-index: 1;
// // }

// // .card {
// //   background: var(--surface);
// //   border-radius: 20px;
// //   padding: 28px;
// //   border: 1px solid var(--border);
// //   box-shadow: 0 20px 50px rgba(0,0,0,0.08);
// //   transition: 0.35s;
// //   position: relative;
// //   overflow: hidden;
// // }

// // /* CARD HOVER MAGIC */
// // .card::before {
// //   content: "";
// //   position: absolute;
// //   inset: 0;
// //   background: linear-gradient(120deg, transparent, #2563EB22, transparent);
// //   opacity: 0;
// //   transition: 0.4s;
// // }

// // .card:hover::before {
// //   opacity: 1;
// // }

// // .card:hover {
// //   transform: translateY(-8px) scale(1.03);
// //   box-shadow: 0 30px 70px rgba(0,0,0,0.12);
// // }

// // .card h3 {
// //   font-size: 17px;
// //   font-weight: 700;
// //   margin-bottom: 6px;
// // }

// // .card p {
// //   color: var(--muted);
// //   font-size: 14px;
// // }

// // /* RESPONSIVE */
// // @media (max-width: 900px) {
// //   .hero {
// //     grid-template-columns: 1fr;
// //   }

// //   .main {
// //     padding: 40px 20px;
// //   }
// // }
// // `}</style>

// //       {/* SIDEBAR */}
// //       <div className="sidebar">
// //         <div className="logo">Auditable AI</div>

// //         <div className="menu-item active">Home</div>
// //         <div className="menu-item">AI Audit</div>
// //         <div className="menu-item">Reports</div>
// //         <div className="menu-item">Profile</div>
// //       </div>

// //       {/* MAIN */}
// //       <div className="main">
// //         <div className="container">

// //           <div className="hero">

// //             {/* LEFT */}
// //             <div>
// //               <h1>
// //                 AI Assurance <br />
// //                 <span className="gradient-text">Reimagined</span>
// //               </h1>

// //               <p>
// //                 Enterprise-grade AI governance, risk intelligence,
// //                 and compliance validation built for real-world systems.
// //               </p>

// //               <div className="btn-group">
// //                 <button
// //                   className="primary-btn"
// //                   onClick={() => navigate("/login")}
// //                 >
// //                   Access Platform
// //                 </button>

// //                 <button
// //                   className="secondary-btn"
// //                   onClick={() => navigate("/register")}
// //                 >
// //                   Create Account
// //                 </button>
// //               </div>
// //             </div>

// //             {/* RIGHT */}
// //             <div className="cards">
// //               <div className="card">
// //                 <h3>Risk Scoring Engine</h3>
// //                 <p>Dynamic evaluation across AI governance principles.</p>
// //               </div>

// //               <div className="card">
// //                 <h3>Model Transparency</h3>
// //                 <p>Explainability, bias detection, and compliance insights.</p>
// //               </div>

// //               <div className="card">
// //                 <h3>Audit Reports</h3>
// //                 <p>Structured, client-ready audit documentation.</p>
// //               </div>
// //             </div>

// //           </div>

// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Home;



// import { useNavigate } from "react-router-dom";

// const Home = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="layout">
//       <style>{`
// :root {
//   --kpmg-dark: #00338D;
//   --kpmg-mid: #005EB8;
//   --kpmg-light: #0091DA;

//   --bg: #F4F8FC;
//   --surface: #FFFFFF;

//   --text: #0B1F33;
//   --muted: #6B7C93;

//   --border: #E3EAF3;
// }

// /* GLOBAL */
// .layout {
//   display: flex;
//   min-height: 100vh;
//   background: var(--bg);
//   font-family: 'Inter', sans-serif;
// }

// /* SIDEBAR */
// .sidebar {
//   width: 240px;
//   background: white;
//   border-right: 1px solid var(--border);
//   padding: 32px 20px;
//   box-shadow: 4px 0 20px rgba(0,0,0,0.04);
// }

// .logo {
//   font-size: 22px;
//   font-weight: 800;
//   background: linear-gradient(90deg, #00338D, #0091DA);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   margin-bottom: 50px;
// }

// .menu-item {
//   padding: 12px 16px;
//   border-radius: 12px;
//   margin-bottom: 10px;
//   color: var(--muted);
//   cursor: pointer;
//   transition: 0.25s;
// }

// .menu-item:hover {
//   background: #EEF4FF;
//   transform: translateX(6px);
// }

// .menu-item.active {
//   background: linear-gradient(90deg, #EEF4FF, #E0ECFF);
//   color: var(--kpmg-mid);
//   font-weight: 600;
// }

// /* MAIN */
// .main {
//   flex: 1;
//   padding: 80px 60px;
// }

// /* HERO */
// .hero {
//   position: relative;
//   display: grid;
//   grid-template-columns: 1.2fr 1fr;
//   gap: 80px;
//   align-items: center;
// }

// /* GRAPHICS */
// .hero::before {
//   content: "";
//   position: absolute;
//   top: -120px;
//   right: -120px;
//   width: 500px;
//   height: 500px;
//   background: radial-gradient(circle, #0091DA33, transparent 70%);
//   filter: blur(80px);
//   z-index: 0;
// }

// .hero::after {
//   content: "";
//   position: absolute;
//   bottom: -120px;
//   left: -100px;
//   width: 400px;
//   height: 400px;
//   background: radial-gradient(circle, #005EB822, transparent 70%);
//   filter: blur(80px);
//   z-index: 0;
// }

// /* LEFT */
// .hero-left {
//   position: relative;
//   z-index: 1;
// }

// .hero h1 {
//   font-size: 3.5rem;
//   font-weight: 900;
//   line-height: 1.1;
//   letter-spacing: -1.2px;
// }

// .gradient-text {
//   background: linear-gradient(90deg, #00338D, #005EB8, #0091DA);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
// }

// .hero p {
//   color: var(--muted);
//   margin: 28px 0 40px;
//   font-size: 17px;
//   line-height: 1.7;
//   max-width: 500px;
// }

// /* BUTTONS */
// .btn-group {
//   display: flex;
//   gap: 18px;
// }

// .primary-btn {
//   background: linear-gradient(135deg, #00338D, #005EB8);
//   color: white;
//   border: none;
//   padding: 16px 28px;
//   border-radius: 14px;
//   font-weight: 600;
//   cursor: pointer;
//   transition: 0.3s;
// }

// .primary-btn:hover {
//   transform: translateY(-4px);
//   box-shadow: 0 18px 40px rgba(0,51,141,0.4);
// }

// .secondary-btn {
//   border: 1px solid var(--border);
//   padding: 16px 28px;
//   border-radius: 14px;
//   background: white;
//   font-weight: 500;
//   cursor: pointer;
// }

// .secondary-btn:hover {
//   background: #F1F5F9;
// }

// /* CARDS */
// .cards {
//   display: flex;
//   flex-direction: column;
//   gap: 24px;
//   position: relative;
//   z-index: 1;
// }

// .card {
//   background: var(--surface);
//   border-radius: 20px;
//   padding: 28px;
//   border: 1px solid var(--border);
//   box-shadow: 0 20px 50px rgba(0,51,141,0.08);
//   transition: 0.35s;
// }

// .card:hover {
//   transform: translateY(-8px) scale(1.03);
//   box-shadow: 0 30px 70px rgba(0,51,141,0.15);
// }

// .card h3 {
//   font-size: 17px;
//   font-weight: 700;
//   margin-bottom: 6px;
// }

// .card p {
//   color: var(--muted);
//   font-size: 14px;
// }

// /* RESPONSIVE */
// @media (max-width: 900px) {
//   .hero {
//     grid-template-columns: 1fr;
//   }

//   .main {
//     padding: 40px 20px;
//   }
// }
//       `}</style>

//       {/* SIDEBAR */}
//       <div className="sidebar">
//         <div className="logo">Auditable AI</div>

//         <div className="menu-item active">Home</div>
//         <div className="menu-item">AI Audit</div>
//         <div className="menu-item">Reports</div>
//         <div className="menu-item">Profile</div>
//       </div>

//       {/* MAIN */}
//       <div className="main">
//         <div className="hero">

//           {/* LEFT */}
//           <div className="hero-left">
//             <h1>
//               AI Assurance <br />
//               <span className="gradient-text">Reimagined</span>
//             </h1>

//             <p>
//               Enterprise-grade AI governance, risk intelligence,
//               transparency validation, and compliance systems
//               designed for high-stakes environments.
//             </p>

//             <div className="btn-group">
//               <button
//                 className="primary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Access Platform →
//               </button>

//               <button
//                 className="secondary-btn"
//                 onClick={() => navigate("/register")}
//               >
//                 Create Account
//               </button>
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="cards">
//             <div className="card">
//               <h3>📊 Risk Scoring Engine</h3>
//               <p>Evaluate AI across governance principles dynamically.</p>
//             </div>

//             <div className="card">
//               <h3>🔍 Model Transparency</h3>
//               <p>Explainability, bias detection, and compliance insights.</p>
//             </div>

//             <div className="card">
//               <h3>📄 Audit Reports</h3>
//               <p>Client-ready structured reports aligned with standards.</p>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

// import { useNavigate } from "react-router-dom";

// const Home = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="layout">
//       <style>{`
// :root {
//   --kpmg-dark: #00338D;
//   --kpmg-mid: #005EB8;
//   --kpmg-light: #0091DA;

//   --bg: #F4F7FB;
//   --text: #0B1F33;
//   --muted: #6B7C93;
//   --border: #E3EAF3;
// }

// /* LAYOUT */
// .layout {
//   display: flex;
//   min-height: 100vh;
//   font-family: 'Inter', sans-serif;
//   background: var(--bg);
// }

// /* SIDEBAR */
// .sidebar {
//   width: 220px;
//   background: white;
//   border-right: 1px solid var(--border);
//   padding: 30px 18px;
// }

// .logo {
//   font-size: 20px;
//   font-weight: 700;
//   color: var(--kpmg-dark);
//   margin-bottom: 40px;
// }

// .menu-item {
//   padding: 10px 14px;
//   border-radius: 8px;
//   margin-bottom: 8px;
//   color: var(--muted);
//   cursor: pointer;
// }

// .menu-item.active {
//   background: #E6F2FB;
//   color: var(--kpmg-mid);
//   font-weight: 600;
// }

// /* MAIN */
// .main {
//   flex: 1;
//   padding: 80px;
// }

// /* HERO */
// .hero {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// /* LEFT */
// .hero-left {
//   max-width: 520px;
// }

// .badge {
//   background: #E6F2FB;
//   color: var(--kpmg-mid);
//   font-size: 12px;
//   padding: 6px 12px;
//   border-radius: 20px;
//   display: inline-block;
//   margin-bottom: 20px;
// }

// .hero h1 {
//   font-size: 3.2rem;
//   font-weight: 800;
//   line-height: 1.2;
// }

// .hero h1 span {
//   color: var(--kpmg-mid);
// }

// .hero p {
//   margin: 20px 0 30px;
//   color: var(--muted);
//   line-height: 1.6;
// }

// /* BUTTONS */
// .btn-group {
//   display: flex;
//   gap: 12px;
// }

// .primary-btn {
//   background: var(--kpmg-dark);
//   color: white;
//   padding: 12px 22px;
//   border-radius: 8px;
//   border: none;
//   cursor: pointer;
// }

// .secondary-btn {
//   border: 1px solid var(--border);
//   padding: 12px 22px;
//   border-radius: 8px;
//   background: white;
// }

// /* RIGHT GRAPHIC */
// .hero-graphic {
//   width: 380px;
//   height: 380px;
//   position: relative;
// }

// /* fake network dots */
// .dot {
//   width: 8px;
//   height: 8px;
//   background: var(--kpmg-mid);
//   border-radius: 50%;
//   position: absolute;
// }

// /* lines */
// .line {
//   position: absolute;
//   height: 1px;
//   background: #BFD7F2;
//   transform-origin: left;
// }

// /* STATS */
// .stats {
//   margin-top: 60px;
//   display: flex;
//   gap: 40px;
// }

// .stat {
//   font-size: 14px;
// }

// .stat strong {
//   font-size: 18px;
//   color: var(--kpmg-dark);
// }

// /* RESPONSIVE */
// @media (max-width: 900px) {
//   .hero {
//     flex-direction: column;
//     gap: 40px;
//   }

//   .hero-graphic {
//     display: none;
//   }
// }
//       `}</style>

//       {/* SIDEBAR */}
//       <div className="sidebar">
//         <div className="logo">Auditable AI</div>
//         <div className="menu-item active">Home</div>
//         <div className="menu-item">AI Audit</div>
//         <div className="menu-item">Reports</div>
//         <div className="menu-item">Profile</div>
//       </div>

//       {/* MAIN */}
//       <div className="main">

//         <div className="hero">

//           {/* LEFT */}
//           <div className="hero-left">
//             <div className="badge">AI-Powered Risk Intelligence</div>

//             <h1>
//               AI Risk <br />
//               <span>Audit Platform</span>
//             </h1>

//             <p>
//               AI-powered risk intelligence transforming enterprise systems
//               into transparent, compliant, and trustworthy solutions.
//             </p>

//             <div className="btn-group">
//               <button
//                 className="primary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Explore Platform →
//               </button>

//               <button
//                 className="secondary-btn"
//                 onClick={() => navigate("/register")}
//               >
//                 Sign In
//               </button>
//             </div>
//           </div>

//           {/* RIGHT GRAPHIC */}
//           <div className="hero-graphic">

//             <div className="dot" style={{ top: "40px", left: "120px" }} />
//             <div className="dot" style={{ top: "120px", left: "200px" }} />
//             <div className="dot" style={{ top: "200px", left: "80px" }} />
//             <div className="dot" style={{ top: "300px", left: "160px" }} />

//             <div className="line" style={{ top: "45px", left: "125px", width: "120px", transform: "rotate(30deg)" }} />
//             <div className="line" style={{ top: "130px", left: "200px", width: "140px", transform: "rotate(120deg)" }} />
//             <div className="line" style={{ top: "210px", left: "80px", width: "150px", transform: "rotate(40deg)" }} />

//           </div>

//         </div>

//         {/* STATS */}
//         <div className="stats">
//           <div className="stat"><strong>50+</strong><br />Audits</div>
//           <div className="stat"><strong>10+</strong><br />Domains</div>
//           <div className="stat"><strong>Live</strong><br />Monitoring</div>
//           <div className="stat"><strong>2</strong><br />Modes</div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default Home;


// import { useNavigate } from "react-router-dom";

// const Home = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="layout">
//       <style>{`
//         :root {
//           --kpmg-dark: #00338D;
//           --kpmg-mid: #005EB8;
//           --kpmg-light: #0091DA;
//           --accent: #00C896;

//           --bg: #F4F7FB;
//           --text: #0B1F33;
//           --muted: #6B7C93;
//           --border: #E3EAF3;
//         }

//         .layout {
//           min-height: 100vh;
//           font-family: 'Inter', system-ui, sans-serif;
//           background: var(--bg);
//           color: var(--text);
//         }

//         /* NAVBAR */
//         .navbar {
//           padding: 24px 60px;
//           display: flex;
//           align-items: center;
//           justify-content: flex-end;
//         }

//         /* MAIN - Shifted upward */
//         .main {
//           padding: 70px 60px 80px;
//         }

//         /* HERO */
//         .hero {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 80px;
//         }

//         /* LEFT SIDE */
//         .hero-left {
//           max-width: 540px;
//           padding-left: 20px;
//         }

//         .badge {
//           background: #E6F2FB;
//           color: var(--kpmg-mid);
//           font-size: 13px;
//           padding: 8px 18px;
//           border-radius: 30px;
//           display: inline-block;
//           margin-bottom: 24px;
//           font-weight: 600;
//         }

//         .hero h1 {
//           font-size: 3.8rem;
//           font-weight: 800;
//           line-height: 1.12;
//           margin-bottom: 24px;
//         }

//         .hero h1 span {
//           background: linear-gradient(135deg, #0091DA, #00C896);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//         }

//         .hero p {
//           font-size: 1.22rem;
//           color: var(--muted);
//           line-height: 1.65;
//           margin-bottom: 40px;
//         }

//         /* BUTTONS */
//         .btn-group {
//           display: flex;
//           gap: 16px;
//         }

//         .primary-btn {
//           background: linear-gradient(135deg, var(--kpmg-dark), var(--kpmg-mid));
//           color: white;
//           padding: 16px 34px;
//           border-radius: 12px;
//           border: none;
//           cursor: pointer;
//           font-weight: 700;
//           font-size: 1.08rem;
//           transition: all 0.3s ease;
//         }

//         .primary-btn:hover {
//           transform: translateY(-4px);
//           box-shadow: 0 15px 35px rgba(0,51,141,0.3);
//         }

//         .secondary-btn {
//           background: white;
//           border: 2px solid #E3EAF3;
//           color: var(--kpmg-dark);
//           padding: 16px 34px;
//           border-radius: 12px;
//           cursor: pointer;
//           font-weight: 600;
//           transition: all 0.3s ease;
//         }

//         .secondary-btn:hover {
//           background: #f8fafd;
//           border-color: var(--kpmg-light);
//           transform: translateY(-2px);
//         }

//         /* 6 CARDS WITH NICE OUTLINE */
//         .cards-grid {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 28px;
//           width: 700px;
//         }

//         .card {
//           background: white;
//           border-radius: 22px;
//           padding: 34px 28px;
//           border: 2px solid #E3EAF3;           /* Clean outline */
//           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
//           cursor: pointer;
//           box-shadow: 0 8px 25px rgba(0,0,0,0.06);
//           height: 100%;
//         }

//         .card:hover {
//           border-color: var(--kpmg-light);     /* Highlight on hover */
//           transform: translateY(-12px);
//           box-shadow: 0 22px 50px rgba(0,51,141,0.18);
//         }

//         .card h3 {
//           font-size: 18.5px;
//           font-weight: 700;
//           margin-bottom: 14px;
//           color: var(--kpmg-dark);
//         }

//         .card p {
//           font-size: 14.8px;
//           color: var(--muted);
//           line-height: 1.65;
//         }

//         /* RESPONSIVE */
//         @media (max-width: 1200px) {
//           .hero {
//             flex-direction: column;
//             gap: 70px;
//             text-align: center;
//           }

//           .hero-left {
//             padding-left: 0;
//             max-width: 100%;
//           }

//           .cards-grid {
//             width: 100%;
//             max-width: 700px;
//             margin: 0 auto;
//             grid-template-columns: repeat(2, 1fr);
//           }
//         }

//         @media (max-width: 640px) {
//           .main {
//             padding: 50px 20px;
//           }
//           .hero h1 {
//             font-size: 3.1rem;
//           }
//           .cards-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       {/* NAVBAR */}
//       <div className="navbar">
//         {/* Empty navbar */}
//       </div>

//       {/* MAIN CONTENT */}
//       <div className="main">
//         <div className="hero">

//           {/* LEFT SIDE */}
//           <div className="hero-left">
//             <div className="badge">AI Governance Platform</div>

//             <h1>
//               AI Assurance <br />
//               <span>Reimagined.</span>
//             </h1>

//             <p>
//               Enterprise-grade AI governance, risk intelligence, 
//               transparency validation, and regulatory compliance 
//               built for high-stakes systems.
//             </p>

//             <div className="btn-group">
//               <button
//                 className="primary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Access Platform →
//               </button>

//               <button
//                 className="secondary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Sign In
//               </button>
//             </div>
//           </div>

//           {/* RIGHT SIDE - 6 Cards with Outline */}
//       <div className="cards-grid">
//             <div className="card">
//               <h3>📋 AI Register</h3>
//               <p>Register and manage all your AI models centrally.</p>
//             </div>

//             <div className="card">
//               <h3>📥 Smart Ingestion</h3>
//               <p>Upload logs or use SDCC for automatic data classification.</p>
//             </div>

//             <div className="card">
//               <h3>🔍 Blackbox Testing</h3>
//               <p>Generate synthetic logs and run evaluations when needed.</p>
//             </div>

//             <div className="card">
//               <h3>📊 Full Audit</h3>
//               <p>Run complete trusted AI assessment with detailed scoring.</p>
//             </div>

//             <div className="card">
//               <h3>📑 Audit Reports</h3>
//               <p>Generate professional PDF reports with findings and evidence.</p>
//             </div>

//             <div className="card">
//               <h3>📈 Live Monitoring</h3>
//               <p>Continuous monitoring and drift detection in production.</p>
//             </div>
//           </div>




//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;


// import { useNavigate } from "react-router-dom";

// const Home = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="layout">
//       <style>{`
//         :root {
//           --kpmg-dark: #00338D;
//           --kpmg-mid: #005EB8;
//           --kpmg-light: #0091DA;
//           --accent: #00C896;

//           --bg: #F4F7FB;
//           --text: #0B1F33;
//           --muted: #6B7C93;
//           --border: #E3EAF3;
//         }

//         .layout {
//           min-height: 100vh;
//           font-family: 'Inter', system-ui, sans-serif;
//           background: var(--bg);
//           color: var(--text);
//         }

//         /* NAVBAR with KPMG Logo */
//         .navbar {
//           padding: 10px 80px;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//         }

//         .logo img {
//           height: 90px;
//         }

//         /* MAIN - Controlled padding to prevent extra scroll */
//         .main {
//           padding: 30px 60px 100px;   /* reduced top padding */
//         }

//         /* HERO */
//         .hero {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 90px;
//         }

//         /* LEFT SIDE */
//         .hero-left {
//           max-width: 520px;
//         }

//         .badge {
//           background: #E6F2FB;
//           color: var(--kpmg-mid);
//           font-size: 13px;
//           padding: 8px 20px;
//           border-radius: 30px;
//           display: inline-block;
//           margin-bottom: 24px;
//           font-weight: 600;
//         }

//         .hero h1 {
//           font-size: 3.85rem;
//           font-weight: 800;
//           line-height: 1.1;
//           margin-bottom: 24px;
//         }

//         .hero h1 span {
//           background: linear-gradient(135deg, #0091DA, #00C896);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//         }

//         .hero p {
//           font-size: 1.23rem;
//           color: var(--muted);
//           line-height: 1.68;
//           margin-bottom: 42px;
//         }

//         /* BUTTONS */
//         .btn-group {
//           display: flex;
//           gap: 18px;
//         }

//         .primary-btn {
//           background: linear-gradient(135deg, var(--kpmg-dark), var(--kpmg-mid));
//           color: white;
//           padding: 16px 36px;
//           border-radius: 12px;
//           border: none;
//           cursor: pointer;
//           font-weight: 700;
//           font-size: 1.1rem;
//           transition: all 0.3s ease;
//         }

//         .primary-btn:hover {
//           transform: translateY(-4px);
//           box-shadow: 0 18px 40px rgba(0,51,141,0.35);
//         }

//         .secondary-btn {
//           background: white;
//           border: 2px solid #E3EAF3;
//           color: var(--kpmg-dark);
//           padding: 16px 36px;
//           border-radius: 12px;
//           cursor: pointer;
//           font-weight: 600;
//           transition: all 0.3s ease;
//         }

//         .secondary-btn:hover {
//           background: #f8fafd;
//           border-color: var(--kpmg-light);
//           transform: translateY(-2px);
//         }

//         /* 6 CARDS - Improved Text Styling */
//         .cards-grid {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 28px;
//           width: 720px;
//         }

//         .card {
//           background: white;
//           border-radius: 22px;
//           padding: 32px 26px;
//           border: 2px solid #E3EAF3;
//           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
//           cursor: pointer;
//           box-shadow: 0 10px 30px rgba(0,0,0,0.07);
//           height: 100%;
//         }

//         .card:hover {
//           border-color: var(--kpmg-light);
//           transform: translateY(-12px);
//           box-shadow: 0 25px 60px rgba(0,51,141,0.22);
//         }

//         .card h3 {
//           font-size: 18px;
//           font-weight: 700;
//           margin-bottom: 12px;
//           color: var(--kpmg-dark);
//           letter-spacing: -0.02em;
//         }

//         .card p {
//           font-size: 14.2px;
//           color: var(--muted);
//           line-height: 1.6;
//           font-weight: 400;
//         }

//         /* RESPONSIVE */
//         @media (max-width: 1200px) {
//           .hero {
//             flex-direction: column;
//             gap: 80px;
//             text-align: center;
//           }

//           .hero-left {
//             max-width: 100%;
//           }

//           .cards-grid {
//             width: 100%;
//             max-width: 720px;
//             margin: 0 auto;
//             grid-template-columns: repeat(2, 1fr);
//           }
//         }

//         @media (max-width: 640px) {
//           .main {
//             padding: 50px 20px;
//           }
//           .hero h1 {
//             font-size: 3.1rem;
//           }
//           .cards-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       {/* NAVBAR with KPMG Logo at Top Left */}
//       <div className="navbar">
//         <div className="logo">
//           <img src="/kpmg-logo.png" alt="KPMG Logo" />
//         </div>
//       </div>

//       {/* MAIN CONTENT */}
//       <div className="main">
//         <div className="hero">

//           {/* LEFT SIDE */}
//           <div className="hero-left">
//             <div className="badge">AI Governance Platform</div>

//             <h1>
//               AI Assurance <br />
//               <span>Reimagined.</span>
//             </h1>

//             <p>
//               Enterprise-grade AI governance, risk intelligence, 
//               transparency validation, and regulatory compliance 
//               built for high-stakes systems.
//             </p>

//             <div className="btn-group">
//               <button
//                 className="primary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Access Platform →
//               </button>

//               <button
//                 className="secondary-btn"
//                 onClick={() => navigate("/login")}
//               >
//                 Sign In
//               </button>
//             </div>
//           </div>

//           {/* RIGHT SIDE - 6 Cards */}
//           <div className="cards-grid">
//             <div className="card">
//               <h3>📋 AI Register</h3>
//               <p>Register and manage all your AI models centrally.</p>
//             </div>

//             <div className="card">
//               <h3>📥 Smart Ingestion</h3>
//               <p>Upload logs or use SDCC for automatic classification.</p>
//             </div>

//             <div className="card">
//               <h3>🔍 Blackbox Testing</h3>
//               <p>Generate synthetic logs when real data is unavailable.</p>
//             </div>

//             <div className="card">
//               <h3>📊 Full Audit</h3>
//               <p>Run complete trusted AI assessment with detailed scoring.</p>
//             </div>

//             <div className="card">
//               <h3>📑 Audit Reports</h3>
//               <p>Generate professional PDF reports with findings.</p>
//             </div>

//             <div className="card">
//               <h3>📈 Live Monitoring</h3>
//               <p>Continuous monitoring and drift detection in production.</p>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  // Check if user is logged in (simple check using localStorage)
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="layout">
      <style>{`
        :root {
          --kpmg-dark: #00338D;
          --kpmg-mid: #005EB8;
          --kpmg-light: #0091DA;
          --accent: #00C896;

          --bg: #F4F7FB;
          --text: #0B1F33;
          --muted: #6B7C93;
          --border: #E3EAF3;
        }

        .layout {
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg);
          color: var(--text);
        }

        /* NAVBAR - Fixed compact height */
        .navbar {
          padding: 16px 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 76px; /* Fixed height to prevent shifting */
        }

        .logo img {
          height: 90px; /* Your requested logo size */
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Improved Profile Icon */
        .profile-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--kpmg-mid), var(--kpmg-light));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,51,141,0.15);
          transition: all 0.3s ease;
        }

        .profile-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,51,141,0.25);
        }

        /* MAIN */
        .main {
          padding: 80px 60px 100px;
        }

        /* HERO */
        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 90px;
        }

        .hero-left {
          max-width: 520px;
        }

        .badge {
          background: #E6F2FB;
          color: var(--kpmg-mid);
          font-size: 13px;
          padding: 8px 20px;
          border-radius: 30px;
          display: inline-block;
          margin-bottom: 24px;
          font-weight: 600;
        }

        .hero h1 {
          font-size: 3.85rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .hero h1 span {
          background: linear-gradient(135deg, #0091DA, #00C896);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          font-size: 1.23rem;
          color: var(--muted);
          line-height: 1.68;
          margin-bottom: 42px;
        }

        /* BUTTONS */
        .btn-group {
          display: flex;
          gap: 18px;
        }

        .primary-btn {
          background: linear-gradient(135deg, var(--kpmg-dark), var(--kpmg-mid));
          color: white;
          padding: 16px 36px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.3s ease;
        }

        .primary-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(0,51,141,0.35);
        }

        .secondary-btn {
          background: white;
          border: 2px solid #E3EAF3;
          color: var(--kpmg-dark);
          padding: 16px 36px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: #f8fafd;
          border-color: var(--kpmg-light);
          transform: translateY(-2px);
        }

        /* 6 CARDS */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          width: 720px;
        }

        .card {
          background: white;
          border-radius: 22px;
          padding: 32px 26px;
          border: 2px solid #E3EAF3;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0,0,0,0.07);
          height: 100%;
        }

        .card:hover {
          border-color: var(--kpmg-light);
          transform: translateY(-12px);
          box-shadow: 0 25px 60px rgba(0,51,141,0.22);
        }

        .card h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--kpmg-dark);
          letter-spacing: -0.02em;
        }

        .card p {
          font-size: 14.2px;
          color: var(--muted);
          line-height: 1.6;
          font-weight: 400;
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .hero {
            flex-direction: column;
            gap: 80px;
            text-align: center;
          }

          .hero-left {
            max-width: 100%;
          }

          .cards-grid {
            width: 100%;
            max-width: 720px;
            margin: 0 auto;
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .main {
            padding: 50px 20px;
          }
          .hero h1 {
            font-size: 3.1rem;
          }
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .navbar {
            padding: 16px 24px;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <div className="navbar">
        <div className="logo">
          <img src="/kpmg-logo.png" alt="KPMG Logo" />
        </div>

        <div className="nav-right">
          {isLoggedIn && (
            <div 
              className="profile-icon"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              👤
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="hero">

          {/* LEFT SIDE */}
          <div className="hero-left">
            <div className="badge">AI Governance Platform</div>

            <h1>
              AI Assurance <br />
              <span>Reimagined.</span>
            </h1>

            <p>
              Enterprise-grade AI governance, risk intelligence, 
              transparency validation, and regulatory compliance 
              built for high-stakes systems.
            </p>

            <div className="btn-group">
              <button
                className="primary-btn"
                onClick={() => navigate("/login")}
              >
                Access Platform →
              </button>

              <button
                className="secondary-btn"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - 6 Cards */}
          <div className="cards-grid">
            <div className="card">
              <h3>📋 AI Register</h3>
              <p>Register and manage all your AI models centrally.</p>
            </div>

            <div className="card">
              <h3>📥 Smart Ingestion</h3>
              <p>Upload logs or use SDCC for automatic classification.</p>
            </div>

            <div className="card">
              <h3>🔍 Blackbox Testing</h3>
              <p>Generate synthetic logs when real data is unavailable.</p>
            </div>

            <div className="card">
              <h3>📊 Full Audit</h3>
              <p>Run complete trusted AI assessment with detailed scoring.</p>
            </div>

            <div className="card">
              <h3>📑 Audit Reports</h3>
              <p>Generate professional PDF reports with findings.</p>
            </div>

            <div className="card">
              <h3>📈 Live Monitoring</h3>
              <p>Continuous monitoring and drift detection in production.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;