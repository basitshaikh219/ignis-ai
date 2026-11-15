import {W,D} from "./data/profiles.js";
import {QA} from "./data/kb.js";
import {R,E,NR,VER,citeKey} from "./data/records.js";
const wt={crew:3,model:3,equip:3,earth:1};
const $=id=>document.getElementById(id);
let sel="saffire";
const wbox=$("weights");
W.forEach(([l,k])=>{wbox.insertAdjacentHTML("beforeend",`<label>${l}: <span id="v_${k}">${wt[k]}</span><input type="range" min="0" max="5" value="${wt[k]}" data-k="${k}"></label>`)});
wbox.addEventListener("input",e=>{const k=e.target.dataset.k;wt[k]=+e.target.value;$("v_"+k).textContent=wt[k];render()});
["env","cat","fuel"].forEach(i=>$(i).addEventListener("change",render));
function score(d){
  const tot=Object.values(wt).reduce((a,b)=>a+b,0)||1;
  let v=d.s.reduce((a,x,i)=>a+x*wt[W[i][1]],0)/tot;
  const env=$("env").value;
  if(env!=="craft"&&d.hi)v+=0.8;
  if(env!=="craft"&&d.pg)v+=0.6;
  return Math.min(5,v)/5*100;
}
function render(){
  const c=$("cat").value,f=$("fuel").value;
  const rows=D.filter(d=>(c==="all"||d.cat===c)&&(f==="all"||d.fuel===f)).map(d=>({d,v:score(d)})).sort((a,b)=>b.v-a.v);
  $("list").innerHTML=rows.length?rows.map((r,i)=>`<button class="row" data-id="${r.d.id}" aria-pressed="${r.d.id===sel}"><span class="rk">${i+1}</span><span class="nm"><b>${r.d.n}</b><small>${r.d.cat} · ${r.d.fuel}</small><span class="bar"><i style="width:${r.v}%"></i></span></span><span class="sc" title="Prototype relevance score (0 to 100). Not a NASA rating.">${Math.round(r.v)}</span></button>`).join(""):"<p>No investigations match. Set Focus or Fuel back to All.</p>";
  if(rows.length&&!rows.some(r=>r.d.id===sel))sel=rows[0].d.id;
  detail();
}
function detail(){
  const d=D.find(x=>x.id===sel),env=$("env").value;
  const best=W.map(([l,k],i)=>[l,d.s[i]]).sort((a,b)=>b[1]-a[1])[0][0].toLowerCase();
  const envName=$("env").selectedOptions[0].text.split(" (")[0];
  let why=`Strongest for: ${best}.`;
  if(env!=="craft"&&d.hi)why+=` Tested at raised oxygen, which matters for a ${envName.toLowerCase()} where air is richer in O₂ than Earth’s.`;
  else if(env!=="craft"&&d.pg)why+=` Closest available stand-in for partial-gravity fire behavior.`;
  else if(env!=="craft")why+=` Useful context, but not run at the oxygen levels planned for this habitat.`;
  $("detail").innerHTML=`<h3>${d.n}</h3><p>${d.b}</p><div><span class="chip">${d.cat}</span><span class="chip">${d.fuel}</span>${d.hi?'<span class="chip hot">High-O₂ relevant</span>':""}</div><dl class="kv"><dt>Hardware</dt><dd>${d.hw}</dd><dt>Earth use</dt><dd>${d.earth}</dd></dl><p><b>Why it ranks here.</b> ${why}</p><p><a href="#inv-${d.id}">Open full page</a></p>`;
}
$("list").addEventListener("click",e=>{const b=e.target.closest(".row");if(b){sel=b.dataset.id;render()}});
[$("cA"),$("cB")].forEach((s,i)=>{s.innerHTML=D.map(d=>`<option value="${d.id}">${d.n}</option>`).join("");s.selectedIndex=i*2;s.addEventListener("change",cmp)});
function cmp(){
  const a=D.find(x=>x.id===$("cA").value),b=D.find(x=>x.id===$("cB").value);
  const r=(l,f)=>`<tr><th scope="row">${l}</th><td>${f(a)}</td><td>${f(b)}</td></tr>`;
  $("cmp").innerHTML=`<table><thead><tr><th></th><th>${a.n}</th><th>${b.n}</th></tr></thead><tbody>${r("Fire safety area",x=>x.cat)}${r("Fuel",x=>x.fuel)}${r("Hardware",x=>x.hw)}${r("Objective",x=>x.b)}${W.map(([l],i)=>r(l,x=>x.s[i]+" / 5")).join("")}</tbody></table>`;
}
function grav(z){
 $("g0").setAttribute("aria-pressed",z);$("g1").setAttribute("aria-pressed",!z);
 $("tearShape").style.opacity=z?0:1;$("sphereShape").style.opacity=z?1:0;
 $("gtext").textContent=z?"Buoyancy-driven flow is greatly reduced, so a flame is often rounder and bluer. Oxygen and heat are still carried by diffusion and by any airflow, such as ventilation. Real flame shapes depend on those conditions.":"On Earth, hot gases rise (buoyancy) and draw in fresh air, which gives the familiar flickering teardrop.";
}
$("g0").onclick=()=>grav(true);$("g1").onclick=()=>grav(false);
$("o2r").addEventListener("input",e=>{
 const v=+e.target.value;$("o2v").textContent=v;
 const up=Math.round((v/21-1)*100);
 $("o2t").textContent=v===21?"Same oxygen fraction as Earth’s air.":`${up}% more oxygen than Earth’s air, by fraction.`;
});
$("o2t").textContent="Same oxygen fraction as Earth’s air.";
render();cmp();
function invPage(d){
 const O=[["Earth air",21],["Lunar habitat (minimum expected)",30],["Highest microgravity test (CFI-G)",85],["Spacesuit",100]];
 const svg=`<svg viewBox="0 0 520 170" role="img" aria-label="Oxygen concentration reference chart" style="width:100%;max-width:560px">${O.map(([l,v],i)=>`<text x="0" y="${22+i*40}" fill="var(--ink)" font-size="13">${l}</text><rect x="0" y="${28+i*40}" width="${v*4.8}" height="10" rx="5" fill="${i===2&&d.hi?"var(--amber)":"var(--blue)"}"/><text x="${v*4.8+6}" y="${38+i*40}" fill="var(--mute)" font-size="12">${v}%</text>`).join("")}</svg>`;
 $("p-inv").innerHTML=`<p style="margin-top:24px"><a href="#explore">Back to ranking</a></p><h1 style="font-size:2.2rem">${d.n}</h1><p class="sub">${d.b}</p><div><span class="chip">${d.cat}</span><span class="chip">${d.fuel}</span>${d.hi?'<span class="chip hot">High-O₂ relevant</span>':""}</div>
 <section class="layout"><div class="panel"><h2>Score profile</h2><p class="sub">Placeholder estimates, 0 to 5.</p>${W.map(([l],i)=>`<p style="margin:10px 0 0">${l}: <b>${d.s[i]}</b></p><div class="bar"><i style="width:${d.s[i]*20}%"></i></div>`).join("")}</div>
 <div class="panel"><h2>Setup</h2><dl class="kv"><dt>Hardware</dt><dd>${d.hw}</dd><dt>Earth use</dt><dd>${d.earth}</dd></dl><p><button class="seg" style="padding:8px 16px;background:var(--blue);color:var(--bg);border:0;cursor:pointer" id="askinv">Ask the assistant about this</button></p></div></section>
 <section class="panel"><h2>Oxygen in context</h2><p class="sub">Reference levels from the challenge background, not results from ${d.n}.</p>${svg}</section>
 <section class="panel gap" style="margin-top:20px"><p style="margin:0">Measured conditions, sensors and variables for this investigation are not shown yet. They need the PSI database, which this site is not connected to.</p></section>`;
 $("askinv").onclick=()=>{location.hash="#ask";$("q").value="What should a fire safety engineer know about "+d.n+", and what are the limits of what it can tell us?";$("q").focus()};
}
 
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cats=[...new Set(R.flatMap(r=>r.c))].sort(),plats=[...new Set(R.map(r=>r.p))].sort();
$("lc").innerHTML='<option value="">All topics</option>'+cats.map(c=>`<option>${c}</option>`).join("");
$("lp").innerHTML='<option value="">All platforms</option>'+plats.map(c=>`<option>${c}</option>`).join("");
const vchip=r=>`<span class="chip ${r.ver==="excerpt"?"hot":""}">${esc(VER[r.ver])}</span>`;
function lib(){const q=$("ls").value.toLowerCase().trim(),c=$("lc").value,p=$("lp").value;
 const rows=R.filter(r=>(!c||r.c.includes(c))&&(!p||r.p===p)&&(!q||q.split(/\s+/).every(w=>JSON.stringify(r).toLowerCase().includes(w))));
 $("lcount").textContent=rows.length+" of "+R.length+" records";
 $("lib").innerHTML=rows.length?rows.map(r=>`<a class="card" href="#study-${r.id}"><h3>${esc(r.t)}</h3><div class="meta">${esc(r.a)} · ${r.y||"Year not retrieved"} · ${esc(r.p)}</div><p>${esc(r.sum)}</p><p class="meta"><b>Question:</b> ${esc(r.q)}</p><span class="chip">${esc(r.c[0])}</span>${vchip(r)}</a>`).join(""):'<p class="sub">No records match. Clear a filter or try a broader word.</p>'}
["ls","lc","lp"].forEach(i=>$(i).addEventListener("input",lib));lib();
$("stat").textContent=R.length+" NASA research records in the library · years retrieved: "+(()=>{const y=R.map(r=>+r.y).filter(Boolean);return Math.min(...y)+"–"+Math.max(...y)})();
const TYPES=["Experimental observation","Quantitative measurement","Model prediction","Authors’ interpretation"];
function studyPage(r){
 const grp={};r.f.forEach(([t,x,loc])=>(grp[t]=grp[t]||[]).push([x,loc]));
 const warn={full:"IGNIS read the full text of this source. Open the original to verify, and for figures and tables.",abstract:"IGNIS read only the abstract and metadata of this source. Findings are limited to what the abstract states.",excerpt:"IGNIS saw only search excerpts of this source. Treat everything below as unverified until you open the original."}[r.ver];
 const list=a=>a&&a.length?"<ul>"+a.map(x=>`<li>${esc(x)}</li>`).join("")+"</ul>":`<p class="sub">${NR}.</p>`;
 $("p-study").innerHTML=`<div class="st"><p style="margin-top:24px"><a href="#library">Back to library</a></p><h1 style="font-size:2rem">${esc(r.t)}</h1>
 <p class="meta">${esc(r.a)} · ${r.y||"Year not retrieved"} · ${esc(r.doc)} · ${esc(r.org)}</p><p><span class="chip">${esc(r.c.join(" · "))}</span>${vchip(r)}</p>
 <p><a href="${r.url}" target="_blank" rel="noopener">Open original source (${esc(r.rid)})</a></p>
 <div class="warn">${warn}</div>
 <h2>Summary</h2><p>${esc(r.sum)}</p>
 <h2>Research question</h2><p>${esc(r.q||"Not stated in the retrieved text.")}</p><p class="meta">Source of this question: ${esc(r.qs||"Not recorded")}</p>${r.hy?`<div class="fi pot"><span class="tag">Hypothesis stated by the authors</span><p style="margin:6px 0">${esc(r.hy)}</p></div>`:""}
 <h2>Experimental conditions</h2><div class="panel tablewrap"><table><tbody>${E.map(([l,k])=>`<tr><th scope="row">${l}</th><td>${esc(r.env[k]||NR)}</td></tr>`).join("")}</tbody></table></div>
 <h2>Sample size and uncertainty</h2><div class="panel">${list(r.unc)}</div>
 <h2>Findings</h2>${TYPES.filter(t=>grp[t]).map(t=>`<div class="fi ${t==="Model prediction"?"pot":""}"><span class="tag">${esc(t)}</span>${grp[t].map(([x,loc])=>`<p style="margin:6px 0">${esc(x)}${loc?` <span class="meta">(${esc(loc)})</span>`:""}</p>`).join("")}</div>`).join("")}<p class="sub">Types not shown above were not found in the text IGNIS read. Predictions are kept separate from measurements.</p>
 ${r.ch?chart(r):""}
 <h2>Why did it happen?</h2>${r.mech?`<div class="fi"><span class="tag">Authors’ interpretation</span>${r.mech.map(x=>`<p style="margin:6px 0">${esc(x)}</p>`).join("")}</div>`:`<p class="sub">No mechanism explanation was found in the text IGNIS read. General background is on the Science page and is not this source’s conclusion.</p>`}
 <h2>Fire-safety relevance</h2>
 <div class="fi"><span class="tag">Supported by evidence</span><p style="margin:6px 0">${esc(r.sup)}</p></div>
 <div class="fi pot"><span class="tag">Potential implication (IGNIS interpretation)</span><p style="margin:6px 0">This may help researchers understand similar conditions. It would apply only where oxygen, pressure, flow, fuel, geometry and ignition conditions are similar.</p></div>
 <div class="fi no"><span class="tag">Not established by this research</span><p style="margin:6px 0">That any material or design is safe, or that these results hold outside the tested conditions.</p></div>
 <h2>Limitations</h2><div class="panel">${list(r.lim)}</div>
 <h2>Source and traceability</h2><p>Citation key: <b>${esc(citeKey(r))}</b> · Report or DOI: ${esc(r.rid)} · <a href="${r.url}" target="_blank" rel="noopener">Original document</a></p>
 <p><button class="btn" id="askst">Ask the assistant about this study</button></p></div>`;
 $("askst").onclick=()=>{location.hash="#ask";$("q").value="Explain "+citeKey(r)+": what was observed, under what conditions, and what can’t be concluded?";$("q").focus()};
}
const KEYS=new Map(R.map(r=>[citeKey(r),r]));
function inl(el,t){t.split(/(\*\*[^*]+\*\*|NTRS \d{8,11}|(?:10|1\.0)\.\d{4,}\/[^\s\]\),;]*[^\s\]\),;.])/).forEach(p=>{if(!p)return;
 if(/^\*\*/.test(p)){const b=document.createElement("strong");b.textContent=p.slice(2,-2);el.append(b)}
 else if(/^NTRS \d{8,11}$/.test(p)||/^10\.\d{4,}\//.test(p)){const rec=KEYS.get(p);
  if(rec){const a=document.createElement("a");a.href=rec.url;a.target="_blank";a.rel="noopener";a.textContent=p;a.title=rec.t;el.append(a)}
  else{const s=document.createElement("span");s.className="badcite";s.textContent=p+" (not in the IGNIS library: unverified)";el.append(s)}}
 else el.append(p)})}
function setMsg(el,t){el.textContent="";let ul=null;t.split("\n").forEach(line=>{const l=line.trim();if(!l){ul=null;return}let m;
 if((m=l.match(/^#{1,4}\s+(.*)/))||(m=l.match(/^\*\*([^*]+)\*\*:?$/))){ul=null;const h=document.createElement("h4");inl(h,m[1]);el.append(h)}
 else if((m=l.match(/^[-*•]\s+(.*)/))){if(!ul){ul=document.createElement("ul");el.append(ul)}const li=document.createElement("li");inl(li,m[1]);ul.append(li)}
 else{ul=null;const p=document.createElement("p");inl(p,l);el.append(p)}});$("chat").scrollTop=1e9}

function chart(r){return `<h2>Chart</h2><div class="panel"><p class="sub" style="margin:0 0 8px">Limiting oxygen concentration for flame spread, % O₂ (quantitative values stated in the abstract; same study, so comparable).</p>`+r.ch.map(([l,v])=>`<div class="br"><span class="l">${l}</span><div class="bar"><i style="width:${v*3.5}%"></i></div><b>${v}%</b></div>`).join("")+`</div>`}
const cls=t=>t==="Comparable"?"c":t==="Not reported"?"":t==="Not directly comparable"?"n":"p";
const isNR=v=>!v||/not (retrieved|reported|tabulated)|values not|unknown/i.test(v);
const vague=v=>/varied|varies|up to|low[- ]speed|reduced|several|range|\bto\b.*\bcm\/s|\bto\b.*%/i.test(v);
const DIM=[["Research platform","p"],["Gravity environment","env.grav"],["Oxygen concentration","env.o2"],["Ambient pressure","env.pr"],["Oxidizer flow","env.flow"],["Fuel or material","env.fuel"],["Sample dimensions","env.size"],["Ignition method","env.ign"],["Test duration","env.dur"],["Evidence types reported","ft"]];
const gv=(r,k)=>k==="p"?r.p:k==="ft"?[...new Set(r.f.map(x=>x[0]))].sort().join(", "):r.env[k.slice(4)]||"";
// A status is never "Comparable" just because two strings look alike: vague or ranged values are only partially comparable,
// differing conditions are not directly comparable, and missing values are never filled in.
function stat(a,b,k){const x=gv(a,k),y=gv(b,k);
 if(k==="ft")return x===y?"Partially comparable":"Different measurement method";
 if(isNR(x)||isNR(y))return"Not reported";
 const same=x.toLowerCase()===y.toLowerCase();
 if(k==="p")return same?"Comparable":"Partially comparable";
 if(k==="env.grav"&&!same)return/micro/i.test(x)&&/micro/i.test(y)?"Partially comparable":"Not directly comparable";
 if(same)return vague(x)?"Partially comparable":"Comparable";
 return"Not directly comparable"}
function verdict(rows){const g=k=>rows.find(r=>r.k===k),key=["env.grav","env.fuel","env.o2","env.flow"].map(g);
 const hard=key.filter(r=>r.st==="Not directly comparable");
 if(hard.length)return["Not directly comparable","Different "+hard.map(r=>r.l.toLowerCase()).join(", ")+". Do not set numerical results from these studies against each other."];
 const nr=key.filter(r=>r.st==="Not reported");
 if(nr.length)return["Partially comparable","Not reported in at least one study: "+nr.map(r=>r.l.toLowerCase()).join(", ")+". Only a qualitative comparison is possible."];
 return["Partially comparable","The reported conditions match, but IGNIS does not hold the measured quantities, so it cannot confirm that the same quantity was measured. Check the original papers."]}
const lA=$("lA"),lB=$("lB");[lA,lB].forEach((e,i)=>{e.innerHTML=R.map(r=>`<option value="${r.id}">${esc(r.t.slice(0,70))}</option>`).join("");e.selectedIndex=i?3:2;e.addEventListener("change",labCmp)});
function labCmp(){const a=R.find(r=>r.id===lA.value),b=R.find(r=>r.id===lB.value);
 if(a===b){$("lres").innerHTML='<div class="panel" role="alert">Choose two different studies.</div>';return}
 const rows=DIM.map(([l,k])=>({l,k,x:gv(a,k),y:gv(b,k),st:stat(a,b,k)}));
 const li=a=>a.length?"<ul>"+a.map(t=>`<li>${t}</li>`).join("")+"</ul>":"<p class=sub>None identified from the retrieved text.</p>";
 const sim=rows.filter(r=>r.st==="Comparable").map(r=>`${r.l}: ${esc(r.x)}`);const sc=a.c.filter(c=>b.c.includes(c));if(sc.length)sim.push("Shared topics: "+esc(sc.join(", ")));
 const dif=rows.filter(r=>/Partially|Not directly|Different/.test(r.st)).map(r=>`${r.l}: ${esc(r.x)} versus ${esc(r.y)} <span class="stt ${cls(r.st)}">${r.st}</span>`);
 const nr=rows.filter(r=>r.st==="Not reported").map(r=>r.l);
 const [vs,vt]=verdict(rows);
 const side=t=>t.f.map(x=>`<div class="fi ${x[0]==="Model prediction"?"pot":""}"><span class="tag">${esc(x[0])}</span> ${esc(x[1])}</div>`).join("");
 $("lres").innerHTML=`<div class="panel"><h3>Overall comparability: <span class="stt ${cls(vs)}">${vs}</span></h3><p>${esc(vt)}</p><p class="sub" style="margin:0">Verification: A is “${esc(VER[a.ver])}”, B is “${esc(VER[b.ver])}”.</p></div>
 <div class="panel tablewrap" style="margin-top:12px"><table><thead><tr><th>Dimension</th><th>${esc(a.t.slice(0,50))}</th><th>${esc(b.t.slice(0,50))}</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r.l}</th><td>${esc(r.x||NR)}</td><td>${esc(r.y||NR)}</td><td><span class="stt ${cls(r.st)}">${r.st}</span></td></tr>`).join("")}</tbody></table></div>
 <div class="dz" style="margin-top:16px"><div class="panel"><h3>Key similarities</h3>${li(sim)}</div><div class="panel"><h3>Key differences</h3>${li(dif)}</div>
 <div class="panel"><h3>Not reported</h3><p>${nr.length?nr.join(", ")+" (missing in at least one study; not compared and not estimated).":"All listed dimensions are reported."}</p></div>
 <div class="panel"><h3>Why differences matter</h3><p>Oxygen, pressure, flow, gravity, fuel and geometry each change flame behavior, so results under different conditions are not automatically equivalent.</p></div></div>
 <h2 style="margin-top:32px">Reported findings, side by side</h2><div class="dz"><div class="panel"><h3>${esc(a.t.slice(0,60))}</h3>${side(a)}</div><div class="panel"><h3>${esc(b.t.slice(0,60))}</h3>${side(b)}</div></div>
 <div class="dz" style="margin-top:16px"><div class="panel"><h3>Findings that agree or differ</h3><p>Not assessed. IGNIS does not hold matched, quantified results under equal conditions for both studies, so it will not claim agreement or conflict.</p></div>
 <div class="panel"><h3>Possible reasons for differences (IGNIS interpretation)</h3><p>${dif.length?"Differences in platform, fuel, scale or measurement method could contribute. The authors do not state this.":"No difference to interpret."}</p></div>
 <div class="panel"><h3>What can reasonably be concluded</h3><p>Which conditions each study reports and what its authors state. Nothing about which study’s condition is safer.</p></div>
 <div class="panel"><h3>What cannot be concluded</h3><p>That one material, condition or design is safer than another, or that either result applies outside its tested conditions.</p></div></div>
 <div class="panel" style="margin-top:16px"><h3>Chart</h3><p>No chart. The two studies do not share numerically comparable measured values, and IGNIS will not plot incompatible numbers.</p></div>
 <p class="meta">Sources: <a href="${a.url}" target="_blank" rel="noopener">${esc(a.rid)}</a> · <a href="${b.url}" target="_blank" rel="noopener">${esc(b.rid)}</a></p>`}
labCmp();
const INS=[
["Buoyancy changes flame shape and spread behavior","Under the tested conditions, flames in microgravity differed from 1-g flames. For PMMA at the same pressure and oxygen, the microgravity flame was rounder, bluer and wider, and the authors link this to the loss of buoyant flow. In the large fabric test the concurrent flame size stayed constrained, unlike 1-g upward spread.",["s41598-017-18398-4","20170008805"],["Experimental observation","Authors’ interpretation"],"PMMA rods at opposed flow 0.4–8 cm/s (ISS) against ground tests; a 94 × 40.6 cm fabric at 20 cm/s (Cygnus).","Two independent test types. One full text and one abstract were read.","Different materials, scales and flows. No test at lunar conditions.","This may bear on how 1-g material tests are interpreted. It does not show how a specific material will behave.","Matched tests across gravity levels, including partial gravity."],
["Oxygen and flow together set whether a flame survives","In these tests flame spread depended on oxygen and flow together. A fabric quenched at 1 to 5 cm/s, at higher flow in lower oxygen. PMMA spread was sustained at 17% oxygen in microgravity but not at 18% in normal gravity. A poster reports steady PMMA spread at 13.6% against a 16% 1-g limit (preliminary).",["20150008962","s41598-017-18398-4","20160000593"],["Quantitative measurement","Model prediction","Authors’ interpretation"],"SIBAL fabric in concurrent flow at 1 atm; PMMA in low opposed flow; all in the ISS glovebox.","Three source-checked records, each on one material under low flow.","Different materials and apparatus. The poster is preliminary and states its airflow limit inconsistently.","The authors interpret this as a possible higher fire risk under certain conditions. Oxygen alone does not set risk.","Tests across spacecraft pressures, higher oxygen and varied flow."],
["Extinguishment cannot be assumed to be quick","In Saffire IV and V, cotton jersey regrew after 70 s without flow and two-sided PMMA burned on after flow was cut. After 300 s at 5 cm/s, two PMMA samples went out immediately when flow stopped. The authors caution that reduced flow as a strategy carries other risks. The PMMA paper adds that a lower limiting oxygen in microgravity may mean more suppressant is needed (authors’ interpretation).",["20210011521","s41598-017-18398-4"],["Experimental observation","Authors’ interpretation"],"Five successful flight tests, 20 cm/s flow, 70.7–100 kPa, 22–26.2% oxygen.","One flight series with five tests, different materials each time.","Not a test of suppression agents on solids. Unoccupied vehicle.","This may be relevant to response planning. It is not a recommended procedure.","Tests of agents and flow strategies on solid materials."],
["Low flow can allow vapor to accumulate and ignite strongly","Two Saffire samples ignited as deflagrations from stratified fuel-vapor mixtures. The authors suggest reduced airflow and obstructions can allow vapor to accumulate.",["20210011521"],["Experimental observation","Authors’ interpretation"],"PMMA samples, 20 cm/s flow; one at 100 kPa and 22% oxygen, one at 72.6 kPa and 25.7%.","Two events in one flight series.","Too few events to generalize.","Suggests airflow management could matter for ignition. This may have implications for habitat ventilation; further investigation is needed.","Systematic ignition tests that vary flow and geometry."],
["Scale and geometry matter","Large-scale tests showed flame behavior depends on the size of the experiment and enclosure. A flame in a larger tunnel spread more slowly than in smaller tunnels, and reducing the duct height raised the spread rate on thin fabric. Rib width mattered for structured PMMA.",["20170008805","20180005168","20210011521"],["Experimental observation","Authors’ interpretation"],"Fabric and PMMA on Cygnus; ducts 25–46 cm high.","Authors’ statements across three records, one full text read.","Different materials and flows. Some explanations are from cited models.","Suggests small samples may not predict full-scale fire behavior. It does not give a scaling rule.","More scales and geometries."],
["Smoke may stay near its source, and early detection targets pyrolysis products","The authors say that without buoyant flow particles concentrate at the source and take longer to reach detectors, so early detection targets pyrolysis products rather than soot. SAME smoke came from overheating materials, not flames.",["20170007283","10.1080/02786826.2015.1025124","19990020833","20050215648"],["Authors’ interpretation","Quantitative measurement"],"Overheated spacecraft materials; SAME in low gravity with ground reference tests.","Abstract-level for two records; the other two are search excerpts only (unverified).","Flaming and large-scale smoke detection are not covered by these records.","May inform detector sensitivity and placement.","Detection tests for flaming and large-scale fires."],
["In these tests, gases changed more than temperature or pressure","In the Saffire results, the temperature and pressure rise in the spacecraft were less significant than the rise in carbon dioxide and carbon monoxide. Heat release reached up to 10 kW without average vehicle conditions becoming unacceptable.",["20210011521","20240002981"],["Quantitative measurement","Authors’ interpretation"],"Large samples on an unoccupied Cygnus with 17–19 m³ free volume.","Preliminary; one Saffire VI abstract and a full Saffire IV and V paper.","A specific cabin volume and materials.","May bear on how crews respond to fire. It is not a safety guarantee.","More tests and full analyses."],
["Inert gases change droplet-flame extinction limits","FLEX varied carbon dioxide and helium dilution. The excerpts report both diffusive and radiative extinction and limiting oxygen values for methanol and heptane droplets.",["20130014061","10.1007/s12217-014-9372-2","20150023456"],["Quantitative measurement","Model prediction"],"Liquid droplets in a quiescent atmosphere at 0.7–3 atm.","Search excerpts only (unverified).","Liquid droplets, not solid materials or a cabin fire.","It does not show how to suppress solid-material or cabin fires.","Confirm numbers in the originals; test solids and flow."]];
$("ins").innerHTML=INS.map(([t,e,ids,ty,cn,cf,lm,rl,fr])=>`<div class="panel" style="margin-bottom:16px"><h2>${t}</h2><p>${e}</p><p class="meta">Evidence: ${ids.map(i=>`<a href="#study-${i}">${esc(citeKey(R.find(r=>r.id===i)))}</a>`).join(" · ")}</p><p>${ty.map(x=>`<span class="tag chip">${esc(x)}</span>`).join("")}<span class="tag chip">IGNIS interpretation</span></p><dl class="kv"><dt>Conditions</dt><dd>${cn}</dd><dt>Evidence strength (IGNIS description)</dt><dd>${cf}</dd><dt>Limitations</dt><dd>${lm}</dd><dt>Spacecraft relevance</dt><dd>${rl}</dd><dt>Further research</dt><dd>${fr}</dd></dl></div>`).join("")+`<div class="panel gap"><h2>Research gaps</h2><ul><li>No partial-gravity (Moon or Mars) combustion data in PSI yet, per the challenge brief.</li><li>Saffire V tested about 71–73 kPa with 25–26% oxygen. No library record tests 30% oxygen or more at spacecraft scale, and the 85% oxygen CFI-G tests named in the brief are not in the library.</li><li>Ambient pressure is not reported for ${R.filter(r=>isNR(r.env.pr)).length} of ${R.length} records.</li><li>Sample sizes are small: five successful Saffire IV and V tests, 6 quenching cases in the BASS-II fabric study, and non-systematic microgravity PMMA data.</li><li>One source states its airflow limit inconsistently (BASS-II poster: 53, 40 and 0–55 cm/s).</li><li>Suppression evidence is limited to liquid droplets and is excerpt-level (unverified).</li><li>Detection evidence covers smoke from overheating, not flaming or large-scale smoke detection.</li><li>The library holds ${R.length} records, ${R.filter(r=>r.ver==="full").length} read in full. Absence here is not absence of research. Raw PSI data is not connected.</li></ul></div>`;
function bars(t,o){const m=Math.max(...Object.values(o));return `<div class="panel"><h3>${t}</h3>${Object.entries(o).map(([k,v])=>`<div class="br"><span class="l" title="${esc(k)}">${esc(k)}</span><div class="bar"><i style="width:${v/m*100}%"></i></div><b>${v}</b></div>`).join("")}</div>`}
const cnt=a=>a.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
$("dash").innerHTML=`<h2>Mission dashboard</h2><p class="sub">Counts come from the ${R.length} records in the library. None is padded.</p><div class="dz">${bars("By topic",cnt(R.flatMap(r=>r.c)))}${bars("By year",cnt(R.map(r=>r.y||"Not retrieved")))}${bars("By platform",cnt(R.map(r=>r.p)))}${bars("Evidence types in findings",cnt(R.flatMap(r=>r.f.map(x=>x[0]))))}${bars("Verification level",cnt(R.map(r=>VER[r.ver])))}</div><p class="sub" style="margin-top:12px">Latest additions: ${R.slice(-3).map(r=>`<a href="#study-${r.id}">${esc(citeKey(r))}</a>`).join(" · ")}. Themes and gaps: <a href="#insights">Insights</a>.</p>`;
function ld(u){return new Promise((ok,no)=>{if(window.pdfjsLib)return ok();const e=document.createElement("script");e.src=u;e.onload=ok;e.onerror=()=>no(new Error("the PDF reader library could not load; internet access is needed"));document.head.append(e)})}
$("pdf").addEventListener("change",async e=>{const f=e.target.files[0],o=$("pdfr");if(!f)return;o.textContent="Reading "+f.name+"...";
 try{await ld("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let t="";const n=Math.min(d.numPages,5);
  for(let i=1;i<=n;i++){const c=await(await d.getPage(i)).getTextContent();t+=c.items.map(x=>x.str).join(" ")+"\n"}
  if(t.trim().length<40)throw new Error("no text layer");
  const doi=(t.match(/10\.\d{4,}\/[^\s"<>]+/)||[])[0];
  o.innerHTML=`<b>Text extracted from the first ${n} of ${d.numPages} pages.</b> Not validated and not added to the library. ${doi?"Possible DOI: "+esc(doi)+".":"No DOI found."}<pre class="x">${esc(t.slice(0,2500))}</pre>`;
 }catch(err){o.textContent="Extraction failed: "+(err.message||"unknown error")+". Scanned PDFs without a text layer need OCR, which is not available here."}});
const pgs=[...document.querySelectorAll(".pg")];
let firstRoute=true;
function route(){let h=(location.hash||"#home").slice(1),iv=h.startsWith("inv-")&&D.find(x=>x.id===h.slice(4));if(iv){invPage(iv);h="inv"}const st=h.startsWith("study-")&&R.find(x=>x.id===h.slice(6));if(st){studyPage(st);h="study"}const k=pgs.some(p=>p.id==="p-"+h)?h:"home";
 pgs.forEach(p=>p.classList.toggle("on",p.id==="p-"+k));
 const nk=k==="inv"?"explore":k==="study"?"library":k;
 document.querySelectorAll("nav a").forEach(a=>{if(a.getAttribute("href")==="#"+nk)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
 document.title="IGNIS AI";window.scrollTo(0,0);
 if(!firstRoute){const t=document.querySelector("#p-"+k+" h1, #p-"+k+" h2");if(t){t.setAttribute("tabindex","-1");t.focus({preventScroll:true})}}
 firstRoute=false}
addEventListener("hashchange",route);route();
$("skip").addEventListener("click",e=>{e.preventDefault();const m=$("main");m.setAttribute("tabindex","-1");m.focus()});
let hist=[],ai=false;
(async()=>{try{const r=await fetch("/api/health");ai=!!(await r.json()).aiConfigured}catch(e){ai=false}
 $("mode").textContent=ai?"Live AI mode: answers are generated by Google Gemini through this site’s server. They can be wrong; verify important claims in the linked sources.":"Fallback mode: the live AI is not available, so answers come from a short built-in list and are labelled as such."})();
["Why is a flame rounder in freefall?","Why doesn’t oxygen concentration alone set ignition risk?","What can’t this data tell us yet?","What did Saffire IV and V find about extinguishment?"].forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>{$("q").value=t;send()};$("sug").append(b)});
function add(c,t){const d=document.createElement("div");d.className="m "+c;d.textContent=t;$("chat").append(d);$("chat").scrollTop=1e9;return d}
function local(q){q=q.toLowerCase();let best=null,n=0;QA.forEach(([k,a])=>{const c=k.split(" ").filter(w=>q.includes(w.slice(0,5))).length;if(c>n){n=c;best=a}});return best||"Built-in fallback answer (not a live AI response): no built-in answer covers this question. Try the Research Library, Comparison Lab or Insights, or ask again when the live assistant is available."}
function srcTag(el,t){const d=document.createElement("div");d.className="src";d.textContent=t;el.prepend(d)}
let busy=false;
async function send(){const q=$("q").value.trim();if(!q||busy)return;busy=true;$("go").disabled=true;$("chat").setAttribute("aria-busy","true");$("q").value="";add("u",q);const out=add("a","");out.textContent="Thinking...";
 const done=()=>{busy=false;$("go").disabled=false;$("chat").setAttribute("aria-busy","false")};
 if(!ai){out.textContent=local(q);done();return}
 hist.push({role:"user",content:q});
 try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist.slice(-8)})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||"request failed");
  setMsg(out,j.text);srcTag(out,"Live AI answer (Gemini). Can be wrong; check the cited sources.");
  if(j.truncated){const p=document.createElement("p");p.className="sub";p.textContent="This answer was cut off because it reached the length limit.";out.append(p)}
  hist.push({role:"assistant",content:j.text})}
 catch(e){hist.pop();out.textContent="The live AI could not answer ("+(e.message||"error")+"). "+local(q)}
 done()}
$("go").onclick=send;$("q").addEventListener("keydown",e=>{if(e.key==="Enter")send()});
