
// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import { useState, useEffect } from "react";

// // // interface Principle { score: number; parameters: Record<string, number>; }
// // // interface ReportData {
// // //   report_id: string; ai_name: string; model_type: string; evaluated_at: string;
// // //   overall_score: number; risk_level: string; structural_risk: string;
// // //   logs_evaluated: number; data_quality_score: number;
// // //   trusted_ai_principles: Record<string, Principle>;
// // //   diagnostics: { missing_ratio: number; duplicates: number; schema_confidence: number; total_columns: number; text_columns: number; numeric_columns: number; column_names: string[]; };
// // //   findings: { category: string; severity: string; issue: string; recommendation: string }[];
// // //   recommendation: string;
// // //   framework_compliance: Record<string, string>;
// // // }

// // // const ICONS: Record<string,string> = { Transparency:"🔍", Explainability:"💡", Fairness:"⚖️", Accountability:"📋", "Data Integrity":"🗄️", Reliability:"⚙️", Security:"🔒", Privacy:"🛡️", Sustainability:"🌱", "Human-Centricity":"👤" };
// // // const COLORS: Record<string,string> = { Transparency:"#00C8FF", Explainability:"#00E5A0", Fairness:"#FF6B9D", Accountability:"#FFB020", "Data Integrity":"#A78BFA", Reliability:"#34D399", Security:"#F87171", Privacy:"#60A5FA", Sustainability:"#4ADE80", "Human-Centricity":"#FBBF24" };
// // // const FW: Record<string,{label:string;icon:string;desc:string}> = {
// // //   EU_AI_Act:{label:"EU AI Act",icon:"🇪🇺",desc:"European Union AI Regulation"},
// // //   ISO_42001:{label:"ISO 42001",icon:"🏅",desc:"AI Management System Standard"},
// // //   NIST_AI_RMF:{label:"NIST AI RMF",icon:"🏛️",desc:"AI Risk Management Framework"},
// // //   KPMG_TAF:{label:"KPMG Trusted AI",icon:"🔷",desc:"Trusted AI Framework"},
// // // };
// // // const CC: Record<string,string> = { Compliant:"#00C896","Certified Ready":"#00C896",Aligned:"#00C896",Conditional:"#ffb020",Assessed:"#60A5FA",Partial:"#ff4d4d" };

// // // function Spider({ principles, onSelect, selected }: { principles: Record<string,Principle>; onSelect:(k:string|null)=>void; selected:string|null }) {
// // //   const keys = Object.keys(principles); const N = keys.length;
// // //   const cx=250,cy=250,R=175;
// // //   const ang=(i:number)=>(Math.PI*2*i)/N - Math.PI/2;
// // //   const pt=(i:number,v:number)=>({ x:cx+(v/100)*R*Math.cos(ang(i)), y:cy+(v/100)*R*Math.sin(ang(i)) });
// // //   const lp=(i:number)=>{ const r=R+38; return {x:cx+r*Math.cos(ang(i)),y:cy+r*Math.sin(ang(i))}; };
// // //   const poly = keys.map((k,i)=>pt(i,principles[k].score));
// // //   const polyStr = poly.map(p=>`${p.x},${p.y}`).join(" ");
// // //   return (
// // //     <svg viewBox="0 0 500 500" style={{width:"100%",maxWidth:500,display:"block",margin:"0 auto"}}>
// // //       {[20,40,60,80,100].map(lvl=>(
// // //         <polygon key={lvl} points={keys.map((_,i)=>pt(i,lvl)).map(p=>`${p.x},${p.y}`).join(" ")}
// // //           fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
// // //       ))}
// // //       {keys.map((_,i)=>{ const e=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>; })}
// // //       <polygon points={polyStr} fill="rgba(0,200,150,0.12)" stroke="rgba(0,200,150,0.55)" strokeWidth="2" strokeLinejoin="round"/>
// // //       {[20,40,60,80,100].map(lvl=>(
// // //         <text key={`t${lvl}`} x={cx+4} y={cy-(lvl/100)*R+4} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="start">{lvl}</text>
// // //       ))}
// // //       {poly.map((p,i)=>{ const k=keys[i]; const c=COLORS[k]||"#00C896"; const sel=selected===k;
// // //         return <circle key={i} cx={p.x} cy={p.y} r={sel?10:6} fill={c} stroke={sel?"#fff":"rgba(255,255,255,0.3)"} strokeWidth={sel?2.5:1.5} style={{cursor:"pointer",transition:"r 0.2s"}} onClick={()=>onSelect(selected===k?null:k)}/>;
// // //       })}
// // //       {keys.map((k,i)=>{ const lpos=lp(i); const c=COLORS[k]||"#00C896"; const sel=selected===k; const parts=k.split(" "); const sc=principles[k].score;
// // //         return (
// // //           <g key={k} style={{cursor:"pointer"}} onClick={()=>onSelect(selected===k?null:k)}>
// // //             {parts.map((pt2,pi)=>(
// // //               <text key={pi} x={lpos.x} y={lpos.y+(pi-parts.length/2)*13} textAnchor="middle" fill={sel?c:"rgba(255,255,255,0.7)"} fontSize={sel?"11":"9.5"} fontWeight={sel?"700":"400"} fontFamily="'DM Sans',sans-serif" style={{transition:"all 0.2s"}}>{pt2}</text>
// // //             ))}
// // //             <text x={lpos.x} y={lpos.y+(parts.length/2)*13+4} textAnchor="middle" fill={c} fontSize="10" fontWeight="800" fontFamily="'DM Sans',sans-serif">{sc}</text>
// // //           </g>
// // //         );
// // //       })}
// // //       <circle cx={cx} cy={cy} r={40} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
// // //       <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="'DM Sans',sans-serif">
// // //         {Math.round(Object.values(principles).reduce((s,v)=>s+v.score,0)/N)}
// // //       </text>
// // //       <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'DM Sans',sans-serif">OVERALL</text>
// // //     </svg>
// // //   );
// // // }

// // // function BarChart({ principles }: { principles: Record<string,Principle> }) {
// // //   const [hov, setHov] = useState<string|null>(null);
// // //   const entries = Object.entries(principles);
// // //   const W = entries.length*60+50;
// // //   return (
// // //     <div style={{overflowX:"auto"}}>
// // //       <svg viewBox={`0 0 ${W} 220`} style={{width:"100%",minWidth:500,display:"block"}}>
// // //         {[0,25,50,75,100].map(lvl=>(
// // //           <g key={lvl}>
// // //             <line x1={35} y1={192-lvl*1.7} x2={W-10} y2={192-lvl*1.7} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
// // //             <text x={30} y={195-lvl*1.7} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="'DM Sans',sans-serif">{lvl}</text>
// // //           </g>
// // //         ))}
// // //         {entries.map(([name,data],i)=>{
// // //           const c=COLORS[name]||"#00C896"; const h=(data.score/100)*170; const x=45+i*60; const isHov=hov===name;
// // //           return (
// // //             <g key={name} onMouseEnter={()=>setHov(name)} onMouseLeave={()=>setHov(null)} style={{cursor:"pointer"}}>
// // //               <rect x={x} y={192-h} width={36} height={h} rx={4} fill={isHov?c:`${c}88`} style={{transition:"fill 0.2s"}}/>
// // //               {isHov&&<><rect x={x-5} y={192-h-26} width={46} height={20} rx={4} fill="rgba(0,0,0,0.85)" stroke={`${c}55`} strokeWidth="1"/>
// // //               <text x={x+18} y={192-h-12} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="'DM Sans',sans-serif">{data.score}</text></>}
// // //               <text x={x+18} y={205} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="'DM Sans',sans-serif">{name.split(" ")[0]}</text>
// // //             </g>
// // //           );
// // //         })}
// // //       </svg>
// // //     </div>
// // //   );
// // // }

// // // function Radial({ score, label, color, size=90 }: { score:number; label:string; color:string; size?:number }) {
// // //   const r=size*0.38; const circ=2*Math.PI*r; const dash=(score/100)*circ;
// // //   return (
// // //     <div style={{textAlign:"center"}}>
// // //       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
// // //         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*0.08}/>
// // //         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
// // //           strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
// // //           transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1s ease"}}/>
// // //         <text x={size/2} y={size/2+4} textAnchor="middle" fill="white" fontSize={size*0.2} fontWeight="800" fontFamily="'DM Sans',sans-serif">{score}</text>
// // //       </svg>
// // //       <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
// // //     </div>
// // //   );
// // // }

// // // export default function Report() {
// // //   const location = useLocation(); const navigate = useNavigate();
// // //   const r: ReportData = location.state?.data;
// // //   const [sel, setSel] = useState<string|null>(null);
// // //   const [anim, setAnim] = useState(false);
// // //   useEffect(()=>{ setTimeout(()=>setAnim(true),60); },[]);

// // //   if (!r) return (
// // //     <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#050d1a",gap:16}}>
// // //       <p style={{color:"rgba(255,255,255,0.5)"}}>No report data found.</p>
// // //       <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Back to Dashboard</button>
// // //     </div>
// // //   );

// // //   const prn = r.trusted_ai_principles || {};
// // //   const pkeys = Object.keys(prn);
// // //   const hasPrn = pkeys.length > 0;
// // //   const rc = r.risk_level==="Low"?"#00C896":r.risk_level==="Moderate"?"#ffb020":"#ff4d4d";
// // //   const fmt=(d:string)=>new Date(d).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
// // //   const selData = sel ? prn[sel] : null;

// // //   const fadeStyle=(delay:number):React.CSSProperties=>({ opacity:anim?1:0, transform:anim?"none":"translateY(16px)", transition:`all 0.6s ease ${delay}s` });

// // //   return (
// // //     <div style={S.page}>
// // //       <div style={S.bg}/>

// // //       {/* HEADER */}
// // //       <div style={{...S.header,...fadeStyle(0)}}>
// // //         <div>
// // //           <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
// // //             <span style={S.logo}>Auditable AI™</span>
// // //             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
// // //           </div>
// // //           <h1 style={S.title}>Governance Audit Report</h1>
// // //           <div style={S.meta}>
// // //             <span>📌 {r.ai_name}</span><span style={S.dot}>·</span>
// // //             <span>🧠 {r.model_type}</span><span style={S.dot}>·</span>
// // //             <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}>·</span>
// // //             <span style={{fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.3)"}}>ID: {r.report_id?.slice(0,12)}…</span>
// // //           </div>
// // //         </div>
// // //         <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Dashboard</button>
// // //       </div>

// // //       {/* HERO SCORE */}
// // //       <div style={{...S.heroRow,...fadeStyle(0.1)}}>
// // //         <div style={{...S.heroScore,borderColor:`${rc}44`}}>
// // //           <div style={{fontSize:68,fontWeight:900,color:rc,lineHeight:1,fontFamily:"'DM Sans',sans-serif"}}>{r.overall_score}</div>
// // //           <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4}}>/ 100</div>
// // //           <div style={{...S.riskPill,background:`${rc}20`,border:`1px solid ${rc}55`,color:rc}}>{r.risk_level} Risk</div>
// // //         </div>
// // //         <div style={S.statsRow}>
// // //           {[
// // //             {icon:"📂",label:"Logs Evaluated",val:r.logs_evaluated},
// // //             {icon:"📊",label:"Data Quality",val:`${r.data_quality_score}%`},
// // //             {icon:"🏗️",label:"Structural Risk",val:r.structural_risk},
// // //             {icon:"✅",label:"Principles Tested",val:pkeys.length},
// // //             {icon:"⚠️",label:"Findings",val:r.findings?.length||0},
// // //           ].map((s,i)=>(
// // //             <div key={i} style={S.statCard}>
// // //               <span style={{fontSize:22}}>{s.icon}</span>
// // //               <div style={{fontSize:22,fontWeight:800,color:"white",fontFamily:"'DM Sans',sans-serif"}}>{s.val}</div>
// // //               <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{s.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>

// // //       {/* FRAMEWORK COMPLIANCE */}
// // //       <section style={{...S.sec,...fadeStyle(0.15)}}>
// // //         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
// // //         <p style={S.secSub}>Assessment conducted against the following international AI governance frameworks.</p>
// // //         <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
// // //           {Object.entries(r.framework_compliance||{}).map(([key,status])=>{
// // //             const fw=FW[key]||{label:key,icon:"📋",desc:""};
// // //             const sc=CC[status]||"#aaa";
// // //             return (
// // //               <div key={key} style={{...S.fwCard,borderColor:`${sc}44`}}>
// // //                 <div style={{fontSize:30}}>{fw.icon}</div>
// // //                 <div style={{fontWeight:700,fontSize:14,color:"white",marginTop:6}}>{fw.label}</div>
// // //                 <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2,textAlign:"center"}}>{fw.desc}</div>
// // //                 <div style={{...S.fwPill,background:`${sc}20`,border:`1px solid ${sc}55`,color:sc}}>{status}</div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //         <div style={S.fwNote}>
// // //           <span style={{opacity:0.4}}>ℹ️</span>
// // //           <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginLeft:8}}>
// // //             <b style={{color:"rgba(255,255,255,0.6)"}}>EU AI Act</b> alignment reflects Title III transparency & accountability requirements.&nbsp;
// // //             <b style={{color:"rgba(255,255,255,0.6)"}}>ISO/IEC 42001:2023</b> readiness reflects AI management system controls coverage.&nbsp;
// // //             <b style={{color:"rgba(255,255,255,0.6)"}}>NIST AI RMF</b> alignment reflects GOVERN, MAP, MEASURE, MANAGE function coverage.&nbsp;
// // //             <b style={{color:"rgba(255,255,255,0.6)"}}>KPMG Trusted AI Framework</b> scoring drives all compliance determinations.
// // //           </span>
// // //         </div>
// // //       </section>

// // //       {/* SPIDER CHART */}
// // //       {hasPrn && (
// // //         <section style={{...S.sec,...fadeStyle(0.2)}}>
// // //           <h2 style={S.secTitle}>🕸️ KPMG Trusted AI — 10 Principles Assessment</h2>
// // //           <p style={S.secSub}>Click any principle node or label on the spider chart to drill into its sub-parameters.</p>
// // //           <div style={S.spiderWrap}>
// // //             <div style={{flex:"0 0 auto",width:"min(100%,500px)"}}>
// // //               <Spider principles={prn} onSelect={setSel} selected={sel}/>
// // //               <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:6}}>Click a node to inspect sub-parameters →</p>
// // //             </div>
// // //             <div style={S.drillPanel}>
// // //               {!sel ? (
// // //                 <div style={{width:"100%"}}>
// // //                   <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",textAlign:"center",marginBottom:20}}>Select a principle to view breakdown</div>
// // //                   {pkeys.map(k=>{
// // //                     const c=COLORS[k]||"#00C896"; const sc=prn[k].score;
// // //                     return (
// // //                       <div key={k} style={S.pRow} onClick={()=>setSel(k)}>
// // //                         <span style={{fontSize:16}}>{ICONS[k]}</span>
// // //                         <span style={{flex:1,fontSize:13,color:"rgba(255,255,255,0.7)"}}>{k}</span>
// // //                         <div style={{width:80,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
// // //                           <div style={{width:`${sc}%`,height:"100%",background:c,borderRadius:3}}/>
// // //                         </div>
// // //                         <span style={{fontSize:13,fontWeight:700,color:c,minWidth:28,textAlign:"right"}}>{sc}</span>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               ) : selData ? (
// // //                 <div style={{width:"100%",animation:"fadeIn 0.3s ease"}}>
// // //                   <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
// // //                     <span style={{fontSize:26}}>{ICONS[sel]}</span>
// // //                     <div>
// // //                       <div style={{fontSize:17,fontWeight:800,color:"white"}}>{sel}</div>
// // //                       <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Sub-parameter breakdown</div>
// // //                     </div>
// // //                     <div style={{marginLeft:"auto",fontSize:34,fontWeight:900,color:COLORS[sel]||"#00C896"}}>{selData.score}</div>
// // //                   </div>
// // //                   <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
// // //                     <Radial score={selData.score} label={sel} color={COLORS[sel]||"#00C896"} size={100}/>
// // //                   </div>
// // //                   {Object.entries(selData.parameters).map(([param,val])=>{
// // //                     const v=val as number; const c=COLORS[sel]||"#00C896";
// // //                     const sl=v>=75?"Good":v>=50?"Fair":"Poor"; const sc2=v>=75?"#00C896":v>=50?"#ffb020":"#ff4d4d";
// // //                     return (
// // //                       <div key={param} style={{marginBottom:14}}>
// // //                         <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
// // //                           <span style={{fontSize:12,color:"rgba(255,255,255,0.7)",flex:1}}>{param}</span>
// // //                           <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700,color:sc2,background:`${sc2}18`,border:`1px solid ${sc2}44`}}>{sl}</span>
// // //                           <span style={{fontSize:13,fontWeight:700,color:c,minWidth:28,textAlign:"right"}}>{v}</span>
// // //                         </div>
// // //                         <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
// // //                           <div style={{width:`${v}%`,height:"100%",background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:3,transition:"width 1s ease"}}/>
// // //                         </div>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                   <button style={{...S.backDrillBtn,borderColor:`${COLORS[sel]||"#00C896"}44`,color:COLORS[sel]||"#00C896"}} onClick={()=>setSel(null)}>← Back to Overview</button>
// // //                 </div>
// // //               ) : null}
// // //             </div>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* BAR CHART */}
// // //       {hasPrn && (
// // //         <section style={{...S.sec,...fadeStyle(0.25)}}>
// // //           <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
// // //           <p style={S.secSub}>Hover bars for exact scores.</p>
// // //           <BarChart principles={prn}/>
// // //         </section>
// // //       )}

// // //       {/* RADIAL GRID */}
// // //       {hasPrn && (
// // //         <section style={{...S.sec,...fadeStyle(0.3)}}>
// // //           <h2 style={S.secTitle}>🎯 Governance Dimension Overview</h2>
// // //           <div style={{display:"flex",flexWrap:"wrap",gap:18,justifyContent:"center"}}>
// // //             {pkeys.map(k=>(
// // //               <div key={k} style={{...S.radCard,cursor:"pointer"}} onClick={()=>setSel(k)}>
// // //                 <Radial score={prn[k].score} label={k} color={COLORS[k]||"#00C896"} size={78}/>
// // //                 <div style={{fontSize:18,marginTop:4}}>{ICONS[k]}</div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* DIAGNOSTICS */}
// // //       <section style={{...S.sec,...fadeStyle(0.35)}}>
// // //         <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
// // //         <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
// // //           {[
// // //             {icon:"❌",label:"Missing Ratio",val:`${(r.diagnostics.missing_ratio*100).toFixed(1)}%`,c:r.diagnostics.missing_ratio<0.1?"#00C896":"#ff4d4d"},
// // //             {icon:"🔁",label:"Duplicates",val:r.diagnostics.duplicates,c:r.diagnostics.duplicates===0?"#00C896":"#ffb020"},
// // //             {icon:"🧩",label:"Schema Confidence",val:`${Math.round(r.diagnostics.schema_confidence*100)}%`,c:"#60A5FA"},
// // //             {icon:"📐",label:"Total Columns",val:r.diagnostics.total_columns,c:"#A78BFA"},
// // //             {icon:"📝",label:"Text Columns",val:r.diagnostics.text_columns,c:"#00E5A0"},
// // //             {icon:"🔢",label:"Numeric Columns",val:r.diagnostics.numeric_columns,c:"#FBBF24"},
// // //           ].map((d,i)=>(
// // //             <div key={i} style={{...S.diagCard,borderColor:`${d.c}33`}}>
// // //               <span style={{fontSize:22}}>{d.icon}</span>
// // //               <div style={{fontSize:22,fontWeight:800,color:d.c,fontFamily:"'DM Sans',sans-serif"}}>{d.val}</div>
// // //               <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{d.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //         {r.diagnostics.column_names?.length>0&&(
// // //           <div style={{marginTop:18,padding:"14px",background:"rgba(0,0,0,0.2)",borderRadius:12}}>
// // //             <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:8}}>Detected columns:</div>
// // //             <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
// // //               {r.diagnostics.column_names.map((col,i)=>(
// // //                 <span key={i} style={{padding:"3px 10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:11,color:"rgba(255,255,255,0.55)"}}>{col}</span>
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* FINDINGS */}
// // //       <section style={{...S.sec,...fadeStyle(0.4)}}>
// // //         <h2 style={S.secTitle}>
// // //           ⚠️ Audit Findings
// // //           {(r.findings?.length||0)>0&&<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,background:"#ff4d4d22",border:"1px solid #ff4d4d55",color:"#ff4d4d",borderRadius:"50%",fontSize:12,fontWeight:700,marginLeft:10}}>{r.findings.length}</span>}
// // //         </h2>
// // //         {!r.findings?.length?(
// // //           <div style={{padding:20,background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,color:"#00C896",fontSize:14}}>
// // //             ✅ No critical findings. Dataset meets Trusted AI standards.
// // //           </div>
// // //         ):(
// // //           <div style={{display:"flex",flexDirection:"column",gap:12}}>
// // //             {r.findings.map((f,i)=>{
// // //               const sc=f.severity==="High"?"#ff4d4d":f.severity==="Medium"?"#ffb020":"#00C896";
// // //               return (
// // //                 <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${sc}33`,borderRadius:14,padding:20}}>
// // //                   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
// // //                     <span style={{fontSize:12,fontWeight:700,color:COLORS[f.category]||"#fff",textTransform:"uppercase",letterSpacing:"0.07em"}}>{ICONS[f.category]||"📌"} {f.category}</span>
// // //                     <span style={{padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,color:sc,background:`${sc}18`,border:`1px solid ${sc}44`}}>{f.severity}</span>
// // //                   </div>
// // //                   <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",marginBottom:6,lineHeight:1.5}}>{f.issue}</p>
// // //                   <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",lineHeight:1.5}}>💡 {f.recommendation}</p>
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* RECOMMENDATION */}
// // //       {r.recommendation&&(
// // //         <section style={{...S.sec,...fadeStyle(0.45)}}>
// // //           <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
// // //           <div style={{display:"flex",gap:14,padding:20,background:"rgba(255,176,32,0.05)",border:"1px solid rgba(255,176,32,0.2)",borderRadius:14,alignItems:"flex-start"}}>
// // //             <span style={{fontSize:22}}>💡</span>
// // //             <p style={{margin:0,fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.7}}>{r.recommendation}</p>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* FOOTER */}
// // //       <footer style={{textAlign:"center",padding:"40px 48px 20px",marginTop:40,borderTop:"1px solid rgba(255,255,255,0.06)",position:"relative",zIndex:1}}>
// // //         <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",marginBottom:14}}>
// // //           {["EU AI Act","ISO/IEC 42001:2023","NIST AI RMF","KPMG Trusted AI Framework"].map(f=>(
// // //             <span key={f} style={{padding:"4px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,fontSize:11,color:"rgba(255,255,255,0.4)"}}>{f}</span>
// // //           ))}
// // //         </div>
// // //         <div style={{color:"rgba(255,255,255,0.2)",fontSize:11}}>Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework</div>
// // //       </footer>

// // //       <style>{`
// // //         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
// // //         @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
// // //         *{box-sizing:border-box;margin:0;padding:0} body{background:#050d1a!important}
// // //       `}</style>
// // //     </div>
// // //   );
// // // }

// // // const S: Record<string,React.CSSProperties> = {
// // //   page:{minHeight:"100vh",background:"#050d1a",fontFamily:"'DM Sans',sans-serif",color:"white",paddingBottom:80,position:"relative",overflowX:"hidden"},
// // //   bg:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 80% 50% at 20% 10%,rgba(0,100,200,0.1) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(0,200,150,0.07) 0%,transparent 60%)"},
// // //   header:{position:"relative",zIndex:1,padding:"32px 48px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16},
// // //   logo:{fontSize:19,fontWeight:900,background:"linear-gradient(135deg,#00C8FF,#00C896)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
// // //   kBadge:{fontSize:11,padding:"3px 10px",background:"rgba(0,51,141,0.4)",border:"1px solid rgba(0,51,141,0.6)",borderRadius:20,color:"#60A5FA"},
// // //   title:{fontSize:30,fontWeight:900,color:"white",letterSpacing:"-0.02em"},
// // //   meta:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginTop:8,fontSize:13,color:"rgba(255,255,255,0.5)"},
// // //   dot:{color:"rgba(255,255,255,0.2)"},
// // //   backBtn:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.65)",padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600},
// // //   heroRow:{position:"relative",zIndex:1,display:"flex",gap:20,padding:"28px 48px",alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,0.05)"},
// // //   heroScore:{textAlign:"center",padding:"24px 32px",background:"rgba(255,255,255,0.03)",border:"2px solid",borderRadius:18,flexShrink:0},
// // //   riskPill:{display:"inline-block",padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,marginTop:10},
// // //   statsRow:{display:"flex",gap:12,flexWrap:"wrap",flex:1},
// // //   statCard:{flex:"1 1 105px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"14px",textAlign:"center",display:"flex",flexDirection:"column",gap:4},
// // //   sec:{position:"relative",zIndex:1,margin:"0 48px",marginTop:36,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"28px"},
// // //   secTitle:{fontSize:19,fontWeight:800,color:"white",marginBottom:5},
// // //   secSub:{fontSize:12,color:"rgba(255,255,255,0.38)",marginBottom:20},
// // //   fwCard:{flex:"1 1 170px",background:"rgba(255,255,255,0.03)",border:"1px solid",borderRadius:15,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:3},
// // //   fwPill:{marginTop:10,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700},
// // //   fwNote:{marginTop:18,padding:"12px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,display:"flex",alignItems:"flex-start"},
// // //   spiderWrap:{display:"flex",gap:28,flexWrap:"wrap",alignItems:"flex-start"},
// // //   drillPanel:{flex:"1 1 280px",minHeight:420,background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"22px",display:"flex",flexDirection:"column",alignItems:"center"},
// // //   pRow:{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},
// // //   backDrillBtn:{marginTop:18,background:"transparent",border:"1px solid",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600},
// // //   radCard:{display:"flex",flexDirection:"column",alignItems:"center",padding:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13},
// // //   diagCard:{flex:"1 1 115px",background:"rgba(255,255,255,0.03)",border:"1px solid",borderRadius:13,padding:"18px 14px",textAlign:"center",display:"flex",flexDirection:"column",gap:5,alignItems:"center"},
// // // };




// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import { useState, useEffect } from "react";
// // // import {
// // //   RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
// // //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
// // //   ResponsiveContainer, Cell,
// // // } from "recharts";

// // // interface Principle { score: number; parameters: Record<string, number>; }
// // // interface ReportData {
// // //   report_id: string; ai_name: string; model_type: string; evaluated_at: string;
// // //   overall_score: number; risk_level: string; structural_risk: string;
// // //   logs_evaluated: number; data_quality_score: number;
// // //   trusted_ai_principles: Record<string, Principle>;
// // //   diagnostics: { missing_ratio: number; duplicates: number; schema_confidence: number; total_columns: number; text_columns: number; numeric_columns: number; column_names: string[]; };
// // //   findings: { category: string; severity: string; issue: string; recommendation: string }[];
// // //   recommendation: string;
// // //   framework_compliance: Record<string, string>;
// // // }

// // // const ICONS: Record<string,string> = { Transparency:"🔍", Explainability:"💡", Fairness:"⚖️", Accountability:"📋", "Data Integrity":"🗄️", Reliability:"⚙️", Security:"🔒", Privacy:"🛡️", Sustainability:"🌱", "Human-Centricity":"👤" };
// // // const COLORS: Record<string,string> = { Transparency:"#00C8FF", Explainability:"#00E5A0", Fairness:"#FF6B9D", Accountability:"#FFB020", "Data Integrity":"#A78BFA", Reliability:"#34D399", Security:"#F87171", Privacy:"#60A5FA", Sustainability:"#4ADE80", "Human-Centricity":"#FBBF24" };
// // // const FW: Record<string,{label:string;icon:string;desc:string}> = {
// // //   EU_AI_Act:{label:"EU AI Act",icon:"🇪🇺",desc:"European Union AI Regulation"},
// // //   ISO_42001:{label:"ISO 42001",icon:"🏅",desc:"AI Management System Standard"},
// // //   NIST_AI_RMF:{label:"NIST AI RMF",icon:"🏛️",desc:"AI Risk Management Framework"},
// // //   KPMG_TAF:{label:"KPMG Trusted AI",icon:"🔷",desc:"Trusted AI Framework"},
// // // };
// // // const CC: Record<string,string> = { Compliant:"#00C896","Certified Ready":"#00C896",Aligned:"#00C896",Conditional:"#ffb020",Assessed:"#60A5FA",Partial:"#ff4d4d" };

// // // function fmt(k: string) {
// // //   return String(k ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
// // // }

// // // function Spider({ principles, onSelect, selected }: { principles: Record<string,Principle>; onSelect:(k:string|null)=>void; selected:string|null }) {
// // //   const keys = Object.keys(principles); const N = keys.length;
// // //   const cx=250,cy=250,R=175;
// // //   const ang=(i:number)=>(Math.PI*2*i)/N - Math.PI/2;
// // //   const pt=(i:number,v:number)=>({ x:cx+(v/100)*R*Math.cos(ang(i)), y:cy+(v/100)*R*Math.sin(ang(i)) });
// // //   const lp=(i:number)=>{ const r=R+38; return {x:cx+r*Math.cos(ang(i)),y:cy+r*Math.sin(ang(i))}; };
// // //   const poly = keys.map((k,i)=>pt(i,principles[k].score));
// // //   const polyStr = poly.map(p=>`${p.x},${p.y}`).join(" ");
// // //   return (
// // //     <svg viewBox="0 0 500 500" style={{width:"100%",maxWidth:500,display:"block",margin:"0 auto"}}>
// // //       {[20,40,60,80,100].map(lvl=>(
// // //         <polygon key={lvl} points={keys.map((_,i)=>pt(i,lvl)).map(p=>`${p.x},${p.y}`).join(" ")}
// // //           fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
// // //       ))}
// // //       {keys.map((_,i)=>{ const e=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>; })}
// // //       <polygon points={polyStr} fill="rgba(0,200,150,0.12)" stroke="rgba(0,200,150,0.55)" strokeWidth="2" strokeLinejoin="round"/>
// // //       {[20,40,60,80,100].map(lvl=>(
// // //         <text key={`t${lvl}`} x={cx+4} y={cy-(lvl/100)*R+4} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="start">{lvl}</text>
// // //       ))}
// // //       {poly.map((p,i)=>{ const k=keys[i]; const c=COLORS[k]||"#00C896"; const sel=selected===k;
// // //         return <circle key={i} cx={p.x} cy={p.y} r={sel?12:6} fill={c} stroke={sel?"#fff":"rgba(255,255,255,0.3)"} strokeWidth={sel?3:1.5}
// // //           style={{cursor:"pointer",transition:"all 0.25s",filter:sel?"drop-shadow(0 0 10px #00C896)":"none"}}
// // //           onClick={()=>onSelect(sel?null:k)} onMouseEnter={()=>onSelect(k)} onMouseLeave={()=>sel||onSelect(null)}/>;
// // //       })}
// // //       {keys.map((k,i)=>{ const lpos=lp(i); const c=COLORS[k]||"#00C896"; const sel=selected===k; const parts=k.split(" "); const sc=principles[k].score;
// // //         return (
// // //           <g key={k} style={{cursor:"pointer"}} onClick={()=>onSelect(sel?null:k)} onMouseEnter={()=>onSelect(k)} onMouseLeave={()=>sel||onSelect(null)}>
// // //             {parts.map((pt2,pi)=>(
// // //               <text key={pi} x={lpos.x} y={lpos.y+(pi-parts.length/2)*13} textAnchor="middle" fill={sel?c:"rgba(255,255,255,0.7)"}
// // //                 fontSize={sel?"12":"10"} fontWeight={sel?"800":"500"} fontFamily="'DM Sans',sans-serif" style={{transition:"all 0.25s"}}>
// // //                 {pt2}
// // //               </text>
// // //             ))}
// // //             <text x={lpos.x} y={lpos.y+(parts.length/2)*13+4} textAnchor="middle" fill={c} fontSize="11" fontWeight="800" fontFamily="'DM Sans',sans-serif">
// // //               {sc}
// // //             </text>
// // //           </g>
// // //         );
// // //       })}
// // //       <circle cx={cx} cy={cy} r={40} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
// // //       <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="'DM Sans',sans-serif">
// // //         {Math.round(Object.values(principles).reduce((s,v)=>s+v.score,0)/N)}
// // //       </text>
// // //       <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'DM Sans',sans-serif">OVERALL</text>
// // //     </svg>
// // //   );
// // // }

// // // function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
// // //   const [hovered, setHovered] = useState<string | null>(null);
// // //   const entries = Object.entries(principles).map(([name, data]) => ({
// // //     name,
// // //     score: data.score,
// // //     color: COLORS[name] || "#00C896",
// // //   }));

// // //   return (
// // //     <div style={{ overflowX: "auto", padding: "10px 0" }}>
// // //       <ResponsiveContainer width="100%" height={Math.max(entries.length * 60 + 50, 220)}>
// // //         <BarChart
// // //           data={entries}
// // //           layout="vertical"
// // //           margin={{ top: 10, right: 50, left: 140, bottom: 10 }}
// // //         >
// // //           <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" horizontal={false} />
// // //           <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.6)" }} />
// // //           <YAxis
// // //             type="category"
// // //             dataKey="name"
// // //             tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}
// // //             width={130}
// // //             axisLine={false}
// // //             tickLine={false}
// // //           />
// // //           <Tooltip
// // //             cursor={{ fill: "rgba(0,200,150,0.08)" }}
// // //             contentStyle={{
// // //               background: "rgba(10,30,66,0.95)",
// // //               border: "1px solid rgba(0,200,150,0.4)",
// // //               borderRadius: 10,
// // //               padding: "12px 16px",
// // //               color: "white",
// // //               boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
// // //             }}
// // //           />
// // //           <Bar
// // //             dataKey="score"
// // //             radius={[0, 8, 8, 0]}
// // //             barSize={28}
// // //             animationDuration={1400}
// // //             animationEasing="easeOutQuart"
// // //           >
// // //             {entries.map((entry, index) => (
// // //               <Cell
// // //                 key={`cell-${index}`}
// // //                 fill={`url(#gradient-${index})`}
// // //                 style={{
// // //                   transition: "all 0.3s ease",
// // //                   filter: hovered === entry.name ? "brightness(1.25) drop-shadow(0 0 12px currentColor)" : "none",
// // //                   transform: hovered === entry.name ? "scale(1.06)" : "scale(1)",
// // //                   transformOrigin: "left center",
// // //                 }}
// // //                 onMouseEnter={() => setHovered(entry.name)}
// // //                 onMouseLeave={() => setHovered(null)}
// // //               />
// // //             ))}
// // //           </Bar>
// // //           {/* Define gradients for each bar */}
// // //           <defs>
// // //             {entries.map((entry, i) => (
// // //               <linearGradient key={`gradient-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
// // //                 <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
// // //                 <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
// // //               </linearGradient>
// // //             ))}
// // //           </defs>
// // //         </BarChart>
// // //       </ResponsiveContainer>
// // //     </div>
// // //   );
// // // }

// // // function Radial({ score, label, color, size=90 }: { score:number; label:string; color:string; size?:number }) {
// // //   const r=size*0.38; const circ=2*Math.PI*r; const dash=(score/100)*circ;
// // //   return (
// // //     <div style={{textAlign:"center"}}>
// // //       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
// // //         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*0.08}/>
// // //         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
// // //           strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
// // //           transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1.2s ease"}}/>
// // //         <text x={size/2} y={size/2+4} textAnchor="middle" fill="white" fontSize={size*0.2} fontWeight="800" fontFamily="'DM Sans',sans-serif">{score}</text>
// // //       </svg>
// // //       <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
// // //     </div>
// // //   );
// // // }

// // // export default function Report() {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const r: ReportData = location.state?.data;
// // //   const [sel, setSel] = useState<string | null>(null);
// // //   const [anim, setAnim] = useState(false);
// // //   const [pdfLoading, setPdfLoading] = useState(false);

// // //   useEffect(() => {
// // //     setTimeout(() => setAnim(true), 100);
// // //   }, []);

// // //   if (!r) {
// // //     return (
// // //       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 16 }}>
// // //         <p style={{ color: "rgba(255,255,255,0.5)" }}>No report data found.</p>
// // //         <button style={S.backBtn} onClick={() => navigate("/dashboard")}>
// // //           ← Back to Dashboard
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //   const prn = r.trusted_ai_principles || {};
// // //   const pkeys = Object.keys(prn);
// // //   const hasPrn = pkeys.length > 0;
// // //   const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
// // //   const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// // //   const selData = sel ? prn[sel] : null;

// // //   const fadeStyle = (delay: number): React.CSSProperties => ({
// // //     opacity: anim ? 1 : 0,
// // //     transform: anim ? "none" : "translateY(16px)",
// // //     transition: `all 0.6s ease ${delay}s`,
// // //   });

// // //   const handleDownloadPDF = () => {
// // //     setPdfLoading(true);
// // //     // Placeholder — replace with real PDF generation (jsPDF, html2canvas, or backend call)
// // //     setTimeout(() => {
// // //       alert("Comprehensive PDF generation started!\n(In real app this would download the full report)");
// // //       setPdfLoading(false);
// // //     }, 1800);
// // //   };

// // //   const S: Record<string, React.CSSProperties> = {
// // //     page: { minHeight: "100vh", background: "#050d1a", fontFamily: "'DM Sans',sans-serif", color: "white", paddingBottom: 80, position: "relative", overflowX: "hidden" },
// // //     bg: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 20% 10%,rgba(0,100,200,0.1) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(0,200,150,0.07) 0%,transparent 60%)" },
// // //     header: { position: "relative", zIndex: 1, padding: "32px 48px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 },
// // //     logo: { fontSize: 19, fontWeight: 900, background: "linear-gradient(135deg,#00C8FF,#00C896)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
// // //     kBadge: { fontSize: 11, padding: "3px 10px", background: "rgba(0,51,141,0.4)", border: "1px solid rgba(0,51,141,0.6)", borderRadius: 20, color: "#60A5FA" },
// // //     title: { fontSize: 30, fontWeight: 900, color: "white", letterSpacing: "-0.02em" },
// // //     meta: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.5)" },
// // //     dot: { color: "rgba(255,255,255,0.2)" },
// // //     backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 },
// // //     heroRow: { position: "relative", zIndex: 1, display: "flex", gap: 20, padding: "28px 48px", alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)" },
// // //     heroScore: { textAlign: "center", padding: "24px 32px", background: "rgba(255,255,255,0.03)", border: "2px solid", borderRadius: 18, flexShrink: 0 },
// // //     riskPill: { display: "inline-block", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginTop: 10 },
// // //     statsRow: { display: "flex", gap: 12, flexWrap: "wrap", flex: 1 },
// // //     statCard: { flex: "1 1 105px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "14px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 },
// // //     sec: { position: "relative", zIndex: 1, margin: "0 48px", marginTop: 36, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "28px" },
// // //     secTitle: { fontSize: 19, fontWeight: 800, color: "white", marginBottom: 5 },
// // //     secSub: { fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 20 },
// // //     spiderWrap: { display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" },
// // //     drillPanel: { flex: "1 1 280px", minHeight: 420, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px", display: "flex", flexDirection: "column", alignItems: "center" },
// // //   };

// // //   return (
// // //     <div style={S.page}>
// // //       <div style={S.bg} />

// // //       {/* HEADER */}
// // //       <div style={{ ...S.header, ...fadeStyle(0) }}>
// // //         <div>
// // //           <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
// // //             <span style={S.logo}>Auditable AI™</span>
// // //             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
// // //           </div>
// // //           <h1 style={S.title}>Governance Audit Report</h1>
// // //           <div style={S.meta}>
// // //             <span>📌 {r.ai_name}</span><span style={S.dot}>·</span>
// // //             <span>🧠 {r.model_type}</span><span style={S.dot}>·</span>
// // //             <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}>·</span>
// // //             <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>ID: {r.report_id?.slice(0,12)}…</span>
// // //           </div>
// // //         </div>
// // //         <button style={S.backBtn} onClick={() => navigate("/dashboard")}>← Dashboard</button>
// // //       </div>

// // //       {/* HERO SCORE */}
// // //       <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
// // //         <div style={{ ...S.heroScore, borderColor: `${rc}44` }}>
// // //           <div style={{ fontSize: 68, fontWeight: 900, color: rc, lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>{r.overall_score}</div>
// // //           <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>/ 100</div>
// // //           <div style={{ ...S.riskPill, background: `${rc}20`, border: `1px solid ${rc}55`, color: rc }}>{r.risk_level} Risk</div>
// // //         </div>
// // //         <div style={S.statsRow}>
// // //           {[
// // //             { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
// // //             { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
// // //             { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
// // //             { icon: "✅", label: "Principles Tested", val: pkeys.length },
// // //             { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
// // //           ].map((s, i) => (
// // //             <div key={i} style={S.statCard}>
// // //               <span style={{ fontSize: 22 }}>{s.icon}</span>
// // //               <div style={{ fontSize: 22, fontWeight: 800, color: "white", fontFamily: "'DM Sans',sans-serif" }}>{s.val}</div>
// // //               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>

// // //       {/* FRAMEWORK COMPLIANCE */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
// // //         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
// // //         <p style={S.secSub}>Assessment conducted against the following international AI governance frameworks.</p>
// // //         <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
// // //           {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
// // //             const fw = FW[key] || { label: key, icon: "📋", desc: "" };
// // //             const sc = CC[status] || "#aaa";
// // //             return (
// // //               <div key={key} style={{ ...S.fwCard, borderColor: `${sc}44` }}>
// // //                 <div style={{ fontSize: 30 }}>{fw.icon}</div>
// // //                 <div style={{ fontWeight: 700, fontSize: 14, color: "white", marginTop: 6 }}>{fw.label}</div>
// // //                 <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, textAlign: "center" }}>{fw.desc}</div>
// // //                 <div style={{ ...S.fwPill, background: `${sc}20`, border: `1px solid ${sc}55`, color: sc }}>{status}</div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //         <div style={S.fwNote}>
// // //           <span style={{ opacity: 0.4 }}>ℹ️</span>
// // //           <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginLeft: 8 }}>
// // //             <b style={{ color: "rgba(255,255,255,0.6)" }}>EU AI Act</b> alignment reflects Title III transparency & accountability requirements. 
// // //             <b style={{ color: "rgba(255,255,255,0.6)" }}>ISO/IEC 42001:2023</b> readiness reflects AI management system controls coverage. 
// // //             <b style={{ color: "rgba(255,255,255,0.6)" }}>NIST AI RMF</b> alignment reflects GOVERN, MAP, MEASURE, MANAGE function coverage. 
// // //             <b style={{ color: "rgba(255,255,255,0.6)" }}>KPMG Trusted AI Framework</b> scoring drives all compliance determinations.
// // //           </span>
// // //         </div>
// // //       </section>

// // //       {/* IMPROVED SPIDER CHART */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.2) }}>
// // //           <h2 style={S.secTitle}>🕸️ KPMG Trusted AI — 10 Principles Assessment</h2>
// // //           <p style={S.secSub}>Hover or click any principle node/label to see details.</p>
// // //           <div style={S.spiderWrap}>
// // //             <div style={{ flex: "0 0 auto", width: "min(100%, 500px)" }}>
// // //               <Spider principles={prn} onSelect={setSel} selected={sel} />
// // //               <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
// // //                 Hover or click a node to inspect sub-parameters →
// // //               </p>
// // //             </div>
// // //             <div style={S.drillPanel}>
// // //               {!sel ? (
// // //                 <div style={{ width: "100%" }}>
// // //                   <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", marginBottom: 20 }}>
// // //                     Select a principle to view breakdown
// // //                   </div>
// // //                   {pkeys.map(k => {
// // //                     const c = COLORS[k] || "#00C896";
// // //                     const sc = prn[k].score;
// // //                     return (
// // //                       <div key={k} style={S.pRow} onClick={() => setSel(k)}>
// // //                         <span style={{ fontSize: 16 }}>{ICONS[k]}</span>
// // //                         <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{k}</span>
// // //                         <div style={{ width: 80, height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
// // //                           <div style={{ width: `${sc}%`, height: "100%", background: c, borderRadius: 3 }} />
// // //                         </div>
// // //                         <span style={{ fontSize: 13, fontWeight: 700, color: c, minWidth: 28, textAlign: "right" }}>{sc}</span>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               ) : selData ? (
// // //                 <div style={{ width: "100%", animation: "fadeIn 0.3s ease" }}>
// // //                   <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
// // //                     <span style={{ fontSize: 26 }}>{ICONS[sel]}</span>
// // //                     <div>
// // //                       <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{sel}</div>
// // //                       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Sub-parameter breakdown</div>
// // //                     </div>
// // //                     <div style={{ marginLeft: "auto", fontSize: 34, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>{selData.score}</div>
// // //                   </div>
// // //                   <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
// // //                     <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={100} />
// // //                   </div>
// // //                   {Object.entries(selData.parameters).map(([param, val]) => {
// // //                     const v = val as number;
// // //                     const c = COLORS[sel] || "#00C896";
// // //                     const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
// // //                     const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
// // //                     return (
// // //                       <div key={param} style={{ marginBottom: 14 }}>
// // //                         <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
// // //                           <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", flex: 1 }}>{param}</span>
// // //                           <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700, color: sc2, background: `${sc2}18`, border: `1px solid ${sc2}44` }}>
// // //                             {sl}
// // //                           </span>
// // //                           <span style={{ fontSize: 13, fontWeight: 700, color: c, minWidth: 28, textAlign: "right" }}>{v}</span>
// // //                         </div>
// // //                         <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
// // //                           <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg,${c}88,${c})`, borderRadius: 3, transition: "width 1s ease" }} />
// // //                         </div>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                   <button
// // //                     style={{ ...S.backDrillBtn, borderColor: `${COLORS[sel] || "#00C896"}44`, color: COLORS[sel] || "#00C896" }}
// // //                     onClick={() => setSel(null)}
// // //                   >
// // //                     ← Back to Overview
// // //                   </button>
// // //                 </div>
// // //               ) : null}
// // //             </div>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* IMPROVED BAR CHART */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
// // //           <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
// // //           <p style={S.secSub}>Hover over bars to highlight scores.</p>
// // //           <ImprovedBarChart principles={prn} />
// // //         </section>
// // //       )}

// // //       {/* RADIAL GRID */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.3) }}>
// // //           <h2 style={S.secTitle}>🎯 Governance Dimension Overview</h2>
// // //           <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
// // //             {pkeys.map(k => (
// // //               <div key={k} style={{ ...S.radCard, cursor: "pointer" }} onClick={() => setSel(k)}>
// // //                 <Radial score={prn[k].score} label={k} color={COLORS[k] || "#00C896"} size={78} />
// // //                 <div style={{ fontSize: 18, marginTop: 4 }}>{ICONS[k]}</div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* DIAGNOSTICS */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
// // //         <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
// // //         <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
// // //           {[
// // //             { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
// // //             { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
// // //             { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
// // //             { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
// // //             { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
// // //             { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
// // //           ].map((d, i) => (
// // //             <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}33` }}>
// // //               <span style={{ fontSize: 22 }}>{d.icon}</span>
// // //               <div style={{ fontSize: 22, fontWeight: 800, color: d.c, fontFamily: "'DM Sans',sans-serif" }}>{d.val}</div>
// // //               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{d.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //         {r.diagnostics.column_names?.length > 0 && (
// // //           <div style={{ marginTop: 18, padding: "14px", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
// // //             <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Detected columns:</div>
// // //             <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
// // //               {r.diagnostics.column_names.map((col, i) => (
// // //                 <span key={i} style={{ padding: "3px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
// // //                   {col}
// // //                 </span>
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* FINDINGS */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
// // //         <h2 style={S.secTitle}>
// // //           ⚠️ Audit Findings
// // //           {(r.findings?.length || 0) > 0 && (
// // //             <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#ff4d4d22", border: "1px solid #ff4d4d55", color: "#ff4d4d", borderRadius: "50%", fontSize: 12, fontWeight: 700, marginLeft: 10 }}>
// // //               {r.findings.length}
// // //             </span>
// // //           )}
// // //         </h2>
// // //         {!r.findings?.length ? (
// // //           <div style={{ padding: 20, background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 12, color: "#00C896", fontSize: 14 }}>
// // //             ✅ No critical findings. Dataset meets Trusted AI standards.
// // //           </div>
// // //         ) : (
// // //           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
// // //             {r.findings.map((f, i) => {
// // //               const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
// // //               return (
// // //                 <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${sc}33`, borderRadius: 14, padding: 20 }}>
// // //                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
// // //                     <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[f.category] || "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
// // //                       {ICONS[f.category] || "📌"} {f.category}
// // //                     </span>
// // //                     <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: sc, background: `${sc}18`, border: `1px solid ${sc}44` }}>
// // //                       {f.severity}
// // //                     </span>
// // //                   </div>
// // //                   <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 6, lineHeight: 1.5 }}>{f.issue}</p>
// // //                   <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.5 }}>💡 {f.recommendation}</p>
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* RECOMMENDATION */}
// // //       {r.recommendation && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
// // //           <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
// // //           <div style={{ display: "flex", gap: 14, padding: 20, background: "rgba(255,176,32,0.05)", border: "1px solid rgba(255,176,32,0.2)", borderRadius: 14, alignItems: "flex-start" }}>
// // //             <span style={{ fontSize: 22 }}>💡</span>
// // //             <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{r.recommendation}</p>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* NEW: Comprehensive Report Request */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center", padding: "40px 20px" }}>
// // //         <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: "#EAF2FB" }}>
// // //           Do you need a comprehensive report?
// // //         </h2>
// // //         <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, maxWidth: 700, marginLeft: "auto", marginRight: "auto", fontSize: 15, lineHeight: 1.6 }}>
// // //           Get a detailed PDF version including executive summary, full findings with evidence, appendices, compliance mapping, and actionable roadmap.
// // //         </p>

// // //         <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
// // //           <button
// // //             style={{
// // //               padding: "14px 40px",
// // //               fontSize: 16,
// // //               fontWeight: 700,
// // //               borderRadius: 12,
// // //               border: "none",
// // //               background: "linear-gradient(135deg, #00C896, #0091DA)",
// // //               color: "white",
// // //               cursor: "pointer",
// // //               transition: "all 0.3s ease",
// // //               boxShadow: "0 8px 24px rgba(0,200,150,0.25)",
// // //             }}
// // //             onMouseEnter={e => {
// // //               e.currentTarget.style.transform = "translateY(-4px)";
// // //               e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,200,150,0.4)";
// // //             }}
// // //             onMouseLeave={e => {
// // //               e.currentTarget.style.transform = "translateY(0)";
// // //               e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,200,150,0.25)";
// // //             }}
// // //             onClick={handleDownloadPDF}
// // //             disabled={pdfLoading}
// // //           >
// // //             {pdfLoading ? "Generating PDF..." : "Yes – Download Full PDF Report"}
// // //           </button>

// // //           <button
// // //             style={{
// // //               padding: "14px 40px",
// // //               fontSize: 16,
// // //               fontWeight: 600,
// // //               borderRadius: 12,
// // //               border: "1px solid rgba(255,255,255,0.25)",
// // //               background: "transparent",
// // //               color: "rgba(255,255,255,0.85)",
// // //               cursor: "pointer",
// // //               transition: "all 0.3s ease",
// // //             }}
// // //             onMouseEnter={e => {
// // //               e.currentTarget.style.background = "rgba(255,255,255,0.08)";
// // //               e.currentTarget.style.transform = "translateY(-3px)";
// // //             }}
// // //             onMouseLeave={e => {
// // //               e.currentTarget.style.background = "transparent";
// // //               e.currentTarget.style.transform = "translateY(0)";
// // //             }}
// // //             onClick={() => navigate("/dashboard")}
// // //           >
// // //             No thanks – Back to Dashboard
// // //           </button>
// // //         </div>
// // //       </section>

// // //       {/* FOOTER */}
// // //       <footer style={{ textAlign: "center", padding: "40px 48px 40px", marginTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
// // //         <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
// // //           {["EU AI Act", "ISO/IEC 42001:2023", "NIST AI RMF", "KPMG Trusted AI Framework"].map(f => (
// // //             <span key={f} style={{ padding: "4px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
// // //               {f}
// // //             </span>
// // //           ))}
// // //         </div>
// // //         <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
// // //           Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
// // //         </div>
// // //       </footer>

// // //       <style>{`
// // //         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
// // //         @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
// // //         *{box-sizing:border-box;margin:0;padding:0} body{background:#050d1a!important}
// // //       `}</style>
// // //     </div>
// // //   );
// // // }


// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import { useState, useEffect } from "react";
// // // import {
// // //   RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
// // //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
// // //   ResponsiveContainer, Cell,
// // // } from "recharts";

// // // interface Principle { score: number; parameters: Record<string, number>; }
// // // interface ReportData {
// // //   report_id: string;
// // //   ai_name: string;
// // //   model_type: string;
// // //   evaluated_at: string;
// // //   overall_score: number;
// // //   risk_level: string;
// // //   structural_risk: string;
// // //   logs_evaluated: number;
// // //   data_quality_score: number;
// // //   trusted_ai_principles: Record<string, Principle>;
// // //   diagnostics: {
// // //     missing_ratio: number;
// // //     duplicates: number;
// // //     schema_confidence: number;
// // //     total_columns: number;
// // //     text_columns: number;
// // //     numeric_columns: number;
// // //     column_names: string[];
// // //   };
// // //   findings: { category: string; severity: string; issue: string; recommendation: string }[];
// // //   recommendation: string;
// // //   framework_compliance: Record<string, string>;
// // // }

// // // const ICONS: Record<string, string> = {
// // //   Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
// // //   "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
// // //   Sustainability: "🌱", "Human-Centricity": "👤"
// // // };

// // // const COLORS: Record<string, string> = {
// // //   Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
// // //   Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
// // //   Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
// // //   "Human-Centricity": "#FBBF24"
// // // };

// // // const FW: Record<string, { label: string; icon: string; desc: string }> = {
// // //   EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
// // //   ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
// // //   NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
// // //   KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
// // // };

// // // const CC: Record<string, string> = {
// // //   Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
// // //   Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
// // // };

// // // function fmt(k: string) {
// // //   return String(k ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
// // // }

// // // function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
// // //   const keys = Object.keys(principles);
// // //   const N = keys.length;
// // //   const cx = 280, cy = 280, R = 200;

// // //   const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
// // //   const pt = (i: number, v: number) => ({
// // //     x: cx + (v / 100) * R * Math.cos(ang(i)),
// // //     y: cy + (v / 100) * R * Math.sin(ang(i)),
// // //   });
// // //   const lp = (i: number) => {
// // //     const r = R + 50;
// // //     return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) };
// // //   };

// // //   const poly = keys.map((k, i) => pt(i, principles[k].score));
// // //   const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");

// // //   return (
// // //     <svg viewBox="0 0 600 600" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
// // //       {[20, 40, 60, 80, 100].map(lvl => (
// // //         <polygon
// // //           key={lvl}
// // //           points={keys.map((_, i) => pt(i, lvl)).map(p => `${p.x},${p.y}`).join(" ")}
// // //           fill="none"
// // //           stroke="rgba(255,255,255,0.08)"
// // //           strokeWidth="1.5"
// // //         />
// // //       ))}
// // //       {keys.map((_, i) => {
// // //         const e = pt(i, 100);
// // //         return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
// // //       })}
// // //       <polygon points={polyStr} fill="rgba(0,200,150,0.15)" stroke="rgba(0,200,150,0.65)" strokeWidth="3" strokeLinejoin="round" />
// // //       {[20, 40, 60, 80, 100].map(lvl => (
// // //         <text key={`t${lvl}`} x={cx + 8} y={cy - (lvl / 100) * R + 5} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="start">{lvl}</text>
// // //       ))}
// // //       {poly.map((p, i) => {
// // //         const k = keys[i];
// // //         const c = COLORS[k] || "#00C896";
// // //         const sel = selected === k;
// // //         return (
// // //           <circle
// // //             key={i}
// // //             cx={p.x}
// // //             cy={p.y}
// // //             r={sel ? 14 : 7}
// // //             fill={c}
// // //             stroke={sel ? "#fff" : "rgba(255,255,255,0.4)"}
// // //             strokeWidth={sel ? 4 : 2}
// // //             style={{
// // //               cursor: "pointer",
// // //               transition: "all 0.3s ease",
// // //               filter: sel ? "drop-shadow(0 0 12px #00C896)" : "drop-shadow(0 0 4px rgba(0,200,150,0.3))",
// // //             }}
// // //             onClick={() => onSelect(sel ? null : k)}
// // //             onMouseEnter={() => onSelect(k)}
// // //             onMouseLeave={() => sel || onSelect(null)}
// // //           />
// // //         );
// // //       })}
// // //       {keys.map((k, i) => {
// // //         const lpos = lp(i);
// // //         const c = COLORS[k] || "#00C896";
// // //         const sel = selected === k;
// // //         const parts = k.split(" ");
// // //         const sc = principles[k].score;
// // //         return (
// // //           <g
// // //             key={k}
// // //             style={{ cursor: "pointer" }}
// // //             onClick={() => onSelect(sel ? null : k)}
// // //             onMouseEnter={() => onSelect(k)}
// // //             onMouseLeave={() => sel || onSelect(null)}
// // //           >
// // //             {parts.map((pt2, pi) => (
// // //               <text
// // //                 key={pi}
// // //                 x={lpos.x}
// // //                 y={lpos.y + (pi - parts.length / 2) * 16}
// // //                 textAnchor="middle"
// // //                 fill={sel ? c : "rgba(255,255,255,0.8)"}
// // //                 fontSize={sel ? "13" : "11"}
// // //                 fontWeight={sel ? "800" : "500"}
// // //                 fontFamily="'DM Sans',sans-serif"
// // //                 style={{ transition: "all 0.3s ease" }}
// // //               >
// // //                 {pt2}
// // //               </text>
// // //             ))}
// // //             <text
// // //               x={lpos.x}
// // //               y={lpos.y + (parts.length / 2) * 16 + 6}
// // //               textAnchor="middle"
// // //               fill={c}
// // //               fontSize="12"
// // //               fontWeight="900"
// // //               fontFamily="'DM Sans',sans-serif"
// // //             >
// // //               {sc}
// // //             </text>
// // //           </g>
// // //         );
// // //       })}
// // //       <circle cx={cx} cy={cy} r={50} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
// // //       <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="'DM Sans',sans-serif">
// // //         {Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N)}
// // //       </text>
// // //       <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="'DM Sans',sans-serif">
// // //         OVERALL
// // //       </text>
// // //     </svg>
// // //   );
// // // }

// // // function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
// // //   const [hovered, setHovered] = useState<string | null>(null);
// // //   const entries = Object.entries(principles).map(([name, data]) => ({
// // //     name,
// // //     score: data.score,
// // //     color: COLORS[name] || "#00C896",
// // //   }));

// // //   return (
// // //     <div style={{ padding: "20px 0", overflowX: "auto" }}>
// // //       <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
// // //         <BarChart
// // //           data={entries}
// // //           layout="vertical"
// // //           margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
// // //         >
// // //           <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
// // //           <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
// // //           <YAxis
// // //             type="category"
// // //             dataKey="name"
// // //             tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
// // //             width={150}
// // //             axisLine={false}
// // //             tickLine={false}
// // //           />
// // //           <Tooltip
// // //             cursor={{ fill: "rgba(0,200,150,0.1)" }}
// // //             contentStyle={{
// // //               background: "rgba(10,30,66,0.96)",
// // //               border: "1px solid rgba(0,200,150,0.45)",
// // //               borderRadius: 12,
// // //               padding: "14px 18px",
// // //               color: "white",
// // //               boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
// // //             }}
// // //           />
// // //           <Bar
// // //             dataKey="score"
// // //             radius={[0, 10, 10, 0]}
// // //             barSize={28}
// // //             animationDuration={1600}
// // //             animationEasing="easeOutCubic"
// // //           >
// // //             {entries.map((entry, index) => (
// // //               <Cell
// // //                 key={`cell-${index}`}
// // //                 fill={`url(#grad-${index})`}
// // //                 style={{
// // //                   transition: "all 0.35s ease",
// // //                   filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
// // //                   transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
// // //                   transformOrigin: "left center",
// // //                 }}
// // //                 onMouseEnter={() => setHovered(entry.name)}
// // //                 onMouseLeave={() => setHovered(null)}
// // //               />
// // //             ))}
// // //           </Bar>
// // //           <defs>
// // //             {entries.map((entry, i) => (
// // //               <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
// // //                 <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
// // //                 <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
// // //               </linearGradient>
// // //             ))}
// // //           </defs>
// // //         </BarChart>
// // //       </ResponsiveContainer>
// // //     </div>
// // //   );
// // // }

// // // function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
// // //   const r = size * 0.38;
// // //   const circ = 2 * Math.PI * r;
// // //   const dash = (score / 100) * circ;
// // //   return (
// // //     <div style={{ textAlign: "center", padding: "10px" }}>
// // //       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
// // //         <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
// // //         <circle
// // //           cx={size / 2}
// // //           cy={size / 2}
// // //           r={r}
// // //           fill="none"
// // //           stroke={color}
// // //           strokeWidth={size * 0.09}
// // //           strokeDasharray={`${dash} ${circ}`}
// // //           strokeLinecap="round"
// // //           transform={`rotate(-90 ${size / 2} ${size / 2})`}
// // //           style={{ transition: "stroke-dasharray 1.4s ease" }}
// // //         />
// // //         <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
// // //           {score}
// // //         </text>
// // //       </svg>
// // //       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
// // //     </div>
// // //   );
// // // }

// // // export default function Report() {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const r: ReportData = location.state?.data;
// // //   const [sel, setSel] = useState<string | null>(null);
// // //   const [anim, setAnim] = useState(false);
// // //   const [pdfLoading, setPdfLoading] = useState(false);

// // //   useEffect(() => {
// // //     setTimeout(() => setAnim(true), 150);
// // //   }, []);

// // //   if (!r) {
// // //     return (
// // //       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
// // //         <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
// // //         <button
// // //           style={{
// // //             padding: "14px 32px",
// // //             background: "rgba(255,255,255,0.08)",
// // //             border: "1px solid rgba(255,255,255,0.15)",
// // //             color: "white",
// // //             borderRadius: 12,
// // //             cursor: "pointer",
// // //             fontSize: 15,
// // //             fontWeight: 600,
// // //           }}
// // //           onClick={() => navigate("/dashboard")}
// // //         >
// // //           ← Back to Dashboard
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //   const prn = r.trusted_ai_principles || {};
// // //   const pkeys = Object.keys(prn);
// // //   const hasPrn = pkeys.length > 0;
// // //   const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
// // //   const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// // //   const selData = sel ? prn[sel] : null;

// // //   const fadeStyle = (delay: number): React.CSSProperties => ({
// // //     opacity: anim ? 1 : 0,
// // //     transform: anim ? "translateY(0)" : "translateY(24px)",
// // //     transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
// // //   });

// // //   const handleDownloadPDF = () => {
// // //     setPdfLoading(true);
// // //     setTimeout(() => {
// // //       alert("PDF generation started! (Connect jsPDF or backend here in production)");
// // //       setPdfLoading(false);
// // //     }, 2000);
// // //   };

// // //   const S: Record<string, React.CSSProperties> = {
// // //     page: {
// // //       minHeight: "100vh",
// // //       background: "#050d1a",
// // //       fontFamily: "'DM Sans',sans-serif",
// // //       color: "white",
// // //       padding: "40px 20px 100px",
// // //       position: "relative",
// // //       overflowX: "hidden",
// // //     },
// // //     bg: {
// // //       position: "fixed",
// // //       inset: 0,
// // //       zIndex: 0,
// // //       pointerEvents: "none",
// // //       background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,100,200,0.12) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,200,150,0.09) 0%, transparent 65%)",
// // //     },
// // //     header: {
// // //       position: "relative",
// // //       zIndex: 1,
// // //       padding: "32px 40px 24px",
// // //       borderBottom: "1px solid rgba(255,255,255,0.08)",
// // //       display: "flex",
// // //       justifyContent: "space-between",
// // //       alignItems: "flex-start",
// // //       flexWrap: "wrap",
// // //       gap: 20,
// // //     },
// // //     logo: {
// // //       fontSize: 20,
// // //       fontWeight: 900,
// // //       background: "linear-gradient(135deg, #00C8FF, #00C896)",
// // //       WebkitBackgroundClip: "text",
// // //       WebkitTextFillColor: "transparent",
// // //     },
// // //     kBadge: {
// // //       fontSize: 11,
// // //       padding: "3px 12px",
// // //       background: "rgba(0,51,141,0.45)",
// // //       border: "1px solid rgba(0,51,141,0.65)",
// // //       borderRadius: 20,
// // //       color: "#60A5FA",
// // //     },
// // //     title: {
// // //       fontSize: 32,
// // //       fontWeight: 900,
// // //       color: "white",
// // //       letterSpacing: "-0.02em",
// // //       margin: "6px 0 10px",
// // //     },
// // //     meta: {
// // //       display: "flex",
// // //       gap: 10,
// // //       flexWrap: "wrap",
// // //       alignItems: "center",
// // //       fontSize: 13,
// // //       color: "rgba(255,255,255,0.55)",
// // //     },
// // //     dot: { color: "rgba(255,255,255,0.25)" },
// // //     backBtn: {
// // //       background: "rgba(255,255,255,0.06)",
// // //       border: "1px solid rgba(255,255,255,0.12)",
// // //       color: "rgba(255,255,255,0.75)",
// // //       padding: "10px 24px",
// // //       borderRadius: 10,
// // //       cursor: "pointer",
// // //       fontSize: 14,
// // //       fontWeight: 600,
// // //       transition: "all 0.3s",
// // //     },
// // //     heroRow: {
// // //       position: "relative",
// // //       zIndex: 1,
// // //       display: "flex",
// // //       gap: 24,
// // //       padding: "32px 40px",
// // //       alignItems: "stretch",
// // //       flexWrap: "wrap",
// // //       borderBottom: "1px solid rgba(255,255,255,0.06)",
// // //     },
// // //     heroScore: {
// // //       textAlign: "center",
// // //       padding: "32px 40px",
// // //       background: "rgba(255,255,255,0.04)",
// // //       border: "2px solid",
// // //       borderRadius: 20,
// // //       minWidth: 200,
// // //       flexShrink: 0,
// // //       boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
// // //     },
// // //     riskPill: {
// // //       display: "inline-block",
// // //       padding: "5px 16px",
// // //       borderRadius: 20,
// // //       fontSize: 13,
// // //       fontWeight: 700,
// // //       marginTop: 12,
// // //     },
// // //     statsRow: {
// // //       display: "flex",
// // //       gap: 12,
// // //       flexWrap: "wrap",
// // //       flex: 1,
// // //     },
// // //     statCard: {
// // //       flex: "1 1 130px",
// // //       background: "rgba(255,255,255,0.04)",
// // //       border: "1px solid rgba(255,255,255,0.09)",
// // //       borderRadius: 14,
// // //       padding: "16px",
// // //       textAlign: "center",
// // //       display: "flex",
// // //       flexDirection: "column",
// // //       gap: 6,
// // //       boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
// // //     },
// // //     sec: {
// // //       position: "relative",
// // //       zIndex: 1,
// // //       margin: "32px 40px",
// // //       background: "rgba(255,255,255,0.03)",
// // //       border: "1px solid rgba(255,255,255,0.08)",
// // //       borderRadius: 18,
// // //       padding: "32px",
// // //       boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
// // //     },
// // //     secTitle: {
// // //       fontSize: 22,
// // //       fontWeight: 800,
// // //       color: "white",
// // //       marginBottom: 10,
// // //     },
// // //     secSub: {
// // //       fontSize: 13,
// // //       color: "rgba(255,255,255,0.45)",
// // //       marginBottom: 24,
// // //       lineHeight: 1.5,
// // //     },
// // //     spiderWrap: {
// // //       display: "flex",
// // //       gap: 32,
// // //       flexWrap: "wrap",
// // //       alignItems: "flex-start",
// // //       justifyContent: "center",
// // //     },
// // //     drillPanel: {
// // //       flex: "1 1 320px",
// // //       minHeight: 420,
// // //       background: "rgba(0,0,0,0.22)",
// // //       border: "1px solid rgba(255,255,255,0.08)",
// // //       borderRadius: 14,
// // //       padding: "24px",
// // //       display: "flex",
// // //       flexDirection: "column",
// // //       alignItems: "center",
// // //     },
// // //   };

// // //   return (
// // //     <div style={S.page}>
// // //       <div style={S.bg} />

// // //       {/* HEADER */}
// // //       <div style={{ ...S.header, ...fadeStyle(0) }}>
// // //         <div>
// // //           <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
// // //             <span style={S.logo}>Auditable AI™</span>
// // //             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
// // //           </div>
// // //           <h1 style={S.title}>Governance Audit Report</h1>
// // //           <div style={S.meta}>
// // //             <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
// // //             <span>🧠 {r.model_type}</span><span style={S.dot}> · </span>
// // //             <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
// // //             <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
// // //               ID: {r.report_id?.slice(0, 12)}…
// // //             </span>
// // //           </div>
// // //         </div>
// // //         <button
// // //           style={S.backBtn}
// // //           onClick={() => navigate("/dashboard")}
// // //         >
// // //           ← Dashboard
// // //         </button>
// // //       </div>

// // //       {/* HERO SCORE */}
// // //       <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
// // //         <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
// // //           <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
// // //             {r.overall_score}
// // //           </div>
// // //           <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
// // //           <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
// // //             {r.risk_level} Risk
// // //           </div>
// // //         </div>

// // //         <div style={S.statsRow}>
// // //           {[
// // //             { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
// // //             { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
// // //             { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
// // //             { icon: "✅", label: "Principles Tested", val: pkeys.length },
// // //             { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
// // //           ].map((s, i) => (
// // //             <div key={i} style={S.statCard}>
// // //               <span style={{ fontSize: 26 }}>{s.icon}</span>
// // //               <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
// // //               <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>

// // //       {/* FRAMEWORK COMPLIANCE */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
// // //         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
// // //         <p style={S.secSub}>Assessment against major AI governance standards.</p>
// // //         <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
// // //           {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
// // //             const fw = FW[key] || { label: key, icon: "📋", desc: "" };
// // //             const sc = CC[status] || "#aaa";
// // //             return (
// // //               <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
// // //                 <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
// // //                 <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
// // //                 <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
// // //                 <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
// // //                   {status}
// // //                 </div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //         <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
// // //           <span style={{ opacity: 0.5 }}>ℹ️</span>
// // //           <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
// // //             EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
// // //           </span>
// // //         </div>
// // //       </section>

// // //       {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
// // //           <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
// // //           <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

// // //           <div style={{
// // //             display: "flex",
// // //             gap: 32,
// // //             flexWrap: "wrap",
// // //             alignItems: "flex-start",
// // //             justifyContent: "center",
// // //           }}>
// // //             {/* Left: Spider Chart */}
// // //             <div style={{ flex: "1 1 500px", minWidth: 320 }}>
// // //               <Spider principles={prn} onSelect={setSel} selected={sel} />
// // //             </div>

// // //             {/* Right: Drill-down / List */}
// // //             <div style={{
// // //               flex: "1 1 360px",
// // //               minWidth: 320,
// // //               background: "rgba(0,0,0,0.22)",
// // //               border: "1px solid rgba(255,255,255,0.08)",
// // //               borderRadius: 14,
// // //               padding: "28px",
// // //               minHeight: 460,
// // //             }}>
// // //               {!sel ? (
// // //                 <div>
// // //                   <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 20 }}>
// // //                     Select a principle to view breakdown
// // //                   </div>
// // //                   {pkeys.map(k => {
// // //                     const c = COLORS[k] || "#00C896";
// // //                     const sc = prn[k].score;
// // //                     return (
// // //                       <div
// // //                         key={k}
// // //                         style={{
// // //                           display: "flex",
// // //                           alignItems: "center",
// // //                           gap: 12,
// // //                           padding: "10px 0",
// // //                           borderBottom: "1px solid rgba(255,255,255,0.06)",
// // //                           cursor: "pointer",
// // //                           transition: "all 0.2s",
// // //                         }}
// // //                         onClick={() => setSel(k)}
// // //                       >
// // //                         <span style={{ fontSize: 18 }}>{ICONS[k]}</span>
// // //                         <span style={{ flex: 1, fontSize: 14 }}>{k}</span>
// // //                         <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
// // //                           <div style={{ width: `${sc}%`, height: "100%", background: c, borderRadius: 3 }} />
// // //                         </div>
// // //                         <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{sc}</span>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               ) : selData ? (
// // //                 <div>
// // //                   <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
// // //                     <span style={{ fontSize: 28 }}>{ICONS[sel]}</span>
// // //                     <div style={{ flex: 1 }}>
// // //                       <div style={{ fontSize: 18, fontWeight: 700 }}>{sel}</div>
// // //                       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sub-parameters</div>
// // //                     </div>
// // //                     <div style={{ fontSize: 32, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>
// // //                       {selData.score}
// // //                     </div>
// // //                   </div>

// // //                   <div style={{ margin: "24px 0", textAlign: "center" }}>
// // //                     <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={110} />
// // //                   </div>

// // //                   {Object.entries(selData.parameters).map(([param, val]) => {
// // //                     const v = val as number;
// // //                     const c = COLORS[sel] || "#00C896";
// // //                     const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
// // //                     const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
// // //                     return (
// // //                       <div key={param} style={{ marginBottom: 16 }}>
// // //                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
// // //                           <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{param}</span>
// // //                           <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, color: sc2, background: `${sc2}15`, border: `1px solid ${sc2}40` }}>
// // //                             {sl}
// // //                           </span>
// // //                         </div>
// // //                         <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
// // //                           <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 4 }} />
// // //                         </div>
// // //                         <div style={{ textAlign: "right", fontSize: 12, color: c, marginTop: 4 }}>{v}</div>
// // //                       </div>
// // //                     );
// // //                   })}

// // //                   <button
// // //                     style={{
// // //                       marginTop: 24,
// // //                       width: "100%",
// // //                       padding: "10px",
// // //                       background: "transparent",
// // //                       border: `1px solid ${COLORS[sel] || "#00C896"}50`,
// // //                       color: COLORS[sel] || "#00C896",
// // //                       borderRadius: 10,
// // //                       cursor: "pointer",
// // //                       fontSize: 13,
// // //                       fontWeight: 600,
// // //                     }}
// // //                     onClick={() => setSel(null)}
// // //                   >
// // //                     ← Back to All Principles
// // //                   </button>
// // //                 </div>
// // //               ) : null}
// // //             </div>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* BAR CHART */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
// // //           <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
// // //           <p style={S.secSub}>Hover bars for details.</p>
// // //           <ImprovedBarChart principles={prn} />
// // //         </section>
// // //       )}

// // //       {/* RADIAL GRID */}
// // //       {hasPrn && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.3) }}>
// // //           <h2 style={S.secTitle}>🎯 Quick View – All Principles</h2>
// // //           <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
// // //             {pkeys.map(k => (
// // //               <div
// // //                 key={k}
// // //                 style={{
// // //                   ...S.radCard,
// // //                   cursor: "pointer",
// // //                   transition: "all 0.3s",
// // //                 }}
// // //                 onClick={() => setSel(k)}
// // //               >
// // //                 <Radial score={prn[k].score} label={k} color={COLORS[k] || "#00C896"} size={80} />
// // //                 <div style={{ fontSize: 16, marginTop: 8 }}>{ICONS[k]}</div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* DIAGNOSTICS */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
// // //         <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
// // //         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
// // //           {[
// // //             { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
// // //             { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
// // //             { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
// // //             { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
// // //             { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
// // //             { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
// // //           ].map((d, i) => (
// // //             <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
// // //               <span style={{ fontSize: 26 }}>{d.icon}</span>
// // //               <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
// // //               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //         {r.diagnostics.column_names?.length > 0 && (
// // //           <div style={{ marginTop: 24, padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
// // //             <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
// // //             <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
// // //               {r.diagnostics.column_names.map((col, i) => (
// // //                 <span key={i} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12 }}>
// // //                   {col}
// // //                 </span>
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* FINDINGS */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
// // //         <h2 style={S.secTitle}>
// // //           ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
// // //         </h2>
// // //         {!r.findings?.length ? (
// // //           <div style={{ padding: 24, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 12, color: "#00C896" }}>
// // //             ✅ No critical findings. Dataset aligns well with standards.
// // //           </div>
// // //         ) : (
// // //           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
// // //             {r.findings.map((f, i) => {
// // //               const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
// // //               return (
// // //                 <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sc}33`, borderRadius: 12, padding: 20 }}>
// // //                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
// // //                     <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
// // //                       {ICONS[f.category] || "•"} {f.category}
// // //                     </span>
// // //                     <span style={{ color: sc, fontWeight: 700 }}>{f.severity}</span>
// // //                   </div>
// // //                   <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
// // //                   <p style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>💡 {f.recommendation}</p>
// // //                 </div>
// // //               );
// // //             })}
// // //           </div>
// // //         )}
// // //       </section>

// // //       {/* RECOMMENDATION */}
// // //       {r.recommendation && (
// // //         <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
// // //           <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
// // //           <div style={{ padding: 20, background: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 12 }}>
// // //             <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
// // //           </div>
// // //         </section>
// // //       )}

// // //       {/* COMPREHENSIVE REPORT */}
// // //       <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center" }}>
// // //         <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
// // //         <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
// // //           Get full PDF with summary, evidence, and roadmap.
// // //         </p>
// // //         <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
// // //           <button
// // //             style={{
// // //               padding: "12px 36px",
// // //               background: "linear-gradient(135deg, #00C896, #0091DA)",
// // //               border: "none",
// // //               borderRadius: 10,
// // //               color: "white",
// // //               fontWeight: 600,
// // //               cursor: "pointer",
// // //             }}
// // //             onClick={handleDownloadPDF}
// // //             disabled={pdfLoading}
// // //           >
// // //             {pdfLoading ? "Preparing..." : "Yes – Download PDF"}
// // //           </button>
// // //           <button
// // //             style={{
// // //               padding: "12px 36px",
// // //               background: "transparent",
// // //               border: "1px solid rgba(255,255,255,0.3)",
// // //               borderRadius: 10,
// // //               color: "rgba(255,255,255,0.85)",
// // //               cursor: "pointer",
// // //             }}
// // //             onClick={() => navigate("/dashboard")}
// // //           >
// // //             No – Back to Dashboard
// // //           </button>
// // //         </div>
// // //       </section>

// // //       {/* FOOTER */}
// // //       <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
// // //         Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
// // //       </footer>

// // //       <style>{`
// // //         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
// // //         @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
// // //         * { box-sizing:border-box; margin:0; padding:0; }
// // //       `}</style>
// // //     </div>
// // //   );
// // // }



// // import { useLocation, useNavigate } from "react-router-dom";
// // import { useState, useEffect } from "react";
// // import {
// //   RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
// //   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
// //   ResponsiveContainer, Cell,
// // } from "recharts";

// // interface Principle { score: number; parameters: Record<string, number>; }
// // interface ReportData {
// //   report_id: string;
// //   ai_name: string;
// //   model_type: string;
// //   evaluated_at: string;
// //   overall_score: number;
// //   risk_level: string;
// //   structural_risk: string;
// //   logs_evaluated: number;
// //   data_quality_score: number;
// //   trusted_ai_principles: Record<string, Principle>;
// //   diagnostics: {
// //     missing_ratio: number;
// //     duplicates: number;
// //     schema_confidence: number;
// //     total_columns: number;
// //     text_columns: number;
// //     numeric_columns: number;
// //     column_names: string[];
// //   };
// //   findings: { category: string; severity: string; issue: string; recommendation: string }[];
// //   recommendation: string;
// //   framework_compliance: Record<string, string>;
// // }

// // const ICONS: Record<string, string> = {
// //   Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
// //   "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
// //   Sustainability: "🌱", "Human-Centricity": "👤"
// // };

// // const COLORS: Record<string, string> = {
// //   Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
// //   Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
// //   Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
// //   "Human-Centricity": "#FBBF24"
// // };

// // const FW: Record<string, { label: string; icon: string; desc: string }> = {
// //   EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
// //   ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
// //   NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
// //   KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
// // };

// // const CC: Record<string, string> = {
// //   Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
// //   Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
// // };

// // function fmt(k: string) {
// //   return String(k ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
// // }

// // function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
// //   const keys = Object.keys(principles);
// //   const N = keys.length;
// //   const cx = 280, cy = 280, R = 200;

// //   const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
// //   const pt = (i: number, v: number) => ({
// //     x: cx + (v / 100) * R * Math.cos(ang(i)),
// //     y: cy + (v / 100) * R * Math.sin(ang(i)),
// //   });
// //   const lp = (i: number) => {
// //     const r = R + 50;
// //     return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) };
// //   };

// //   const poly = keys.map((k, i) => pt(i, principles[k].score));
// //   const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");

// //   return (
// //     <svg viewBox="0 0 600 600" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
// //       {[20, 40, 60, 80, 100].map(lvl => (
// //         <polygon
// //           key={lvl}
// //           points={keys.map((_, i) => pt(i, lvl)).map(p => `${p.x},${p.y}`).join(" ")}
// //           fill="none"
// //           stroke="rgba(255,255,255,0.08)"
// //           strokeWidth="1.5"
// //         />
// //       ))}
// //       {keys.map((_, i) => {
// //         const e = pt(i, 100);
// //         return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
// //       })}
// //       <polygon points={polyStr} fill="rgba(0,200,150,0.15)" stroke="rgba(0,200,150,0.65)" strokeWidth="3" strokeLinejoin="round" />
// //       {[20, 40, 60, 80, 100].map(lvl => (
// //         <text key={`t${lvl}`} x={cx + 8} y={cy - (lvl / 100) * R + 5} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="start">{lvl}</text>
// //       ))}
// //       {poly.map((p, i) => {
// //         const k = keys[i];
// //         const c = COLORS[k] || "#00C896";
// //         const sel = selected === k;
// //         return (
// //           <circle
// //             key={i}
// //             cx={p.x}
// //             cy={p.y}
// //             r={sel ? 14 : 7}
// //             fill={c}
// //             stroke={sel ? "#fff" : "rgba(255,255,255,0.4)"}
// //             strokeWidth={sel ? 4 : 2}
// //             style={{
// //               cursor: "pointer",
// //               transition: "all 0.3s ease",
// //               filter: sel ? "drop-shadow(0 0 12px #00C896)" : "drop-shadow(0 0 4px rgba(0,200,150,0.3))",
// //             }}
// //             onClick={() => onSelect(sel ? null : k)}
// //             onMouseEnter={() => onSelect(k)}
// //             onMouseLeave={() => sel || onSelect(null)}
// //           />
// //         );
// //       })}
// //       {keys.map((k, i) => {
// //         const lpos = lp(i);
// //         const c = COLORS[k] || "#00C896";
// //         const sel = selected === k;
// //         const parts = k.split(" ");
// //         const sc = principles[k].score;
// //         return (
// //           <g
// //             key={k}
// //             style={{ cursor: "pointer" }}
// //             onClick={() => onSelect(sel ? null : k)}
// //             onMouseEnter={() => onSelect(k)}
// //             onMouseLeave={() => sel || onSelect(null)}
// //           >
// //             {parts.map((pt2, pi) => (
// //               <text
// //                 key={pi}
// //                 x={lpos.x}
// //                 y={lpos.y + (pi - parts.length / 2) * 16}
// //                 textAnchor="middle"
// //                 fill={sel ? c : "rgba(255,255,255,0.8)"}
// //                 fontSize={sel ? "13" : "11"}
// //                 fontWeight={sel ? "800" : "500"}
// //                 fontFamily="'DM Sans',sans-serif"
// //                 style={{ transition: "all 0.3s ease" }}
// //               >
// //                 {pt2}
// //               </text>
// //             ))}
// //             <text
// //               x={lpos.x}
// //               y={lpos.y + (parts.length / 2) * 16 + 6}
// //               textAnchor="middle"
// //               fill={c}
// //               fontSize="12"
// //               fontWeight="900"
// //               fontFamily="'DM Sans',sans-serif"
// //             >
// //               {sc}
// //             </text>
// //           </g>
// //         );
// //       })}
// //       <circle cx={cx} cy={cy} r={50} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
// //       <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="'DM Sans',sans-serif">
// //         {Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N)}
// //       </text>
// //       <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="'DM Sans',sans-serif">
// //         OVERALL
// //       </text>
// //     </svg>
// //   );
// // }

// // function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
// //   const [hovered, setHovered] = useState<string | null>(null);
// //   const entries = Object.entries(principles).map(([name, data]) => ({
// //     name,
// //     score: data.score,
// //     color: COLORS[name] || "#00C896",
// //   }));

// //   return (
// //     <div style={{ padding: "20px 0", overflowX: "auto" }}>
// //       <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
// //         <BarChart
// //           data={entries}
// //           layout="vertical"
// //           margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
// //         >
// //           <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
// //           <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
// //           <YAxis
// //             type="category"
// //             dataKey="name"
// //             tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
// //             width={150}
// //             axisLine={false}
// //             tickLine={false}
// //           />
// //           <Tooltip
// //             cursor={{ fill: "rgba(0,200,150,0.1)" }}
// //             contentStyle={{
// //               background: "rgba(10,30,66,0.96)",
// //               border: "1px solid rgba(0,200,150,0.45)",
// //               borderRadius: 12,
// //               padding: "14px 18px",
// //               color: "white",
// //               boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
// //             }}
// //           />
// //           <Bar
// //             dataKey="score"
// //             radius={[0, 10, 10, 0]}
// //             barSize={28}
// //             animationDuration={1600}
// //             animationEasing="easeOutCubic"
// //           >
// //             {entries.map((entry, index) => (
// //               <Cell
// //                 key={`cell-${index}`}
// //                 fill={`url(#grad-${index})`}
// //                 style={{
// //                   transition: "all 0.35s ease",
// //                   filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
// //                   transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
// //                   transformOrigin: "left center",
// //                 }}
// //                 onMouseEnter={() => setHovered(entry.name)}
// //                 onMouseLeave={() => setHovered(null)}
// //               />
// //             ))}
// //           </Bar>
// //           <defs>
// //             {entries.map((entry, i) => (
// //               <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
// //                 <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
// //                 <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
// //               </linearGradient>
// //             ))}
// //           </defs>
// //         </BarChart>
// //       </ResponsiveContainer>
// //     </div>
// //   );
// // }

// // function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
// //   const r = size * 0.38;
// //   const circ = 2 * Math.PI * r;
// //   const dash = (score / 100) * circ;
// //   return (
// //     <div style={{ textAlign: "center", padding: "10px" }}>
// //       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
// //         <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
// //         <circle
// //           cx={size / 2}
// //           cy={size / 2}
// //           r={r}
// //           fill="none"
// //           stroke={color}
// //           strokeWidth={size * 0.09}
// //           strokeDasharray={`${dash} ${circ}`}
// //           strokeLinecap="round"
// //           transform={`rotate(-90 ${size / 2} ${size / 2})`}
// //           style={{ transition: "stroke-dasharray 1.4s ease" }}
// //         />
// //         <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
// //           {score}
// //         </text>
// //       </svg>
// //       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
// //     </div>
// //   );
// // }

// // export default function Report() {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const r: ReportData = location.state?.data;
// //   const [sel, setSel] = useState<string | null>(null);
// //   const [anim, setAnim] = useState(false);
// //   const [pdfLoading, setPdfLoading] = useState(false);

// //   useEffect(() => {
// //     setTimeout(() => setAnim(true), 150);
// //   }, []);

// //   if (!r) {
// //     return (
// //       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
// //         <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
// //         <button
// //           style={{
// //             padding: "14px 32px",
// //             background: "rgba(255,255,255,0.08)",
// //             border: "1px solid rgba(255,255,255,0.15)",
// //             color: "white",
// //             borderRadius: 12,
// //             cursor: "pointer",
// //             fontSize: 15,
// //             fontWeight: 600,
// //           }}
// //           onClick={() => navigate("/dashboard")}
// //         >
// //           ← Back to Dashboard
// //         </button>
// //       </div>
// //     );
// //   }

// //   const prn = r.trusted_ai_principles || {};
// //   const pkeys = Object.keys(prn);
// //   const hasPrn = pkeys.length > 0;
// //   const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
// //   const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// //   const selData = sel ? prn[sel] : null;

// //   const fadeStyle = (delay: number): React.CSSProperties => ({
// //     opacity: anim ? 1 : 0,
// //     transform: anim ? "translateY(0)" : "translateY(24px)",
// //     transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
// //   });

// //  const handleDownloadPDF = async () => {
// //   setPdfLoading(true);

// //   try {
// //     const token = localStorage.getItem("token");
// //     if (!token) {
// //       alert("You need to be logged in to download reports. Redirecting to login...");
// //       navigate("/login");
// //       return;
// //     }

// //     if (!r.report_id) {
// //       alert("No report ID found. Please complete an evaluation first.");
// //       return;
// //     }

// //     const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
// //       method: "GET",
// //       headers: {
// //         "Authorization": `Bearer ${token}`,
// //         "Accept": "application/pdf",
// //       },
// //     });

// //     if (!response.ok) {
// //       let errorDetail = "Unknown error";
// //       try {
// //         const errJson = await response.json();
// //         errorDetail = errJson.detail || errorDetail;
// //       } catch {}
// //       throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
// //     }

// //     const blob = await response.blob();
// //     const downloadUrl = window.URL.createObjectURL(blob);
// //     const link = document.createElement("a");
// //     link.href = downloadUrl;
// //     link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
// //     document.body.appendChild(link);
// //     link.click();
// //     link.remove();
// //     window.URL.revokeObjectURL(downloadUrl);

// //   } catch (err: any) {
// //     console.error("PDF download error:", err);
// //     alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
// //   } finally {
// //     setPdfLoading(false);
// //   }
// // };

// //   const S: Record<string, React.CSSProperties> = {
// //     page: {
// //       minHeight: "100vh",
// //       background: "#050d1a",
// //       fontFamily: "'DM Sans',sans-serif",
// //       color: "white",
// //       padding: "40px 20px 100px",
// //       position: "relative",
// //       overflowX: "hidden",
// //     },
// //     bg: {
// //       position: "fixed",
// //       inset: 0,
// //       zIndex: 0,
// //       pointerEvents: "none",
// //       background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,100,200,0.12) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,200,150,0.09) 0%, transparent 65%)",
// //     },
// //     header: {
// //       position: "relative",
// //       zIndex: 1,
// //       padding: "32px 40px 24px",
// //       borderBottom: "1px solid rgba(255,255,255,0.08)",
// //       display: "flex",
// //       justifyContent: "space-between",
// //       alignItems: "flex-start",
// //       flexWrap: "wrap",
// //       gap: 20,
// //     },
// //     logo: {
// //       fontSize: 20,
// //       fontWeight: 900,
// //       background: "linear-gradient(135deg, #00C8FF, #00C896)",
// //       WebkitBackgroundClip: "text",
// //       WebkitTextFillColor: "transparent",
// //     },
// //     kBadge: {
// //       fontSize: 11,
// //       padding: "3px 12px",
// //       background: "rgba(0,51,141,0.45)",
// //       border: "1px solid rgba(0,51,141,0.65)",
// //       borderRadius: 20,
// //       color: "#60A5FA",
// //     },
// //     title: {
// //       fontSize: 32,
// //       fontWeight: 900,
// //       color: "white",
// //       letterSpacing: "-0.02em",
// //       margin: "6px 0 10px",
// //     },
// //     meta: {
// //       display: "flex",
// //       gap: 10,
// //       flexWrap: "wrap",
// //       alignItems: "center",
// //       fontSize: 13,
// //       color: "rgba(255,255,255,0.55)",
// //     },
// //     dot: { color: "rgba(255,255,255,0.25)" },
// //     backBtn: {
// //       background: "rgba(255,255,255,0.06)",
// //       border: "1px solid rgba(255,255,255,0.12)",
// //       color: "rgba(255,255,255,0.75)",
// //       padding: "10px 24px",
// //       borderRadius: 10,
// //       cursor: "pointer",
// //       fontSize: 14,
// //       fontWeight: 600,
// //       transition: "all 0.3s",
// //     },
// //     heroRow: {
// //       position: "relative",
// //       zIndex: 1,
// //       display: "flex",
// //       gap: 24,
// //       padding: "32px 40px",
// //       alignItems: "stretch",
// //       flexWrap: "wrap",
// //       borderBottom: "1px solid rgba(255,255,255,0.06)",
// //     },
// //     heroScore: {
// //       textAlign: "center",
// //       padding: "32px 40px",
// //       background: "rgba(255,255,255,0.04)",
// //       border: "2px solid",
// //       borderRadius: 20,
// //       minWidth: 200,
// //       flexShrink: 0,
// //       boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
// //     },
// //     riskPill: {
// //       display: "inline-block",
// //       padding: "5px 16px",
// //       borderRadius: 20,
// //       fontSize: 13,
// //       fontWeight: 700,
// //       marginTop: 12,
// //     },
// //     statsRow: {
// //       display: "flex",
// //       gap: 12,
// //       flexWrap: "wrap",
// //       flex: 1,
// //     },
// //     statCard: {
// //       flex: "1 1 130px",
// //       background: "rgba(255,255,255,0.04)",
// //       border: "1px solid rgba(255,255,255,0.09)",
// //       borderRadius: 14,
// //       padding: "16px",
// //       textAlign: "center",
// //       display: "flex",
// //       flexDirection: "column",
// //       gap: 6,
// //       boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
// //     },
// //     sec: {
// //       position: "relative",
// //       zIndex: 1,
// //       margin: "32px 40px",
// //       background: "rgba(255,255,255,0.03)",
// //       border: "1px solid rgba(255,255,255,0.08)",
// //       borderRadius: 18,
// //       padding: "32px",
// //       boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
// //     },
// //     secTitle: {
// //       fontSize: 22,
// //       fontWeight: 800,
// //       color: "white",
// //       marginBottom: 10,
// //     },
// //     secSub: {
// //       fontSize: 13,
// //       color: "rgba(255,255,255,0.45)",
// //       marginBottom: 24,
// //       lineHeight: 1.5,
// //     },
// //     spiderWrap: {
// //       display: "flex",
// //       gap: 32,
// //       flexWrap: "wrap",
// //       alignItems: "flex-start",
// //       justifyContent: "center",
// //     },
// //     drillPanel: {
// //       flex: "1 1 320px",
// //       minHeight: 420,
// //       background: "rgba(0,0,0,0.22)",
// //       border: "1px solid rgba(255,255,255,0.08)",
// //       borderRadius: 14,
// //       padding: "24px",
// //       display: "flex",
// //       flexDirection: "column",
// //       alignItems: "center",
// //     },
// //   };

// //   return (
// //     <div style={S.page}>
// //       <div style={S.bg} />

// //       {/* HEADER */}
// //       <div style={{ ...S.header, ...fadeStyle(0) }}>
// //         <div>
// //           <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
// //             <span style={S.logo}>Auditable AI™</span>
// //             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
// //           </div>
// //           <h1 style={S.title}>Governance Audit Report</h1>
// //           <div style={S.meta}>
// //             <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
// //             <span>🧠 {r.model_type}</span><span style={S.dot}> · </span>
// //             <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
// //             <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
// //               ID: {r.report_id?.slice(0, 12)}…
// //             </span>
// //           </div>
// //         </div>
// //         <button
// //           style={S.backBtn}
// //           onClick={() => navigate("/dashboard")}
// //         >
// //           ← Dashboard
// //         </button>
// //       </div>

// //       {/* HERO SCORE */}
// //       <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
// //         <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
// //           <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
// //             {r.overall_score}
// //           </div>
// //           <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
// //           <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
// //             {r.risk_level} Risk
// //           </div>
// //         </div>

// //         <div style={S.statsRow}>
// //           {[
// //             { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
// //             { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
// //             { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
// //             { icon: "✅", label: "Principles Tested", val: pkeys.length },
// //             { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
// //           ].map((s, i) => (
// //             <div key={i} style={S.statCard}>
// //               <span style={{ fontSize: 26 }}>{s.icon}</span>
// //               <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
// //               <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       {/* FRAMEWORK COMPLIANCE */}
// //       <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
// //         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
// //         <p style={S.secSub}>Assessment against major AI governance standards.</p>
// //         <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
// //           {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
// //             const fw = FW[key] || { label: key, icon: "📋", desc: "" };
// //             const sc = CC[status] || "#aaa";
// //             return (
// //               <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
// //                 <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
// //                 <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
// //                 <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
// //                 <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
// //                   {status}
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //         <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
// //           <span style={{ opacity: 0.5 }}>ℹ️</span>
// //           <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
// //             EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
// //           </span>
// //         </div>
// //       </section>

// //       {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
// //       {hasPrn && (
// //         <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
// //           <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
// //           <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

// //           <div style={{
// //             display: "flex",
// //             gap: 32,
// //             flexWrap: "wrap",
// //             alignItems: "flex-start",
// //             justifyContent: "center",
// //           }}>
// //             {/* Left: Spider Chart */}
// //             <div style={{ flex: "1 1 500px", minWidth: 320 }}>
// //               <Spider principles={prn} onSelect={setSel} selected={sel} />
// //             </div>

// //             {/* Right: Drill-down / List */}
// //             <div style={{
// //               flex: "1 1 360px",
// //               minWidth: 320,
// //               background: "rgba(0,0,0,0.22)",
// //               border: "1px solid rgba(255,255,255,0.08)",
// //               borderRadius: 14,
// //               padding: "28px",
// //               minHeight: 460,
// //             }}>
// //               {!sel ? (
// //                 <div>
// //                   <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 20 }}>
// //                     Select a principle to view breakdown
// //                   </div>
// //                   {pkeys.map(k => {
// //                     const c = COLORS[k] || "#00C896";
// //                     const sc = prn[k].score;
// //                     return (
// //                       <div
// //                         key={k}
// //                         style={{
// //                           display: "flex",
// //                           alignItems: "center",
// //                           gap: 12,
// //                           padding: "10px 0",
// //                           borderBottom: "1px solid rgba(255,255,255,0.06)",
// //                           cursor: "pointer",
// //                           transition: "all 0.2s",
// //                         }}
// //                         onClick={() => setSel(k)}
// //                       >
// //                         <span style={{ fontSize: 18 }}>{ICONS[k]}</span>
// //                         <span style={{ flex: 1, fontSize: 14 }}>{k}</span>
// //                         <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
// //                           <div style={{ width: `${sc}%`, height: "100%", background: c, borderRadius: 3 }} />
// //                         </div>
// //                         <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{sc}</span>
// //                       </div>
// //                     );
// //                   })}
// //                 </div>
// //               ) : selData ? (
// //                 <div>
// //                   <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
// //                     <span style={{ fontSize: 28 }}>{ICONS[sel]}</span>
// //                     <div style={{ flex: 1 }}>
// //                       <div style={{ fontSize: 18, fontWeight: 700 }}>{sel}</div>
// //                       <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sub-parameters</div>
// //                     </div>
// //                     <div style={{ fontSize: 32, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>
// //                       {selData.score}
// //                     </div>
// //                   </div>

// //                   <div style={{ margin: "24px 0", textAlign: "center" }}>
// //                     <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={110} />
// //                   </div>

// //                   {Object.entries(selData.parameters).map(([param, val]) => {
// //                     const v = val as number;
// //                     const c = COLORS[sel] || "#00C896";
// //                     const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
// //                     const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
// //                     return (
// //                       <div key={param} style={{ marginBottom: 16 }}>
// //                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
// //                           <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{param}</span>
// //                           <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, color: sc2, background: `${sc2}15`, border: `1px solid ${sc2}40` }}>
// //                             {sl}
// //                           </span>
// //                         </div>
// //                         <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
// //                           <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 4 }} />
// //                         </div>
// //                         <div style={{ textAlign: "right", fontSize: 12, color: c, marginTop: 4 }}>{v}</div>
// //                       </div>
// //                     );
// //                   })}

// //                   <button
// //                     style={{
// //                       marginTop: 24,
// //                       width: "100%",
// //                       padding: "10px",
// //                       background: "transparent",
// //                       border: `1px solid ${COLORS[sel] || "#00C896"}50`,
// //                       color: COLORS[sel] || "#00C896",
// //                       borderRadius: 10,
// //                       cursor: "pointer",
// //                       fontSize: 13,
// //                       fontWeight: 600,
// //                     }}
// //                     onClick={() => setSel(null)}
// //                   >
// //                     ← Back to All Principles
// //                   </button>
// //                 </div>
// //               ) : null}
// //             </div>
// //           </div>
// //         </section>
// //       )}

// //       {/* BAR CHART */}
// //       {hasPrn && (
// //         <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
// //           <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
// //           <p style={S.secSub}>Hover bars for details.</p>
// //           <ImprovedBarChart principles={prn} />
// //         </section>
// //       )}

// //       {/* RADIAL GRID */}
// //       {hasPrn && (
// //         <section style={{ ...S.sec, ...fadeStyle(0.3) }}>
// //           <h2 style={S.secTitle}>🎯 Quick View – All Principles</h2>
// //           <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
// //             {pkeys.map(k => (
// //               <div
// //                 key={k}
// //                 style={{
// //                   ...S.radCard,
// //                   cursor: "pointer",
// //                   transition: "all 0.3s",
// //                 }}
// //                 onClick={() => setSel(k)}
// //               >
// //                 <Radial score={prn[k].score} label={k} color={COLORS[k] || "#00C896"} size={80} />
// //                 <div style={{ fontSize: 16, marginTop: 8 }}>{ICONS[k]}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </section>
// //       )}

// //       {/* DIAGNOSTICS */}
// //       <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
// //         <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
// //         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
// //           {[
// //             { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
// //             { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
// //             { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
// //             { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
// //             { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
// //             { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
// //           ].map((d, i) => (
// //             <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
// //               <span style={{ fontSize: 26 }}>{d.icon}</span>
// //               <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
// //               <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
// //             </div>
// //           ))}
// //         </div>
// //         {r.diagnostics.column_names?.length > 0 && (
// //           <div style={{ marginTop: 24, padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
// //             <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
// //             <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
// //               {r.diagnostics.column_names.map((col, i) => (
// //                 <span key={i} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12 }}>
// //                   {col}
// //                 </span>
// //               ))}
// //             </div>
// //           </div>
// //         )}
// //       </section>

// //       {/* FINDINGS */}
// //       <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
// //         <h2 style={S.secTitle}>
// //           ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
// //         </h2>
// //         {!r.findings?.length ? (
// //           <div style={{ padding: 24, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 12, color: "#00C896" }}>
// //             ✅ No critical findings. Dataset aligns well with standards.
// //           </div>
// //         ) : (
// //           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
// //             {r.findings.map((f, i) => {
// //               const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
// //               return (
// //                 <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sc}33`, borderRadius: 12, padding: 20 }}>
// //                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
// //                     <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
// //                       {ICONS[f.category] || "•"} {f.category}
// //                     </span>
// //                     <span style={{ color: sc, fontWeight: 700 }}>{f.severity}</span>
// //                   </div>
// //                   <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
// //                   <p style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>💡 {f.recommendation}</p>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         )}
// //       </section>

// //       {/* RECOMMENDATION */}
// //       {r.recommendation && (
// //         <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
// //           <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
// //           <div style={{ padding: 20, background: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 12 }}>
// //             <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
// //           </div>
// //         </section>
// //       )}

// //       {/* PDF DOWNLOAD SECTION */}
// //       <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center" }}>
// //         <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
// //         <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
// //           Download full PDF with summary, evidence, and roadmap.
// //         </p>
// //         <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
// //           <button
// //             style={{
// //               padding: "12px 36px",
// //               background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg, #00C896, #0091DA)",
// //               border: "none",
// //               borderRadius: 10,
// //               color: "white",
// //               fontWeight: 600,
// //               cursor: pdfLoading ? "not-allowed" : "pointer",
// //               minWidth: 220,
// //             }}
// //             onClick={handleDownloadPDF}
// //             disabled={pdfLoading}
// //           >
// //             {pdfLoading ? "Preparing PDF..." : "Download Full PDF Report"}
// //           </button>
// //           <button
// //             style={{
// //               padding: "12px 36px",
// //               background: "transparent",
// //               border: "1px solid rgba(255,255,255,0.3)",
// //               borderRadius: 10,
// //               color: "rgba(255,255,255,0.85)",
// //               cursor: "pointer",
// //             }}
// //             onClick={() => navigate("/dashboard")}
// //           >
// //             Back to Dashboard
// //           </button>
// //         </div>
// //       </section>

// //       {/* FOOTER */}
// //       <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
// //         Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
// //       </footer>

// //       <style>{`
// //         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
// //         @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
// //         * { box-sizing:border-box; margin:0; padding:0; }
// //       `}</style>
// //     </div>
// //   );
// // }


// import { useLocation, useNavigate } from "react-router-dom";
// import { useState, useEffect, useRef } from "react";
// import {
//   RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell, LineChart, Line, Legend,
//   PieChart, Pie,
// } from "recharts";

// /* ─── Types ─────────────────────────────────────────────────────────── */
// interface Principle {
//   score: number;
//   parameters: Record<string, number>;
//   description?: string;
// }
// interface RiskItem {
//   principle: string; score: number; severity: string;
//   color: string; worst_param: string; worst_val: number; gap: number;
// }
// interface RiskAnalysis {
//   overall_risk_level: string; risk_items: RiskItem[];
//   critical_count: number; high_count: number;
//   moderate_count: number; low_count: number;
//   average_score: number; data_volume_risk: string; missing_data_risk: string;
// }
// interface ReportData {
//   report_id: string; ai_name: string; model_type: string; evaluated_at: string;
//   overall_score: number; risk_level: string; structural_risk: string;
//   logs_evaluated: number; data_quality_score: number;
//   trusted_ai_principles: Record<string, Principle>;
//   diagnostics: { missing_ratio: number; duplicates: number; schema_confidence: number;
//     total_columns: number; text_columns: number; numeric_columns: number; column_names: string[]; };
//   findings: { category: string; severity: string; issue: string; recommendation: string }[];
//   risk_analysis?: RiskAnalysis;
//   recommendation: string;
//   framework_compliance: Record<string, string>;
// }

// /* ─── Constants ─────────────────────────────────────────────────────── */
// const ICONS: Record<string, string> = {
//   Transparency:"🔍", Explainability:"💡", Fairness:"⚖️", Accountability:"📋",
//   "Data Integrity":"🗄️", Reliability:"⚙️", Security:"🔒", Privacy:"🛡️",
//   Sustainability:"🌱", "Human-Centricity":"👤",
// };
// const COLORS: Record<string, string> = {
//   Transparency:"#00C8FF", Explainability:"#00E5A0", Fairness:"#FF6B9D",
//   Accountability:"#FFB020", "Data Integrity":"#A78BFA", Reliability:"#34D399",
//   Security:"#F87171", Privacy:"#60A5FA", Sustainability:"#4ADE80",
//   "Human-Centricity":"#FBBF24",
// };
// const FW: Record<string, { label: string; icon: string; desc: string }> = {
//   EU_AI_Act:   { label:"EU AI Act",       icon:"🇪🇺", desc:"European Union AI Regulation" },
//   ISO_42001:   { label:"ISO 42001",        icon:"🏅",  desc:"AI Management System Standard" },
//   NIST_AI_RMF: { label:"NIST AI RMF",     icon:"🏛️", desc:"AI Risk Management Framework" },
//   KPMG_TAF:    { label:"KPMG Trusted AI", icon:"🔷",  desc:"Trusted AI Framework" },
// };
// const CC: Record<string, string> = {
//   Compliant:"#00C896", "Certified Ready":"#00C896", Aligned:"#00C896",
//   Conditional:"#ffb020", Assessed:"#60A5FA", Partial:"#ff4d4d",
// };
// const SEV_COLOR = (s: string) =>
//   s === "Critical" ? "#ff2222" : s === "High" ? "#ff4d4d" : s === "Moderate" ? "#ffb020" : "#00C896";

// const PRINCIPLE_LONG_DESC: Record<string, string> = {
//   Transparency: "Transparency ensures the AI system is open about its capabilities, limitations, decision logic, and data practices. Regulators and users must be able to understand what the system does and why — including its training data sources, model architecture, known failure modes, and uncertainty levels.",
//   Explainability: "Explainability requires that AI decisions and outputs are interpretable to relevant stakeholders — from technical teams to end-users and regulators. This includes local explanations (why this specific output?), global explanations (how does the model generally behave?), and confidence/uncertainty quantification.",
//   Fairness: "Fairness demands that the AI system treats all individuals and demographic groups equitably. This encompasses bias detection in training data, equal error rates across protected groups, demographic coverage, and ongoing monitoring for distributional shift or emergent biases in production.",
//   Accountability: "Accountability establishes clear lines of responsibility for AI outcomes. Governance structures, comprehensive audit trails, human oversight mechanisms, model versioning, and escalation procedures must exist to assign responsibility and enable corrective action when the AI causes harm.",
//   "Data Integrity": "Data Integrity ensures the data powering the AI is accurate, complete, representative, and free from harmful corruptions. This includes data provenance tracking, deduplication, schema enforcement, ground-truth labelling quality, and ongoing data quality monitoring across the full data pipeline.",
//   Reliability: "Reliability requires the AI to perform consistently and predictably across normal and edge-case conditions. This encompasses performance metric tracking (accuracy, latency, error rates), robustness testing, degradation detection, and SLA compliance under varying load and data distributions.",
//   Security: "Security ensures the AI system is resilient against adversarial attacks, data poisoning, model extraction, prompt injection, and other cyber threats. A defence-in-depth approach covering input validation, output filtering, access controls, and continuous red-teaming must be maintained.",
//   Privacy: "Privacy mandates that personal data used by the AI is collected, processed, and stored in compliance with applicable regulations (GDPR, CCPA). Data minimisation, purpose limitation, consent management, anonymisation techniques, and right-to-erasure capabilities must be embedded by design.",
//   Sustainability: "Sustainability requires the AI system to minimise its environmental footprint. This includes efficient model architectures, optimised training and inference pipelines, carbon-aware scheduling, dataset efficiency, and responsible resource allocation to reduce the system's overall climate impact.",
//   "Human-Centricity": "Human-Centricity ensures AI augments rather than replaces human judgment in high-stakes scenarios. Meaningful human oversight, contestability mechanisms, override capabilities, user feedback loops, and clear escalation paths must be maintained to keep humans in control of consequential decisions.",
// };

// /* ─── Sub-components ────────────────────────────────────────────────── */

// function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
//   const r = size * 0.38; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
//   return (
//     <div style={{ textAlign: "center" }}>
//       <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size*0.09}/>
//         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
//           strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
//           transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 1.4s ease" }}/>
//         <text x={size/2} y={size/2+6} textAnchor="middle" fill="white" fontSize={size*0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">{score}</text>
//       </svg>
//       <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6, fontWeight: 500, maxWidth: size }}>{label}</div>
//     </div>
//   );
// }

// function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
//   const keys = Object.keys(principles); const N = keys.length;
//   const cx = 290, cy = 290, R = 195;
//   const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
//   const pt  = (i: number, v: number) => ({ x: cx + (v / 100) * R * Math.cos(ang(i)), y: cy + (v / 100) * R * Math.sin(ang(i)) });
//   const lp  = (i: number) => { const r = R + 55; return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) }; };
//   const poly = keys.map((k, i) => pt(i, principles[k].score));
//   const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");

//   return (
//     <svg viewBox="0 0 620 620" style={{ width: "100%", maxWidth: 620, display: "block", margin: "0 auto" }}>
//       {[20,40,60,80,100].map(lvl => (
//         <polygon key={lvl} points={keys.map((_,i) => pt(i,lvl)).map(p=>`${p.x},${p.y}`).join(" ")}
//           fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
//       ))}
//       {keys.map((_,i) => { const e = pt(i,100); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>; })}
//       <polygon points={polyStr} fill="rgba(0,200,150,0.12)" stroke="rgba(0,200,150,0.6)" strokeWidth="2.5" strokeLinejoin="round"/>
//       {[20,40,60,80,100].map(lvl => (
//         <text key={`t${lvl}`} x={cx+8} y={cy-(lvl/100)*R+5} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="start">{lvl}</text>
//       ))}
//       {poly.map((p,i) => {
//         const k = keys[i]; const c = COLORS[k]||"#00C896"; const sel = selected===k;
//         return <circle key={i} cx={p.x} cy={p.y} r={sel?13:6} fill={c}
//           stroke={sel?"#fff":"rgba(255,255,255,0.4)"} strokeWidth={sel?3:1.5}
//           style={{ cursor:"pointer", transition:"all 0.25s", filter: sel?"drop-shadow(0 0 10px #00C896)":"none" }}
//           onClick={()=>onSelect(sel?null:k)} onMouseEnter={()=>onSelect(k)} onMouseLeave={()=>sel||onSelect(null)}/>;
//       })}
//       {keys.map((k,i) => {
//         const lpos = lp(i); const c = COLORS[k]||"#00C896"; const sel = selected===k;
//         const parts = k.split(" "); const sc = principles[k].score;
//         return (
//           <g key={k} style={{ cursor:"pointer" }} onClick={()=>onSelect(sel?null:k)}
//             onMouseEnter={()=>onSelect(k)} onMouseLeave={()=>sel||onSelect(null)}>
//             {parts.map((p2,pi) => (
//               <text key={pi} x={lpos.x} y={lpos.y+(pi-parts.length/2)*15} textAnchor="middle"
//                 fill={sel?c:"rgba(255,255,255,0.8)"} fontSize={sel?"12":"10"}
//                 fontWeight={sel?"800":"500"} fontFamily="'DM Sans',sans-serif">{p2}</text>
//             ))}
//             <text x={lpos.x} y={lpos.y+(parts.length/2)*15+6} textAnchor="middle"
//               fill={c} fontSize="11" fontWeight="900" fontFamily="'DM Sans',sans-serif">{sc}</text>
//           </g>
//         );
//       })}
//       <circle cx={cx} cy={cy} r={46} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
//       <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="26" fontWeight="900" fontFamily="'DM Sans',sans-serif">
//         {Math.round(Object.values(principles).reduce((s,v)=>s+v.score,0)/Object.keys(principles).length)}
//       </text>
//       <text x={cx} y={cy+16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="'DM Sans',sans-serif">OVERALL</text>
//     </svg>
//   );
// }

// /* ─── Main Component ────────────────────────────────────────────────── */
// export default function Report() {
//   const location = useLocation(); const navigate = useNavigate();
//   const r: ReportData = location.state?.data;
//   const [sel, setSel]           = useState<string | null>(null);
//   const [tab, setTab]           = useState<"overview"|"principles"|"risk"|"diagnostics"|"findings">("overview");
//   const [anim, setAnim]         = useState(false);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [expandedPrn, setExpandedPrn] = useState<string | null>(null);
//   const topRef = useRef<HTMLDivElement>(null);

//   useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

//   if (!r) return (
//     <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
//       height:"100vh", background:"#050d1a", gap:20 }}>
//       <p style={{ color:"rgba(255,255,255,0.6)", fontSize:18 }}>No report data found.</p>
//       <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Back to Dashboard</button>
//     </div>
//   );

//   const prn    = r.trusted_ai_principles || {};
//   const pkeys  = Object.keys(prn);
//   const hasPrn = pkeys.length > 0;
//   const rc     = r.risk_level==="Low"?"#00C896":r.risk_level==="Moderate"?"#ffb020":"#ff4d4d";
//   const fmtDt  = (d: string) => new Date(d).toLocaleString("en-GB",{ day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
//   const selData = sel ? prn[sel] : null;
//   const ra     = r.risk_analysis;

//   const fs = (delay: number): React.CSSProperties => ({
//     opacity: anim ? 1 : 0,
//     transform: anim ? "translateY(0)" : "translateY(20px)",
//     transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
//   });

//   // Radar data for recharts
//   const radarData = pkeys.map(k => ({ subject: k.replace(/-/g," ").replace("Centricity","Centric"), score: prn[k].score, fullMark: 100 }));

//   // Bar data
//   const barData = pkeys.map(k => ({ name: k, score: prn[k].score, color: COLORS[k]||"#00C896" }));

//   // Risk distribution pie
//   const riskPie = ra ? [
//     { name:"Critical", value: ra.critical_count, fill:"#ff2222" },
//     { name:"High",     value: ra.high_count,     fill:"#ff4d4d" },
//     { name:"Moderate", value: ra.moderate_count, fill:"#ffb020" },
//     { name:"Low",      value: ra.low_count,      fill:"#00C896" },
//   ].filter(d=>d.value>0) : [];

//   const handleDownloadPDF = async () => {
//     setPdfLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) { navigate("/login"); return; }
//       const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
//         method:"GET", headers:{ Authorization:`Bearer ${token}`, Accept:"application/pdf" },
//       });
//       if (!response.ok) throw new Error(`Download failed: ${response.status}`);
//       const blob = await response.blob();
//       const url  = window.URL.createObjectURL(blob);
//       const a    = document.createElement("a");
//       a.href = url; a.download = `AuditReport_${r.ai_name}_${r.report_id?.slice(0,8)}.pdf`;
//       document.body.appendChild(a); a.click(); a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch(e: any) {
//       alert(e.message || "PDF download failed.");
//     } finally { setPdfLoading(false); }
//   };

//   const TABS = [
//     { id:"overview",    label:"📊 Overview" },
//     { id:"principles",  label:"🕸️ Principles" },
//     { id:"risk",        label:"⚠️ Risk Analysis" },
//     { id:"diagnostics", label:"🔬 Diagnostics" },
//     { id:"findings",    label:`📌 Findings ${(r.findings?.length||0)>0?`(${r.findings.length})`:""}` },
//   ];

//   return (
//     <div style={S.page}>
//       <div style={S.bg}/>
//       <div ref={topRef}/>

//       {/* ── HEADER ─────────────────────────────────────────────────── */}
//       <div style={{ ...S.header, ...fs(0) }}>
//         <div>
//           <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
//             <span style={S.logo}>Auditable AI™</span>
//             <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
//           </div>
//           <h1 style={S.title}>Governance Audit Report</h1>
//           <div style={S.meta}>
//             <span>📌 {r.ai_name}</span><span style={S.dot}>·</span>
//             <span>🧠 {r.model_type}</span><span style={S.dot}>·</span>
//             <span>📅 {fmtDt(r.evaluated_at)}</span><span style={S.dot}>·</span>
//             <span style={{ fontFamily:"monospace", fontSize:11, color:"rgba(255,255,255,0.3)" }}>ID: {r.report_id?.slice(0,14)}…</span>
//           </div>
//         </div>
//         <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
//           <button style={S.pdfBtn} onClick={handleDownloadPDF} disabled={pdfLoading}>
//             {pdfLoading ? "⏳ Preparing…" : "⬇ Download PDF"}
//           </button>
//           <button style={S.backBtn} onClick={()=>navigate("/dashboard")}>← Dashboard</button>
//         </div>
//       </div>

//       {/* ── HERO ROW ────────────────────────────────────────────────── */}
//       <div style={{ ...S.heroRow, ...fs(0.08) }}>
//         <div style={{ ...S.heroScore, borderColor:`${rc}55` }}>
//           <div style={{ fontSize:72, fontWeight:900, color:rc, lineHeight:1 }}>{r.overall_score}</div>
//           <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:4 }}>/ 100</div>
//           <div style={{ ...S.riskPill, background:`${rc}22`, border:`1px solid ${rc}66`, color:rc }}>{r.risk_level} Risk</div>
//         </div>
//         <div style={S.statsRow}>
//           {[
//             { icon:"📂", label:"Logs Evaluated",   val:r.logs_evaluated },
//             { icon:"📊", label:"Data Quality",      val:`${r.data_quality_score}%` },
//             { icon:"🏗️", label:"Structural Risk",  val:r.structural_risk },
//             { icon:"✅", label:"Principles Tested", val:pkeys.length },
//             { icon:"⚠️", label:"Findings",          val:r.findings?.length||0 },
//             { icon:"🔴", label:"Critical Items",    val:ra?.critical_count??0 },
//           ].map((s,i) => (
//             <div key={i} style={S.statCard}>
//               <span style={{ fontSize:22 }}>{s.icon}</span>
//               <div style={{ fontSize:22, fontWeight:900, color:"white" }}>{s.val}</div>
//               <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{s.label}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── FRAMEWORK COMPLIANCE ────────────────────────────────────── */}
//       <section style={{ ...S.sec, ...fs(0.12) }}>
//         <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
//         <p style={S.secSub}>Assessment against major international AI governance standards.</p>
//         <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
//           {Object.entries(r.framework_compliance||{}).map(([key,status]) => {
//             const fw = FW[key]||{label:key, icon:"📋", desc:""}; const sc = CC[status]||"#aaa";
//             return (
//               <div key={key} style={{ ...S.fwCard, borderColor:`${sc}55` }}>
//                 <div style={{ fontSize:32, marginBottom:10 }}>{fw.icon}</div>
//                 <div style={{ fontWeight:700, fontSize:15, color:"white" }}>{fw.label}</div>
//                 <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", margin:"4px 0 10px", textAlign:"center" }}>{fw.desc}</div>
//                 <div style={{ ...S.fwPill, background:`${sc}22`, border:`1px solid ${sc}66`, color:sc }}>{status}</div>
//               </div>
//             );
//           })}
//         </div>
//         <div style={{ marginTop:20, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.7 }}>
//           <strong style={{ color:"rgba(255,255,255,0.6)" }}>EU AI Act</strong> reflects Title III transparency & accountability obligations. &nbsp;
//           <strong style={{ color:"rgba(255,255,255,0.6)" }}>ISO/IEC 42001:2023</strong> readiness covers AI management system controls. &nbsp;
//           <strong style={{ color:"rgba(255,255,255,0.6)" }}>NIST AI RMF</strong> alignment maps to GOVERN, MAP, MEASURE, and MANAGE functions. &nbsp;
//           <strong style={{ color:"rgba(255,255,255,0.6)" }}>KPMG Trusted AI Framework</strong> scoring drives all compliance determinations.
//         </div>
//       </section>

//       {/* ── NAVIGATION TABS ─────────────────────────────────────────── */}
//       <div style={{ ...fs(0.14), position:"relative", zIndex:1, margin:"24px 40px 0", display:"flex", gap:8, flexWrap:"wrap" }}>
//         {TABS.map(t => (
//           <button key={t.id} onClick={()=>setTab(t.id as any)}
//             style={{ padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
//               background: tab===t.id ? "linear-gradient(135deg,#0091DA,#00C896)" : "rgba(255,255,255,0.06)",
//               color: tab===t.id ? "white" : "rgba(255,255,255,0.6)", transition:"all 0.25s" }}>
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           TAB: OVERVIEW — Recharts Radar + Bar
//       ══════════════════════════════════════════════════════════════ */}
//       {tab === "overview" && hasPrn && (
//         <>
//           {/* Recharts Radar */}
//           <section style={{ ...S.sec, ...fs(0.16) }}>
//             <h2 style={S.secTitle}>🕸️ Trusted AI Principles — Radar Overview</h2>
//             <p style={S.secSub}>All 10 KPMG Trusted AI dimensions scored against your dataset.</p>
//             <ResponsiveContainer width="100%" height={420}>
//               <RadarChart data={radarData} margin={{ top:20, right:60, bottom:20, left:60 }}>
//                 <PolarGrid stroke="rgba(255,255,255,0.1)"/>
//                 <PolarAngleAxis dataKey="subject" tick={{ fill:"rgba(255,255,255,0.75)", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}/>
//                 <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:"rgba(255,255,255,0.3)", fontSize:9 }}/>
//                 <Radar name="Score" dataKey="score" stroke="#00C896" fill="#00C896" fillOpacity={0.18} strokeWidth={2}/>
//                 <Tooltip contentStyle={{ background:"rgba(5,13,26,0.95)", border:"1px solid rgba(0,200,150,0.4)", borderRadius:10, color:"white" }}/>
//                 <Legend formatter={v=><span style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>{v}</span>}/>
//               </RadarChart>
//             </ResponsiveContainer>
//           </section>

//           {/* Horizontal bar chart */}
//           <section style={{ ...S.sec, ...fs(0.2) }}>
//             <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
//             <p style={S.secSub}>Hover bars for exact scores. Bars are colour-coded per principle.</p>
//             <ResponsiveContainer width="100%" height={Math.max(pkeys.length*60+60, 280)}>
//               <BarChart data={barData} layout="vertical" margin={{ top:10, right:60, left:160, bottom:10 }}>
//                 <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.07)" horizontal={false}/>
//                 <XAxis type="number" domain={[0,100]} tick={{ fill:"rgba(255,255,255,0.55)", fontSize:11 }}/>
//                 <YAxis type="category" dataKey="name" width={150}
//                   tick={{ fill:"rgba(255,255,255,0.85)", fontSize:13, fontWeight:500 }}
//                   axisLine={false} tickLine={false}/>
//                 <Tooltip
//                   cursor={{ fill:"rgba(0,200,150,0.07)" }}
//                   contentStyle={{ background:"rgba(5,13,26,0.95)", border:"1px solid rgba(0,200,150,0.4)", borderRadius:10, color:"white" }}/>
//                 <Bar dataKey="score" radius={[0,10,10,0]} barSize={26} animationDuration={1400}>
//                   {barData.map((entry,i) => (
//                     <Cell key={`c-${i}`} fill={entry.color}/>
//                   ))}
//                   <defs>
//                     {barData.map((entry,i) => (
//                       <linearGradient key={`g-${i}`} id={`g-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
//                         <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
//                         <stop offset="100%" stopColor={entry.color} stopOpacity={0.65}/>
//                       </linearGradient>
//                     ))}
//                   </defs>
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </section>

//           {/* Radial quick-view grid */}
//           <section style={{ ...S.sec, ...fs(0.24) }}>
//             <h2 style={S.secTitle}>🎯 Quick View — All 10 Principles</h2>
//             <p style={S.secSub}>Click any principle to drill into sub-parameters on the Principles tab.</p>
//             <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center" }}>
//               {pkeys.map(k => (
//                 <div key={k} onClick={()=>{ setSel(k); setTab("principles"); }}
//                   style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 12px",
//                     background:"rgba(255,255,255,0.03)", border:`1px solid ${COLORS[k]||"#00C896"}33`,
//                     borderRadius:14, cursor:"pointer", transition:"all 0.25s", minWidth:100 }}>
//                   <Radial score={prn[k].score} label={k} color={COLORS[k]||"#00C896"} size={76}/>
//                   <div style={{ fontSize:20, marginTop:6 }}>{ICONS[k]}</div>
//                 </div>
//               ))}
//             </div>
//           </section>
//         </>
//       )}

//       {/* ══════════════════════════════════════════════════════════════
//           TAB: PRINCIPLES — Spider + Drill-down + Long Descriptions
//       ══════════════════════════════════════════════════════════════ */}
//       {tab === "principles" && hasPrn && (
//         <>
//           {/* Spider + drill panel */}
//           <section style={{ ...S.sec, ...fs(0.1) }}>
//             <h2 style={S.secTitle}>🕸️ Trusted AI Principles Assessment</h2>
//             <p style={S.secSub}>Hover or click any node to drill into sub-parameters and descriptions.</p>
//             <div style={{ display:"flex", gap:32, flexWrap:"wrap", alignItems:"flex-start", justifyContent:"center" }}>
//               <div style={{ flex:"1 1 500px", minWidth:320 }}>
//                 <Spider principles={prn} onSelect={setSel} selected={sel}/>
//               </div>
//               <div style={{ flex:"1 1 340px", minWidth:300, background:"rgba(0,0,0,0.22)",
//                 border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"24px", minHeight:460 }}>
//                 {!sel ? (
//                   <div>
//                     <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)", textAlign:"center", marginBottom:16 }}>Select a principle to inspect</div>
//                     {pkeys.map(k => {
//                       const c = COLORS[k]||"#00C896"; const sc = prn[k].score;
//                       return (
//                         <div key={k} onClick={()=>setSel(k)}
//                           style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0",
//                             borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" }}>
//                           <span style={{ fontSize:17 }}>{ICONS[k]}</span>
//                           <span style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.75)" }}>{k}</span>
//                           <div style={{ width:70, height:5, background:"rgba(255,255,255,0.08)", borderRadius:3 }}>
//                             <div style={{ width:`${sc}%`, height:"100%", background:c, borderRadius:3 }}/>
//                           </div>
//                           <span style={{ fontSize:13, fontWeight:700, color:c, minWidth:26, textAlign:"right" }}>{sc}</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : selData ? (
//                   <div style={{ animation:"fadeIn 0.3s ease" }}>
//                     <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, paddingBottom:14,
//                       borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
//                       <span style={{ fontSize:28 }}>{ICONS[sel]}</span>
//                       <div style={{ flex:1 }}>
//                         <div style={{ fontSize:17, fontWeight:800, color:"white" }}>{sel}</div>
//                         <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Sub-parameters</div>
//                       </div>
//                       <div style={{ fontSize:32, fontWeight:900, color:COLORS[sel]||"#00C896" }}>{selData.score}</div>
//                     </div>
//                     <div style={{ textAlign:"center", marginBottom:20 }}>
//                       <Radial score={selData.score} label={sel} color={COLORS[sel]||"#00C896"} size={100}/>
//                     </div>
//                     {Object.entries(selData.parameters).map(([param,val]) => {
//                       const v = val as number; const c = COLORS[sel]||"#00C896";
//                       const sl = v>=75?"Good":v>=50?"Fair":"Poor"; const sc2 = v>=75?"#00C896":v>=50?"#ffb020":"#ff4d4d";
//                       return (
//                         <div key={param} style={{ marginBottom:13 }}>
//                           <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
//                             <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", flex:1 }}>{param}</span>
//                             <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700,
//                               color:sc2, background:`${sc2}18`, border:`1px solid ${sc2}44` }}>{sl}</span>
//                             <span style={{ fontSize:13, fontWeight:700, color:c, minWidth:26, textAlign:"right" }}>{v}</span>
//                           </div>
//                           <div style={{ height:6, background:"rgba(255,255,255,0.07)", borderRadius:3 }}>
//                             <div style={{ width:`${v}%`, height:"100%", background:`linear-gradient(90deg,${c}88,${c})`, borderRadius:3 }}/>
//                           </div>
//                         </div>
//                       );
//                     })}
//                     <button onClick={()=>setSel(null)} style={{ marginTop:16, width:"100%", padding:"8px",
//                       background:"transparent", border:`1px solid ${COLORS[sel]||"#00C896"}44`,
//                       color:COLORS[sel]||"#00C896", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:600 }}>
//                       ← Back to All Principles
//                     </button>
//                   </div>
//                 ) : null}
//               </div>
//             </div>
//           </section>

//           {/* Per-principle cards with long descriptions */}
//           <section style={{ ...S.sec, ...fs(0.14) }}>
//             <h2 style={S.secTitle}>📖 Principle-by-Principle Analysis</h2>
//             <p style={S.secSub}>Detailed breakdown and contextual description for each of the 10 KPMG Trusted AI principles.</p>
//             <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//               {pkeys.map(k => {
//                 const data = prn[k]; const c = COLORS[k]||"#00C896";
//                 const isExpanded = expandedPrn === k;
//                 const scoreLabel = data.score>=75?"Compliant":data.score>=55?"Conditional":"Non-Compliant";
//                 const scoreColor = data.score>=75?"#00C896":data.score>=55?"#ffb020":"#ff4d4d";
//                 return (
//                   <div key={k} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${c}22`,
//                     borderRadius:14, padding:"22px 24px", transition:"all 0.3s" }}>
//                     {/* Header row */}
//                     <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12, cursor:"pointer" }}
//                       onClick={()=>setExpandedPrn(isExpanded?null:k)}>
//                       <span style={{ fontSize:26 }}>{ICONS[k]}</span>
//                       <div style={{ flex:1 }}>
//                         <div style={{ fontSize:16, fontWeight:800, color:"white" }}>{k}</div>
//                         <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2, lineHeight:1.4 }}>
//                           {PRINCIPLE_LONG_DESC[k]?.slice(0,100)}…
//                         </div>
//                       </div>
//                       <Radial score={data.score} label="" color={c} size={62}/>
//                       <div style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
//                         background:`${scoreColor}18`, border:`1px solid ${scoreColor}44`, color:scoreColor }}>
//                         {scoreLabel}
//                       </div>
//                       <span style={{ color:"rgba(255,255,255,0.4)", fontSize:18 }}>{isExpanded?"▲":"▼"}</span>
//                     </div>

//                     {isExpanded && (
//                       <div style={{ animation:"fadeIn 0.3s ease" }}>
//                         {/* Long description */}
//                         <div style={{ padding:"14px 16px", background:"rgba(0,0,0,0.2)", borderRadius:10,
//                           fontSize:13, color:"rgba(255,255,255,0.75)", lineHeight:1.75, marginBottom:16,
//                           borderLeft:`3px solid ${c}` }}>
//                           {PRINCIPLE_LONG_DESC[k]}
//                         </div>

//                         {/* Sub-parameters grid */}
//                         <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10, marginBottom:16 }}>
//                           {Object.entries(data.parameters).map(([param,val]) => {
//                             const v = val as number; const sl = v>=75?"Good":v>=50?"Fair":"Poor";
//                             const sc2 = v>=75?"#00C896":v>=50?"#ffb020":"#ff4d4d";
//                             return (
//                               <div key={param} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${sc2}22`,
//                                 borderRadius:10, padding:"12px 14px" }}>
//                                 <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>{param}</div>
//                                 <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, marginBottom:6 }}>
//                                   <div style={{ width:`${v}%`, height:"100%", background:c, borderRadius:3 }}/>
//                                 </div>
//                                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
//                                   <span style={{ fontSize:11, padding:"2px 7px", borderRadius:8, color:sc2,
//                                     background:`${sc2}18`, border:`1px solid ${sc2}44` }}>{sl}</span>
//                                   <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
//                                 </div>
//                               </div>
//                             );
//                           })}
//                         </div>

//                         {/* Bar chart for sub-params */}
//                         <div style={{ height:120 }}>
//                           <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={Object.entries(data.parameters).map(([n,v])=>({ name:n.split(" ").slice(-1)[0], score:v }))}
//                               margin={{ top:5, right:20, left:0, bottom:5 }}>
//                               <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.5)", fontSize:9 }} axisLine={false} tickLine={false}/>
//                               <YAxis domain={[0,100]} tick={{ fill:"rgba(255,255,255,0.3)", fontSize:9 }} axisLine={false} tickLine={false}/>
//                               <Tooltip contentStyle={{ background:"rgba(5,13,26,0.95)", border:`1px solid ${c}44`, borderRadius:8, color:"white", fontSize:11 }}/>
//                               <Bar dataKey="score" fill={c} radius={[4,4,0,0]} barSize={18}/>
//                             </BarChart>
//                           </ResponsiveContainer>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </section>
//         </>
//       )}

//       {/* ══════════════════════════════════════════════════════════════
//           TAB: RISK ANALYSIS
//       ══════════════════════════════════════════════════════════════ */}
//       {tab === "risk" && (
//         <>
//           {/* Risk summary cards */}
//           {ra && (
//             <section style={{ ...S.sec, ...fs(0.1) }}>
//               <h2 style={S.secTitle}>⚠️ Risk Analysis Summary</h2>
//               <p style={S.secSub}>Aggregated risk exposure across all 10 Trusted AI principles.</p>

//               <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
//                 {[
//                   { label:"Overall Risk",     val:ra.overall_risk_level, color:SEV_COLOR(ra.overall_risk_level) },
//                   { label:"Critical Issues",  val:ra.critical_count,     color:"#ff2222" },
//                   { label:"High Issues",      val:ra.high_count,         color:"#ff4d4d" },
//                   { label:"Moderate Issues",  val:ra.moderate_count,     color:"#ffb020" },
//                   { label:"Low Issues",       val:ra.low_count,          color:"#00C896" },
//                   { label:"Average Score",    val:`${ra.average_score}`, color:"#60A5FA" },
//                 ].map((d,i)=>(
//                   <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${d.color}33`,
//                     borderRadius:13, padding:"18px 14px", textAlign:"center" }}>
//                     <div style={{ fontSize:24, fontWeight:900, color:d.color }}>{d.val}</div>
//                     <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:6 }}>{d.label}</div>
//                   </div>
//                 ))}
//               </div>

//               {/* Risk bars + pie side by side */}
//               <div style={{ display:"flex", gap:28, flexWrap:"wrap", alignItems:"flex-start" }}>
//                 {/* Risk table */}
//                 <div style={{ flex:"2 1 400px" }}>
//                   <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.7)", marginBottom:12 }}>
//                     Risk per Principle (sorted by severity)
//                   </div>
//                   {ra.risk_items.map((item,i) => (
//                     <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
//                       borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
//                       <span style={{ fontSize:17, minWidth:20 }}>{ICONS[item.principle]}</span>
//                       <span style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.8)" }}>{item.principle}</span>
//                       <div style={{ width:120, height:6, background:"rgba(255,255,255,0.08)", borderRadius:3 }}>
//                         <div style={{ width:`${item.score}%`, height:"100%", background:item.color, borderRadius:3 }}/>
//                       </div>
//                       <span style={{ fontSize:13, fontWeight:700, color:item.color, minWidth:28, textAlign:"right" }}>{item.score}</span>
//                       <span style={{ fontSize:11, padding:"2px 9px", borderRadius:10, fontWeight:700,
//                         color:item.color, background:`${item.color}18`, border:`1px solid ${item.color}44`, minWidth:70, textAlign:"center" }}>
//                         {item.severity}
//                       </span>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Pie chart */}
//                 {riskPie.length > 0 && (
//                   <div style={{ flex:"1 1 240px", textAlign:"center" }}>
//                     <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Risk Distribution</div>
//                     <ResponsiveContainer width="100%" height={220}>
//                       <PieChart>
//                         <Pie data={riskPie} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({name,value})=>`${name}: ${value}`}
//                           labelLine={{ stroke:"rgba(255,255,255,0.3)" }}>
//                           {riskPie.map((_,i) => <Cell key={i} fill={riskPie[i].fill}/>)}
//                         </Pie>
//                         <Tooltip contentStyle={{ background:"rgba(5,13,26,0.95)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, color:"white" }}/>
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 )}
//               </div>

//               {/* Data risks */}
//               <div style={{ marginTop:24, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
//                 {[
//                   { label:"Data Volume Risk",  val:ra.data_volume_risk,   icon:"📊" },
//                   { label:"Missing Data Risk",  val:ra.missing_data_risk,  icon:"❌" },
//                 ].map((d,i) => {
//                   const c = d.val.startsWith("High")?"#ff4d4d":d.val.startsWith("Moderate")?"#ffb020":"#00C896";
//                   return (
//                     <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${c}33`, borderRadius:12, padding:"16px" }}>
//                       <div style={{ fontSize:13, fontWeight:700, color:c, marginBottom:8 }}>{d.icon} {d.label}</div>
//                       <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.5 }}>{d.val}</div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Worst-sub-param table */}
//               <div style={{ marginTop:24 }}>
//                 <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.7)", marginBottom:12 }}>
//                   Highest-Risk Sub-Parameters
//                 </div>
//                 <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:10 }}>
//                   {ra.risk_items.filter(r=>r.severity!=="Low").map((item,i)=>(
//                     <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${item.color}33`,
//                       borderRadius:10, padding:"14px 16px" }}>
//                       <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
//                         <span style={{ fontSize:13, fontWeight:700, color:item.color }}>{ICONS[item.principle]} {item.principle}</span>
//                         <span style={{ fontSize:11, color:item.color }}>{item.severity}</span>
//                       </div>
//                       <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>
//                         Worst: <span style={{ color:"rgba(255,255,255,0.75)" }}>{item.worst_param}</span> ({item.worst_val}/100)
//                       </div>
//                       <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Gap to 100: {item.gap} points</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </section>
//           )}

//           {/* Line chart — score profile */}
//           {hasPrn && (
//             <section style={{ ...S.sec, ...fs(0.14) }}>
//               <h2 style={S.secTitle}>📈 Principle Score Profile</h2>
//               <p style={S.secSub}>Score landscape across all 10 principles with threshold lines.</p>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={pkeys.map(k=>({ name:k, score:prn[k].score }))}
//                   margin={{ top:10, right:30, left:0, bottom:60 }}>
//                   <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.07)"/>
//                   <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.55)", fontSize:10 }} angle={-35} textAnchor="end" interval={0}/>
//                   <YAxis domain={[0,100]} tick={{ fill:"rgba(255,255,255,0.45)", fontSize:11 }}/>
//                   <Tooltip contentStyle={{ background:"rgba(5,13,26,0.95)", border:"1px solid rgba(0,200,150,0.4)", borderRadius:10, color:"white" }}/>
//                   <Line type="monotone" dataKey="score" stroke="#00C896" strokeWidth={2.5} dot={{ fill:"#00C896", r:5 }} activeDot={{ r:8 }}/>
//                 </LineChart>
//               </ResponsiveContainer>
//             </section>
//           )}
//         </>
//       )}

//       {/* ══════════════════════════════════════════════════════════════
//           TAB: DIAGNOSTICS
//       ══════════════════════════════════════════════════════════════ */}
//       {tab === "diagnostics" && (
//         <section style={{ ...S.sec, ...fs(0.1) }}>
//           <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
//           <p style={S.secSub}>Structural analysis of the ingested dataset used for this evaluation.</p>
//           <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:14, marginBottom:24 }}>
//             {[
//               { icon:"❌", label:"Missing Ratio",    val:`${(r.diagnostics.missing_ratio*100).toFixed(1)}%`,       c:r.diagnostics.missing_ratio<0.05?"#00C896":r.diagnostics.missing_ratio<0.15?"#ffb020":"#ff4d4d" },
//               { icon:"🔁", label:"Duplicates",        val:r.diagnostics.duplicates,                                 c:r.diagnostics.duplicates===0?"#00C896":"#ffb020" },
//               { icon:"🧩", label:"Schema Confidence", val:`${Math.round(r.diagnostics.schema_confidence*100)}%`,   c:"#60A5FA" },
//               { icon:"📐", label:"Total Columns",     val:r.diagnostics.total_columns,                              c:"#A78BFA" },
//               { icon:"📝", label:"Text Columns",      val:r.diagnostics.text_columns,                               c:"#00E5A0" },
//               { icon:"🔢", label:"Numeric Columns",   val:r.diagnostics.numeric_columns,                            c:"#FBBF24" },
//               { icon:"📦", label:"Total Records",     val:r.logs_evaluated,                                         c:"#34D399" },
//               { icon:"📊", label:"Data Quality",      val:`${r.data_quality_score}%`,                               c:r.data_quality_score>=80?"#00C896":r.data_quality_score>=60?"#ffb020":"#ff4d4d" },
//             ].map((d,i) => (
//               <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${d.c}33`,
//                 borderRadius:13, padding:"18px 14px", textAlign:"center", display:"flex", flexDirection:"column", gap:5, alignItems:"center" }}>
//                 <span style={{ fontSize:24 }}>{d.icon}</span>
//                 <div style={{ fontSize:22, fontWeight:800, color:d.c }}>{d.val}</div>
//                 <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{d.label}</div>
//               </div>
//             ))}
//           </div>

//           {/* Column names */}
//           {r.diagnostics.column_names?.length > 0 && (
//             <div style={{ padding:"18px", background:"rgba(0,0,0,0.2)", borderRadius:12, marginBottom:20 }}>
//               <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Detected columns ({r.diagnostics.column_names.length}):</div>
//               <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
//                 {r.diagnostics.column_names.map((col,i) => (
//                   <span key={i} style={{ padding:"4px 12px", background:"rgba(255,255,255,0.06)",
//                     border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, fontSize:12, color:"rgba(255,255,255,0.65)" }}>
//                     {col}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Data quality bars */}
//           <div style={{ marginTop:8 }}>
//             <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.7)", marginBottom:12 }}>Data Quality Metrics</div>
//             {[
//               { label:"Completeness",       val: Math.round((1-r.diagnostics.missing_ratio)*100), color:"#00C896" },
//               { label:"Schema Confidence",  val: Math.round(r.diagnostics.schema_confidence*100), color:"#60A5FA" },
//               { label:"Duplicate-Free Rate",val: Math.round(Math.max(0,100-(r.diagnostics.duplicates/Math.max(r.logs_evaluated,1))*500)), color:"#A78BFA" },
//               { label:"Overall Quality",    val: r.data_quality_score, color:"#FFB020" },
//             ].map((m,i) => (
//               <div key={i} style={{ marginBottom:12 }}>
//                 <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
//                   <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{m.label}</span>
//                   <span style={{ fontSize:13, fontWeight:700, color:m.color }}>{m.val}%</span>
//                 </div>
//                 <div style={{ height:8, background:"rgba(255,255,255,0.07)", borderRadius:4 }}>
//                   <div style={{ width:`${m.val}%`, height:"100%", background:m.color, borderRadius:4, transition:"width 1s ease" }}/>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ══════════════════════════════════════════════════════════════
//           TAB: FINDINGS
//       ══════════════════════════════════════════════════════════════ */}
//       {tab === "findings" && (
//         <>
//           <section style={{ ...S.sec, ...fs(0.1) }}>
//             <h2 style={S.secTitle}>
//               ⚠️ Audit Findings
//               {(r.findings?.length||0)>0 && (
//                 <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
//                   width:26, height:26, background:"#ff4d4d22", border:"1px solid #ff4d4d55",
//                   color:"#ff4d4d", borderRadius:"50%", fontSize:13, fontWeight:700, marginLeft:12 }}>
//                   {r.findings.length}
//                 </span>
//               )}
//             </h2>
//             <p style={S.secSub}>Governance gaps identified during evaluation, sorted by severity.</p>
//             {!r.findings?.length ? (
//               <div style={{ padding:24, background:"rgba(0,200,150,0.07)", border:"1px solid rgba(0,200,150,0.25)", borderRadius:12, color:"#00C896" }}>
//                 ✅ No critical findings. Dataset aligns well with KPMG Trusted AI standards.
//               </div>
//             ) : (
//               <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
//                 {r.findings.map((f,i) => {
//                   const sc = f.severity==="High"?"#ff4d4d":f.severity==="Medium"?"#ffb020":"#00C896";
//                   return (
//                     <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${sc}33`, borderRadius:14, padding:"20px 22px" }}>
//                       <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
//                         <span style={{ fontSize:13, fontWeight:700, color:COLORS[f.category]||"#fff",
//                           textTransform:"uppercase", letterSpacing:"0.07em" }}>
//                           {ICONS[f.category]||"📌"} {f.category}
//                         </span>
//                         <span style={{ padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700,
//                           color:sc, background:`${sc}18`, border:`1px solid ${sc}44` }}>{f.severity}</span>
//                       </div>
//                       <p style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:8, lineHeight:1.6 }}>{f.issue}</p>
//                       <div style={{ padding:"10px 14px", background:"rgba(255,176,32,0.06)", border:"1px solid rgba(255,176,32,0.18)",
//                         borderRadius:8, fontSize:13, color:"rgba(255,255,255,0.6)", fontStyle:"italic", lineHeight:1.55 }}>
//                         💡 {f.recommendation}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </section>

//           {/* Overall recommendation */}
//           {r.recommendation && (
//             <section style={{ ...S.sec, ...fs(0.14) }}>
//               <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
//               <div style={{ display:"flex", gap:14, padding:"18px", background:"rgba(255,176,32,0.05)",
//                 border:"1px solid rgba(255,176,32,0.2)", borderRadius:12, alignItems:"flex-start" }}>
//                 <span style={{ fontSize:22 }}>💡</span>
//                 <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.7 }}>{r.recommendation}</p>
//               </div>
//             </section>
//           )}
//         </>
//       )}

//       {/* ── DOWNLOAD FOOTER ──────────────────────────────────────── */}
//       <section style={{ ...S.sec, ...fs(0.18), textAlign:"center", padding:"40px 24px" }}>
//         <h2 style={{ fontSize:22, fontWeight:800, marginBottom:12, color:"#EAF2FB" }}>Download Comprehensive PDF Report</h2>
//         <p style={{ color:"rgba(255,255,255,0.6)", marginBottom:24, maxWidth:600, margin:"0 auto 24px", fontSize:14, lineHeight:1.65 }}>
//           Export this governance audit report as a structured PDF document including all principles, findings, and framework compliance mappings.
//         </p>
//         <div style={{ display:"flex", gap:18, justifyContent:"center", flexWrap:"wrap" }}>
//           <button onClick={handleDownloadPDF} disabled={pdfLoading}
//             style={{ padding:"14px 40px", fontSize:15, fontWeight:700, borderRadius:12, border:"none",
//               background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg,#00C896,#0091DA)",
//               color:"white", cursor: pdfLoading ? "not-allowed" : "pointer" }}>
//             {pdfLoading ? "⏳ Preparing PDF…" : "⬇ Download PDF Report"}
//           </button>
//           <button onClick={()=>navigate("/dashboard")}
//             style={{ padding:"14px 40px", fontSize:15, fontWeight:600, borderRadius:12,
//               border:"1px solid rgba(255,255,255,0.2)", background:"transparent",
//               color:"rgba(255,255,255,0.8)", cursor:"pointer" }}>
//             ← Back to Dashboard
//           </button>
//         </div>
//       </section>

//       <footer style={{ textAlign:"center", padding:"32px 20px 50px", color:"rgba(255,255,255,0.25)", fontSize:12,
//         position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:32 }}>
//         <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:10 }}>
//           {["EU AI Act","ISO/IEC 42001:2023","NIST AI RMF","KPMG Trusted AI Framework"].map(f => (
//             <span key={f} style={{ padding:"3px 12px", background:"rgba(255,255,255,0.04)",
//               border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, fontSize:11, color:"rgba(255,255,255,0.35)" }}>{f}</span>
//           ))}
//         </div>
//         Report ID: {r.report_id} · Auditable AI™ · Powered by KPMG Trusted AI Framework
//       </footer>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
//         @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
//         * { box-sizing:border-box; margin:0; padding:0; }
//       `}</style>
//     </div>
//   );
// }

// /* ─── Styles ─────────────────────────────────────────────────────────── */
// const S: Record<string, React.CSSProperties> = {
//   page:     { minHeight:"100vh", background:"#050d1a", fontFamily:"'DM Sans',sans-serif", color:"white", paddingBottom:80, position:"relative", overflowX:"hidden" },
//   bg:       { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse 90% 60% at 15% 10%,rgba(0,100,200,0.11) 0%,transparent 65%),radial-gradient(ellipse 70% 50% at 85% 85%,rgba(0,200,150,0.08) 0%,transparent 65%)" },
//   header:   { position:"relative", zIndex:1, padding:"32px 40px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:18 },
//   logo:     { fontSize:20, fontWeight:900, background:"linear-gradient(135deg,#00C8FF,#00C896)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
//   kBadge:   { fontSize:11, padding:"3px 12px", background:"rgba(0,51,141,0.45)", border:"1px solid rgba(0,51,141,0.65)", borderRadius:20, color:"#60A5FA" },
//   title:    { fontSize:30, fontWeight:900, color:"white", letterSpacing:"-0.02em", margin:"6px 0 8px" },
//   meta:     { display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", fontSize:13, color:"rgba(255,255,255,0.5)" },
//   dot:      { color:"rgba(255,255,255,0.2)" },
//   backBtn:  { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", padding:"10px 22px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600 },
//   pdfBtn:   { background:"linear-gradient(135deg,#0091DA,#00C896)", border:"none", color:"white", padding:"10px 22px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 },
//   heroRow:  { position:"relative", zIndex:1, display:"flex", gap:20, padding:"28px 40px", alignItems:"stretch", flexWrap:"wrap", borderBottom:"1px solid rgba(255,255,255,0.06)" },
//   heroScore:{ textAlign:"center", padding:"28px 36px", background:"rgba(255,255,255,0.04)", border:"2px solid", borderRadius:20, minWidth:190, flexShrink:0, boxShadow:"0 8px 24px rgba(0,0,0,0.25)" },
//   riskPill: { display:"inline-block", padding:"5px 16px", borderRadius:20, fontSize:13, fontWeight:700, marginTop:10 },
//   statsRow: { display:"flex", gap:10, flexWrap:"wrap", flex:1 },
//   statCard: { flex:"1 1 110px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"14px", textAlign:"center", display:"flex", flexDirection:"column", gap:5 },
//   sec:      { position:"relative", zIndex:1, margin:"28px 40px", background:"rgba(255,255,255,0.028)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:"28px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" },
//   secTitle: { fontSize:20, fontWeight:800, color:"white", marginBottom:8 },
//   secSub:   { fontSize:13, color:"rgba(255,255,255,0.42)", marginBottom:22, lineHeight:1.5 },
//   fwCard:   { flex:"1 1 165px", background:"rgba(255,255,255,0.03)", border:"1px solid", borderRadius:14, padding:"20px 16px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:2 },
//   fwPill:   { marginTop:10, padding:"4px 14px", borderRadius:20, fontSize:11, fontWeight:700 },
//   fwNote:   { marginTop:16, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10 },
// };

import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Principle { score: number; parameters: Record<string, number>; }
interface ReportData {
  report_id: string;
  ai_name: string;
  model_type: string;
  evaluated_at: string;
  overall_score: number;
  risk_level: string;
  structural_risk: string;
  logs_evaluated: number;
  data_quality_score: number;
  trusted_ai_principles: Record<string, Principle>;
  diagnostics: {
    missing_ratio: number;
    duplicates: number;
    schema_confidence: number;
    total_columns: number;
    text_columns: number;
    numeric_columns: number;
    column_names: string[];
  };
  findings: { category: string; severity: string; issue: string; recommendation: string }[];
  recommendation: string;
  framework_compliance: Record<string, string>;
}

const ICONS: Record<string, string> = {
  Transparency: "🔍", Explainability: "💡", Fairness: "⚖️", Accountability: "📋",
  "Data Integrity": "🗄️", Reliability: "⚙️", Security: "🔒", Privacy: "🛡️",
  Sustainability: "🌱", "Human-Centricity": "👤"
};

const COLORS: Record<string, string> = {
  Transparency: "#00C8FF", Explainability: "#00E5A0", Fairness: "#FF6B9D",
  Accountability: "#FFB020", "Data Integrity": "#A78BFA", Reliability: "#34D399",
  Security: "#F87171", Privacy: "#60A5FA", Sustainability: "#4ADE80",
  "Human-Centricity": "#FBBF24"
};

const FW: Record<string, { label: string; icon: string; desc: string }> = {
  EU_AI_Act: { label: "EU AI Act", icon: "🇪🇺", desc: "European Union AI Regulation" },
  ISO_42001: { label: "ISO 42001", icon: "🏅", desc: "AI Management System Standard" },
  NIST_AI_RMF: { label: "NIST AI RMF", icon: "🏛️", desc: "AI Risk Management Framework" },
  KPMG_TAF: { label: "KPMG Trusted AI", icon: "🔷", desc: "Trusted AI Framework" },
};

const CC: Record<string, string> = {
  Compliant: "#00C896", "Certified Ready": "#00C896", Aligned: "#00C896",
  Conditional: "#ffb020", Assessed: "#60A5FA", Partial: "#ff4d4d"
};

function fmt(k: string) {
  return String(k ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function Spider({ principles, onSelect, selected }: { principles: Record<string, Principle>; onSelect: (k: string | null) => void; selected: string | null }) {
  const keys = Object.keys(principles);
  const N = keys.length;
  const cx = 280, cy = 280, R = 200;

  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, v: number) => ({
    x: cx + (v / 100) * R * Math.cos(ang(i)),
    y: cy + (v / 100) * R * Math.sin(ang(i)),
  });
  const lp = (i: number) => {
    const r = R + 50;
    return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) };
  };

  const poly = keys.map((k, i) => pt(i, principles[k].score));
  const polyStr = poly.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 600 600" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
      {[20, 40, 60, 80, 100].map(lvl => (
        <polygon
          key={lvl}
          points={keys.map((_, i) => pt(i, lvl)).map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
      ))}
      {keys.map((_, i) => {
        const e = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}
      <polygon points={polyStr} fill="rgba(0,200,150,0.15)" stroke="rgba(0,200,150,0.65)" strokeWidth="3" strokeLinejoin="round" />
      {[20, 40, 60, 80, 100].map(lvl => (
        <text key={`t${lvl}`} x={cx + 8} y={cy - (lvl / 100) * R + 5} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="start">{lvl}</text>
      ))}
      {poly.map((p, i) => {
        const k = keys[i];
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={sel ? 14 : 7}
            fill={c}
            stroke={sel ? "#fff" : "rgba(255,255,255,0.4)"}
            strokeWidth={sel ? 4 : 2}
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              filter: sel ? "drop-shadow(0 0 12px #00C896)" : "drop-shadow(0 0 4px rgba(0,200,150,0.3))",
            }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => sel || onSelect(null)}
          />
        );
      })}
      {keys.map((k, i) => {
        const lpos = lp(i);
        const c = COLORS[k] || "#00C896";
        const sel = selected === k;
        const parts = k.split(" ");
        const sc = principles[k].score;
        return (
          <g
            key={k}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(sel ? null : k)}
            onMouseEnter={() => onSelect(k)}
            onMouseLeave={() => sel || onSelect(null)}
          >
            {parts.map((pt2, pi) => (
              <text
                key={pi}
                x={lpos.x}
                y={lpos.y + (pi - parts.length / 2) * 16}
                textAnchor="middle"
                fill={sel ? c : "rgba(255,255,255,0.8)"}
                fontSize={sel ? "13" : "11"}
                fontWeight={sel ? "800" : "500"}
                fontFamily="'DM Sans',sans-serif"
                style={{ transition: "all 0.3s ease" }}
              >
                {pt2}
              </text>
            ))}
            <text
              x={lpos.x}
              y={lpos.y + (parts.length / 2) * 16 + 6}
              textAnchor="middle"
              fill={c}
              fontSize="12"
              fontWeight="900"
              fontFamily="'DM Sans',sans-serif"
            >
              {sc}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={50} fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900" fontFamily="'DM Sans',sans-serif">
        {Math.round(Object.values(principles).reduce((s, v) => s + v.score, 0) / N)}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="'DM Sans',sans-serif">
        OVERALL
      </text>
    </svg>
  );
}

function ImprovedBarChart({ principles }: { principles: Record<string, Principle> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const entries = Object.entries(principles).map(([name, data]) => ({
    name,
    score: data.score,
    color: COLORS[name] || "#00C896",
  }));

  return (
    <div style={{ padding: "20px 0", overflowX: "auto" }}>
      <ResponsiveContainer width="100%" height={Math.max(entries.length * 70 + 60, 260)}>
        <BarChart
          data={entries}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 160, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}
            width={150}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,200,150,0.1)" }}
            contentStyle={{
              background: "rgba(10,30,66,0.96)",
              border: "1px solid rgba(0,200,150,0.45)",
              borderRadius: 12,
              padding: "14px 18px",
              color: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 10, 10, 0]}
            barSize={28}
            animationDuration={1600}
            animationEasing="easeOutCubic"
          >
            {entries.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#grad-${index})`}
                style={{
                  transition: "all 0.35s ease",
                  filter: hovered === entry.name ? "brightness(1.3) drop-shadow(0 0 14px currentColor)" : "none",
                  transform: hovered === entry.name ? "scale(1.08)" : "scale(1)",
                  transformOrigin: "left center",
                }}
                onMouseEnter={() => setHovered(entry.name)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </Bar>
          <defs>
            {entries.map((entry, i) => (
              <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Radial({ score, label, color, size = 90 }: { score: number; label: string; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.09} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.4s ease" }}
        />
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize={size * 0.24} fontWeight="900" fontFamily="'DM Sans',sans-serif">
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const r: ReportData = location.state?.data;
  const [sel, setSel] = useState<string | null>(null);
  const [anim, setAnim] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnim(true), 150);
  }, []);

  if (!r) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050d1a", gap: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}>No report data found.</p>
        <button
          style={{
            padding: "14px 32px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const prn = r.trusted_ai_principles || {};
  const pkeys = Object.keys(prn);
  const hasPrn = pkeys.length > 0;
  const rc = r.risk_level === "Low" ? "#00C896" : r.risk_level === "Moderate" ? "#ffb020" : "#ff4d4d";
  const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const selData = sel ? prn[sel] : null;

  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: anim ? 1 : 0,
    transform: anim ? "translateY(0)" : "translateY(24px)",
    transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

 const handleDownloadPDF = async () => {
  setPdfLoading(true);

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to download reports. Redirecting to login...");
      navigate("/login");
      return;
    }

    if (!r.report_id) {
      alert("No report ID found. Please complete an evaluation first.");
      return;
    }

    const response = await fetch(`http://localhost:8000/reports/${r.report_id}/pdf`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/pdf",
      },
    });

    if (!response.ok) {
      let errorDetail = "Unknown error";
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errorDetail;
      } catch {}
      throw new Error(`Download failed: ${response.status} - ${errorDetail}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Audit_Report_${r.report_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

  } catch (err: any) {
    console.error("PDF download error:", err);
    alert(err.message || "Failed to download PDF. Check if you're logged in and report exists.");
  } finally {
    setPdfLoading(false);
  }
};

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "#050d1a",
      fontFamily: "'DM Sans',sans-serif",
      color: "white",
      padding: "40px 20px 100px",
      position: "relative",
      overflowX: "hidden",
    },
    bg: {
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 90% 60% at 15% 10%, rgba(0,100,200,0.12) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 85% 85%, rgba(0,200,150,0.09) 0%, transparent 65%)",
    },
    header: {
      position: "relative",
      zIndex: 1,
      padding: "32px 40px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 20,
    },
    logo: {
      fontSize: 20,
      fontWeight: 900,
      background: "linear-gradient(135deg, #00C8FF, #00C896)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    kBadge: {
      fontSize: 11,
      padding: "3px 12px",
      background: "rgba(0,51,141,0.45)",
      border: "1px solid rgba(0,51,141,0.65)",
      borderRadius: 20,
      color: "#60A5FA",
    },
    title: {
      fontSize: 32,
      fontWeight: 900,
      color: "white",
      letterSpacing: "-0.02em",
      margin: "6px 0 10px",
    },
    meta: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
    },
    dot: { color: "rgba(255,255,255,0.25)" },
    backBtn: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.75)",
      padding: "10px 24px",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      transition: "all 0.3s",
    },
    heroRow: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      gap: 24,
      padding: "32px 40px",
      alignItems: "stretch",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    heroScore: {
      textAlign: "center",
      padding: "32px 40px",
      background: "rgba(255,255,255,0.04)",
      border: "2px solid",
      borderRadius: 20,
      minWidth: 200,
      flexShrink: 0,
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    },
    riskPill: {
      display: "inline-block",
      padding: "5px 16px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 700,
      marginTop: 12,
    },
    statsRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      flex: 1,
    },
    statCard: {
      flex: "1 1 130px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 14,
      padding: "16px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    },
    sec: {
      position: "relative",
      zIndex: 1,
      margin: "32px 40px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: "32px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    },
    secTitle: {
      fontSize: 22,
      fontWeight: 800,
      color: "white",
      marginBottom: 10,
    },
    secSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.45)",
      marginBottom: 24,
      lineHeight: 1.5,
    },
    spiderWrap: {
      display: "flex",
      gap: 32,
      flexWrap: "wrap",
      alignItems: "flex-start",
      justifyContent: "center",
    },
    drillPanel: {
      flex: "1 1 320px",
      minHeight: 420,
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.bg} />

      {/* HEADER */}
      <div style={{ ...S.header, ...fadeStyle(0) }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={S.logo}>Auditable AI™</span>
            <span style={S.kBadge}>⬡ KPMG Trusted AI Framework</span>
          </div>
          <h1 style={S.title}>Governance Audit Report</h1>
          <div style={S.meta}>
            <span>📌 {r.ai_name}</span><span style={S.dot}> · </span>
            <span>🧠 {r.model_type}</span><span style={S.dot}> · </span>
            <span>📅 {fmt(r.evaluated_at)}</span><span style={S.dot}> · </span>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              ID: {r.report_id?.slice(0, 12)}…
            </span>
          </div>
        </div>
        <button
          style={S.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* HERO SCORE */}
      <div style={{ ...S.heroRow, ...fadeStyle(0.1) }}>
        <div style={{ ...S.heroScore, borderColor: `${rc}55` }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: rc, lineHeight: 1 }}>
            {r.overall_score}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>/ 100</div>
          <div style={{ ...S.riskPill, background: `${rc}22`, border: `1px solid ${rc}66`, color: rc }}>
            {r.risk_level} Risk
          </div>
        </div>

        <div style={S.statsRow}>
          {[
            { icon: "📂", label: "Logs Evaluated", val: r.logs_evaluated },
            { icon: "📊", label: "Data Quality", val: `${r.data_quality_score}%` },
            { icon: "🏗️", label: "Structural Risk", val: r.structural_risk },
            { icon: "✅", label: "Principles Tested", val: pkeys.length },
            { icon: "⚠️", label: "Findings", val: r.findings?.length || 0 },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "white" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FRAMEWORK COMPLIANCE */}
      <section style={{ ...S.sec, ...fadeStyle(0.15) }}>
        <h2 style={S.secTitle}>🏛️ Regulatory & Framework Compliance</h2>
        <p style={S.secSub}>Assessment against major AI governance standards.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(r.framework_compliance || {}).map(([key, status]) => {
            const fw = FW[key] || { label: key, icon: "📋", desc: "" };
            const sc = CC[status] || "#aaa";
            return (
              <div key={key} style={{ ...S.fwCard, borderColor: `${sc}55`, minWidth: 180 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{fw.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{fw.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "6px 0" }}>{fw.desc}</div>
                <div style={{ ...S.fwPill, background: `${sc}22`, border: `1px solid ${sc}66`, color: sc }}>
                  {status}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...S.fwNote, marginTop: 24, fontSize: 12 }}>
          <span style={{ opacity: 0.5 }}>ℹ️</span>
          <span style={{ marginLeft: 10, lineHeight: 1.6 }}>
            EU AI Act • ISO/IEC 42001:2023 • NIST AI RMF • KPMG Trusted AI Framework
          </span>
        </div>
      </section>

      {/* SIDE-BY-SIDE PRINCIPLES ASSESSMENT */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.2), padding: "40px" }}>
          <h2 style={{ ...S.secTitle, fontSize: 26, marginBottom: 16 }}>🕸️ Trusted AI Principles Assessment</h2>
          <p style={{ ...S.secSub, marginBottom: 32 }}>Hover or click any principle to see sub-parameter details.</p>

          <div style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "center",
          }}>
            {/* Left: Spider Chart */}
            <div style={{ flex: "1 1 500px", minWidth: 320 }}>
              <Spider principles={prn} onSelect={setSel} selected={sel} />
            </div>

            {/* Right: Drill-down / List */}
            <div style={{
              flex: "1 1 360px",
              minWidth: 320,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "28px",
              minHeight: 460,
            }}>
              {!sel ? (
                <div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 20 }}>
                    Select a principle to view breakdown
                  </div>
                  {pkeys.map(k => {
                    const c = COLORS[k] || "#00C896";
                    const sc = prn[k].score;
                    return (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => setSel(k)}
                      >
                        <span style={{ fontSize: 18 }}>{ICONS[k]}</span>
                        <span style={{ flex: 1, fontSize: 14 }}>{k}</span>
                        <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                          <div style={{ width: `${sc}%`, height: "100%", background: c, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{sc}</span>
                      </div>
                    );
                  })}
                </div>
              ) : selData ? (
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 28 }}>{ICONS[sel]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{sel}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Sub-parameters</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: COLORS[sel] || "#00C896" }}>
                      {selData.score}
                    </div>
                  </div>

                  <div style={{ margin: "24px 0", textAlign: "center" }}>
                    <Radial score={selData.score} label={sel} color={COLORS[sel] || "#00C896"} size={110} />
                  </div>

                  {Object.entries(selData.parameters).map(([param, val]) => {
                    const v = val as number;
                    const c = COLORS[sel] || "#00C896";
                    const sl = v >= 75 ? "Good" : v >= 50 ? "Fair" : "Poor";
                    const sc2 = v >= 75 ? "#00C896" : v >= 50 ? "#ffb020" : "#ff4d4d";
                    return (
                      <div key={param} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{param}</span>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, color: sc2, background: `${sc2}15`, border: `1px solid ${sc2}40` }}>
                            {sl}
                          </span>
                        </div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                          <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 4 }} />
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12, color: c, marginTop: 4 }}>{v}</div>
                      </div>
                    );
                  })}

                  <button
                    style={{
                      marginTop: 24,
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      border: `1px solid ${COLORS[sel] || "#00C896"}50`,
                      color: COLORS[sel] || "#00C896",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onClick={() => setSel(null)}
                  >
                    ← Back to All Principles
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* BAR CHART */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.25) }}>
          <h2 style={S.secTitle}>📊 Principle Score Distribution</h2>
          <p style={S.secSub}>Hover bars for details.</p>
          <ImprovedBarChart principles={prn} />
        </section>
      )}

      {/* RADIAL GRID */}
      {hasPrn && (
        <section style={{ ...S.sec, ...fadeStyle(0.3) }}>
          <h2 style={S.secTitle}>🎯 Quick View – All Principles</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
            {pkeys.map(k => (
              <div
                key={k}
                style={{
                  ...S.radCard,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onClick={() => setSel(k)}
              >
                <Radial score={prn[k].score} label={k} color={COLORS[k] || "#00C896"} size={80} />
                <div style={{ fontSize: 16, marginTop: 8 }}>{ICONS[k]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DIAGNOSTICS */}
      <section style={{ ...S.sec, ...fadeStyle(0.35) }}>
        <h2 style={S.secTitle}>🔬 Dataset Diagnostics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { icon: "❌", label: "Missing Ratio", val: `${(r.diagnostics.missing_ratio * 100).toFixed(1)}%`, c: r.diagnostics.missing_ratio < 0.1 ? "#00C896" : "#ff4d4d" },
            { icon: "🔁", label: "Duplicates", val: r.diagnostics.duplicates, c: r.diagnostics.duplicates === 0 ? "#00C896" : "#ffb020" },
            { icon: "🧩", label: "Schema Confidence", val: `${Math.round(r.diagnostics.schema_confidence * 100)}%`, c: "#60A5FA" },
            { icon: "📐", label: "Total Columns", val: r.diagnostics.total_columns, c: "#A78BFA" },
            { icon: "📝", label: "Text Columns", val: r.diagnostics.text_columns, c: "#00E5A0" },
            { icon: "🔢", label: "Numeric Columns", val: r.diagnostics.numeric_columns, c: "#FBBF24" },
          ].map((d, i) => (
            <div key={i} style={{ ...S.diagCard, borderColor: `${d.c}44` }}>
              <span style={{ fontSize: 26 }}>{d.icon}</span>
              <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.label}</div>
            </div>
          ))}
        </div>
        {r.diagnostics.column_names?.length > 0 && (
          <div style={{ marginTop: 24, padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Detected columns:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {r.diagnostics.column_names.map((col, i) => (
                <span key={i} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 12 }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINDINGS */}
      <section style={{ ...S.sec, ...fadeStyle(0.4) }}>
        <h2 style={S.secTitle}>
          ⚠️ Audit Findings {(r.findings?.length || 0) > 0 && <span style={{ color: "#ff4d4d", fontWeight: 700 }}>({r.findings.length})</span>}
        </h2>
        {!r.findings?.length ? (
          <div style={{ padding: 24, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 12, color: "#00C896" }}>
            ✅ No critical findings. Dataset aligns well with standards.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {r.findings.map((f, i) => {
              const sc = f.severity === "High" ? "#ff4d4d" : f.severity === "Medium" ? "#ffb020" : "#00C896";
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${sc}33`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: COLORS[f.category] || "white", fontWeight: 600 }}>
                      {ICONS[f.category] || "•"} {f.category}
                    </span>
                    <span style={{ color: sc, fontWeight: 700 }}>{f.severity}</span>
                  </div>
                  <p style={{ margin: "8px 0", color: "rgba(255,255,255,0.85)" }}>{f.issue}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>💡 {f.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RECOMMENDATION */}
      {r.recommendation && (
        <section style={{ ...S.sec, ...fadeStyle(0.45) }}>
          <h2 style={S.secTitle}>📌 Overall Recommendation</h2>
          <div style={{ padding: 20, background: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.25)", borderRadius: 12 }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>{r.recommendation}</p>
          </div>
        </section>
      )}

      {/* PDF DOWNLOAD SECTION */}
      <section style={{ ...S.sec, ...fadeStyle(0.5), textAlign: "center" }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Need a Comprehensive Report?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
          Download full PDF with summary, evidence, and roadmap.
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "12px 36px",
              background: pdfLoading ? "rgba(0,200,150,0.4)" : "linear-gradient(135deg, #00C896, #0091DA)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontWeight: 600,
              cursor: pdfLoading ? "not-allowed" : "pointer",
              minWidth: 220,
            }}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Preparing PDF..." : "Download Full PDF Report"}
          </button>
          <button
            style={{
              padding: "12px 36px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 20px 60px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        Report ID: {r.report_id} · Auditable AI™ · KPMG Trusted AI Framework
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:none } }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>
    </div>
  );
}